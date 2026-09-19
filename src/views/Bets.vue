<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('bets.title') }}</h1>

    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="grouped.length === 0" class="text-gray-400">
      {{ $t('bets.none') }}
      <router-link to="/" class="text-indigo-600">{{ $t('bets.goToRaces') }}</router-link>.
    </div>
    <div v-else>
      <p class="text-sm text-gray-500 mb-4">
        {{ $t('bets.count', betCount) }}
        &middot; {{ $t('bets.total') }}: <span class="font-semibold text-gray-900">{{ totalPoints }} {{ $t('common.points') }}</span>
      </p>

      <div v-for="g in grouped" :key="g.race.id" class="bg-white rounded-lg shadow-sm border mb-4">
        <div class="px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <router-link :to="`/races/${g.race.id}`" class="font-semibold text-indigo-600 hover:underline">
              {{ g.race.name }}
            </router-link>
            <p class="text-sm text-gray-500">{{ formatDate(g.race.date) }} &middot; {{ g.race.tier }}</p>
          </div>
          <button
            type="button"
            class="flex items-center gap-2 shrink-0"
            :aria-expanded="isExpanded(g.race.id)"
            @click="toggleRace(g.race.id)"
          >
            <span class="text-xs font-medium px-2.5 py-1 rounded-full" :class="statusClass(g)">
              {{ $t(statusLabel(g)) }}
            </span>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-4 w-4 text-gray-400 transition-transform"
              :class="{ 'rotate-180': isExpanded(g.race.id) }"
            >
              <path fill-rule="evenodd" d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div v-if="isExpanded(g.race.id)">
        <div v-for="d in g.divisions" :key="d.division" class="mt-3">
          <div class="px-4 py-1.5 bg-gray-50 border-t border-b text-xs font-semibold uppercase tracking-wide text-gray-500">
            {{ $t(d.label) }}
          </div>
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b text-left text-gray-500">
                <th class="p-3 py-2">{{ $t('common.prediction') }}</th>
                <th class="p-3 py-2">{{ $t('common.athlete') }}</th>
                <th class="p-3 py-2">{{ $t('common.result') }}</th>
                <th class="p-3 py-2">{{ $t('common.points') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in d.bets" :key="b.id" class="border-b last:border-0">
                <td class="p-3 font-bold">{{ b.predicted_position }}</td>
                <td class="p-3">
                  <span class="inline-flex items-center gap-2">
                    <span v-if="b.athletes?.country" class="text-base leading-none">{{ flag(b.athletes.country) }}</span>
                    {{ b.athletes?.full_name }}
                  </span>
                </td>
                <td class="p-3">{{ actualPosition(g.race.id, b) ?? '–' }}</td>
                <td class="p-3 font-semibold">{{ b.points }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { flag } from '../lib/flags'

const { locale } = useI18n()
const auth = useAuthStore()
const loading = ref(true)
const grouped = ref([])
const resultMap = ref({})
const racesWithResults = ref(new Set())
const expanded = ref(new Set())

const betCount = computed(() => grouped.value.reduce((sum, g) => sum + g.divisions.reduce((s, d) => s + d.bets.length, 0), 0))
const totalPoints = computed(() => grouped.value.reduce((sum, g) => sum + g.divisions.reduce((s, d) => s + d.bets.reduce((p, b) => p + (b.points || 0), 0), 0), 0))

onMounted(async () => {
  const { data: bets } = await supabase
    .from('bets')
    .select('*, races(*), athletes(*)')
    .eq('user_id', auth.user.id)

  if (bets?.length) {
    const raceIds = [...new Set(bets.map((b) => b.race_id))]
    const { data: results } = await supabase
      .from('race_results')
      .select('race_id, athlete_id, division, position')
      .in('race_id', raceIds)

    const map = {}
    for (const rr of results || []) {
      map[`${rr.race_id}:${rr.division}:${rr.athlete_id}`] = rr.position
    }
    resultMap.value = map
    racesWithResults.value = new Set((results || []).map((rr) => rr.race_id))

    const byRace = {}
    for (const b of bets) {
      if (!byRace[b.race_id]) byRace[b.race_id] = []
      byRace[b.race_id].push(b)
    }

    grouped.value = Object.values(byRace)
      .map((betsArr) => {
        const byDiv = {}
        for (const b of betsArr) {
          if (!byDiv[b.division]) byDiv[b.division] = []
          byDiv[b.division].push(b)
        }
        return {
          race: betsArr[0].races,
          divisions: ['FPRO', 'MPRO']
            .filter((div) => byDiv[div])
            .map((div) => ({
              division: div,
              label: div === 'FPRO' ? 'common.women' : 'common.men',
              bets: byDiv[div].sort((a, b) => a.predicted_position - b.predicted_position),
            })),
        }
      })
      .sort((a, b) => new Date(b.race.date) - new Date(a.race.date))
  }

  loading.value = false
})

function actualPosition(raceId, bet) {
  return resultMap.value[`${raceId}:${bet.division}:${bet.athlete_id}`] ?? null
}

function isExpanded(raceId) {
  return expanded.value.has(raceId)
}

function toggleRace(raceId) {
  const next = new Set(expanded.value)
  if (next.has(raceId)) {
    next.delete(raceId)
  } else {
    next.add(raceId)
  }
  expanded.value = next
}

function isLocked(race) {
  const d = new Date(race.date)
  d.setDate(d.getDate() - 1)
  d.setHours(23, 59, 59, 999)
  return new Date() > d
}

function statusClass(g) {
  if (!isLocked(g.race)) return 'bg-green-50 text-green-700'
  if (racesWithResults.value.has(g.race.id)) return 'bg-indigo-50 text-indigo-700'
  return 'bg-amber-50 text-amber-700'
}

function statusLabel(g) {
  if (!isLocked(g.race)) return 'bets.open'
  if (racesWithResults.value.has(g.race.id)) return 'bets.scored'
  return 'bets.closed'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>