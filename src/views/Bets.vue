<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">My bets</h1>

    <div v-if="loading" class="text-gray-500">Loading...</div>
    <div v-else-if="grouped.length === 0" class="text-gray-400">
      You haven't placed any bets yet.
      <router-link to="/" class="text-indigo-600">Go to the races</router-link>.
    </div>
    <div v-else>
      <p class="text-sm text-gray-500 mb-4">
        {{ betCount }} bet{{ betCount !== 1 ? 's' : '' }}
        &middot; Total: <span class="font-semibold text-gray-900">{{ totalPoints }} pts</span>
      </p>

      <div v-for="g in grouped" :key="g.race.id" class="bg-white rounded-lg shadow-sm border mb-4">
        <div class="px-4 pt-4 flex items-start justify-between gap-4">
          <div>
            <router-link :to="`/races/${g.race.id}`" class="font-semibold text-indigo-600 hover:underline">
              {{ g.race.name }}
            </router-link>
            <p class="text-sm text-gray-500">{{ formatDate(g.race.date) }} &middot; {{ g.race.tier }}</p>
          </div>
          <span class="text-xs font-medium px-2.5 py-1 rounded-full" :class="statusClass(g)">
            {{ statusLabel(g) }}
          </span>
        </div>
        <table class="w-full text-sm mt-3">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="p-3 py-2">Pred</th>
              <th class="p-3 py-2">Athlete</th>
              <th class="p-3 py-2">Result</th>
              <th class="p-3 py-2">Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in g.bets" :key="b.id" class="border-b last:border-0">
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
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { flag } from '../lib/flags'

const auth = useAuthStore()
const loading = ref(true)
const grouped = ref([])
const resultMap = ref({})
const racesWithResults = ref(new Set())

const betCount = computed(() => grouped.value.reduce((sum, g) => sum + g.bets.length, 0))
const totalPoints = computed(() => grouped.value.reduce((sum, g) => sum + g.bets.reduce((s, b) => s + (b.points || 0), 0), 0))

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
      .map((betsArr) => ({
        race: betsArr[0].races,
        bets: betsArr.sort((a, b) => a.predicted_position - b.predicted_position),
      }))
      .sort((a, b) => new Date(b.race.date) - new Date(a.race.date))
  }

  loading.value = false
})

function actualPosition(raceId, bet) {
  return resultMap.value[`${raceId}:${bet.division}:${bet.athlete_id}`] ?? null
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
  if (!isLocked(g.race)) return 'Betting open'
  if (racesWithResults.value.has(g.race.id)) return 'Scored'
  return 'Betting closed'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>