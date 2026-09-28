<template>
  <div>
    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="!group" class="text-gray-500">{{ $t('groupDetail.notFound') }}</div>
    <div v-else>
      <div class="mb-6">
        <router-link :to="`/groups/${group.id}`" class="text-sm text-indigo-600 hover:underline">
          &larr; {{ $t('groupBets.backToGroup') }}
        </router-link>
        <h1 class="text-2xl font-bold mt-1">{{ group.name }}</h1>
        <p class="text-sm text-gray-500">{{ $t('groupBets.title') }}</p>
      </div>

      <div v-if="!divisions.length" class="text-gray-400">{{ $t('groupBets.none') }}</div>
      <div v-else>
        <div class="flex gap-2 mb-4">
          <button
            v-for="div in divisions"
            :key="div"
            :class="['btn-tab', activeDivision === div ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = div"
          >
            {{ div === 'FPRO' ? $t('common.women') : $t('common.men') }}
          </button>
        </div>

        <div
          v-if="showLegend"
          class="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-xs text-gray-500"
        >
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-sm border border-green-300 bg-green-100"></span>
            {{ $t('groupBets.legendExact') }}
          </span>
          <span class="inline-flex items-center gap-1.5">
            <span class="h-2.5 w-2.5 rounded-sm border border-orange-300 bg-orange-100"></span>
            {{ $t('groupBets.legendTop5') }}
          </span>
        </div>

        <div v-for="c in cards" :key="c.race.id" class="bg-white rounded-lg shadow-sm border mb-4">
          <div class="px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <router-link
                :to="`/races/${c.race.id}`"
                class="font-semibold text-indigo-600 hover:underline"
              >
                {{ c.race.name }}
              </router-link>
              <p class="text-sm text-gray-500">
                {{ formatDate(c.race.date) }} &middot; {{ c.race.tier }}
                <template v-if="c.race.location"> &middot; {{ c.race.location }}</template>
              </p>
            </div>
            <span
              class="text-xs font-medium px-2.5 py-1 rounded-full shrink-0"
              :class="statusClass(c)"
            >
              {{ $t(statusLabel(c)) }}
            </span>
          </div>

          <div v-if="c.div.results.length" class="border-t">
            <button
              type="button"
              class="w-full flex items-center justify-between gap-2 px-4 py-2 text-left"
              :aria-expanded="isResultsExpanded(c.race.id)"
              :aria-label="
                isResultsExpanded(c.race.id)
                  ? $t('groupBets.hideResults')
                  : $t('groupBets.showResults')
              "
              @click="toggleResults(c.race.id)"
            >
              <span class="text-sm font-semibold">{{ $t('groupBets.results') }}</span>
              <ChevronIcon :open="isResultsExpanded(c.race.id)" />
            </button>
            <div v-if="isResultsExpanded(c.race.id)" class="pb-3">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-y text-left text-gray-500">
                    <th class="px-4 py-2">{{ $t('common.position') }}</th>
                    <th class="px-4 py-2">{{ $t('common.athlete') }}</th>
                    <th class="px-4 py-2">{{ $t('race.time') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="r in c.div.results"
                    :key="`${r.athlete_id}`"
                    class="border-b last:border-0"
                  >
                    <td class="px-4 py-2 font-bold">{{ r.position }}</td>
                    <td class="px-4 py-2">
                      <span class="inline-flex items-center gap-2">
                        <span v-if="r.athletes?.country" class="text-base leading-none">{{
                          flag(r.athletes.country)
                        }}</span>
                        {{ r.athletes?.full_name }}
                      </span>
                    </td>
                    <td class="px-4 py-2">{{ r.finish_time }}</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-xs text-gray-500 px-4 mt-2">{{ $t('groupBets.resultsHint') }}</p>
            </div>
          </div>

          <div
            class="px-4 py-2 bg-gray-50 border-t text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            {{ c.div.scored ? $t('groupBets.ranking') : $t('groupBets.whoBet') }}
          </div>

          <div v-for="(m, i) in c.div.members" :key="m.user_id" class="border-t">
            <button
              type="button"
              class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              :aria-expanded="isMemberExpanded(c.race.id, m.user_id)"
              :aria-label="
                isMemberExpanded(c.race.id, m.user_id)
                  ? $t('groupBets.hideBets', { name: m.display_name })
                  : $t('groupBets.showBets', { name: m.display_name })
              "
              @click="toggleMember(c.race.id, m.user_id)"
            >
              <span v-if="c.div.scored" class="font-bold text-gray-400 w-6">{{ i + 1 }}.</span>
              <span class="flex-1 truncate">{{ m.display_name }}</span>
              <span v-if="c.div.scored" class="text-xs text-gray-500 shrink-0">
                {{ $t('groupBets.exactCount', m.exactPicks) }}
              </span>
              <span class="text-xs text-gray-500 shrink-0">{{
                $t('groupBets.betCount', m.betCount)
              }}</span>
              <span
                v-if="c.div.scored"
                class="text-sm font-semibold text-gray-900 w-16 text-right shrink-0"
              >
                {{ m.points }} {{ $t('common.points') }}
              </span>
              <ChevronIcon :open="isMemberExpanded(c.race.id, m.user_id)" />
            </button>

            <table v-if="isMemberExpanded(c.race.id, m.user_id)" class="w-full text-sm">
              <thead>
                <tr class="border-y text-left text-gray-500">
                  <th class="px-4 py-2">{{ $t('common.pred') }}</th>
                  <th class="px-4 py-2">{{ $t('common.athlete') }}</th>
                  <th class="px-4 py-2">{{ $t('common.result') }}</th>
                  <th class="px-4 py-2">{{ $t('common.points') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="b in m.bets"
                  :key="b.id"
                  class="border-b last:border-0"
                  :class="rowClass(b)"
                >
                  <td class="px-4 py-2 font-bold">{{ b.predicted_position }}</td>
                  <td class="px-4 py-2">
                    <span class="inline-flex items-center gap-2">
                      <span v-if="b.athletes?.country" class="text-base leading-none">{{
                        flag(b.athletes.country)
                      }}</span>
                      {{ b.athletes?.full_name }}
                    </span>
                  </td>
                  <td class="px-4 py-2 font-bold">{{ b.actual_position ?? '–' }}</td>
                  <td class="px-4 py-2 font-semibold">{{ b.points }}</td>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { flag } from '../lib/flags'
import { betPoints } from '../lib/scoring'
import ChevronIcon from '../components/ChevronIcon.vue'

const route = useRoute()
const { locale } = useI18n()

const loading = ref(true)
const group = ref(null)
const raceGroups = ref([])
const divisions = ref([])
const activeDivision = ref('FPRO')
const expandedMembers = ref(new Set())
const collapsedResults = ref(new Set())

const cards = computed(() =>
  raceGroups.value
    .map((r) => ({ ...r, div: r.divisions[activeDivision.value] }))
    .filter((c) => c.div)
)

const showLegend = computed(() => cards.value.some((c) => c.div.scored))

function rowClass(bet) {
  if (bet.points === 3) return 'bg-green-50'
  if (bet.points === 1) return 'bg-orange-50'
  return ''
}

onMounted(async () => {
  const { data: g } = await supabase.from('groups').select('*').eq('id', route.params.id).single()
  group.value = g

  if (g) {
    const { data: memberRows } = await supabase
      .from('group_members')
      .select('user_id, profiles!inner(display_name)')
      .eq('group_id', g.id)

    const displayNames = new Map()
    for (const m of memberRows || []) {
      if (m.profiles?.display_name) displayNames.set(m.user_id, m.profiles.display_name)
    }

    if (displayNames.size) {
      const { data: bets } = await supabase
        .from('bets')
        .select(
          'id, user_id, race_id, division, athlete_id, predicted_position, races(*), athletes(*)'
        )
        .in('user_id', [...displayNames.keys()])

      if (bets?.length) {
        const raceIds = [...new Set(bets.map((b) => b.race_id))]
        const { data: results } = await supabase
          .from('race_results')
          .select('race_id, athlete_id, division, position, finish_time, athletes(*)')
          .in('race_id', raceIds)
          .not('position', 'is', null)
          .order('position')

        raceGroups.value = buildRaceGroups(bets, results || [], displayNames)
        divisions.value = ['FPRO', 'MPRO'].filter((div) =>
          raceGroups.value.some((r) => r.divisions[div])
        )
        if (!divisions.value.includes(activeDivision.value)) {
          activeDivision.value = divisions.value[0]
        }
      }
    }
  }

  loading.value = false
})

function buildRaceGroups(bets, results, displayNames) {
  const positions = new Map()
  const topFive = new Map()
  const resultsByDivision = new Map()

  for (const r of results) {
    const key = `${r.race_id}:${r.division}`
    positions.set(`${key}:${r.athlete_id}`, r.position)
    if (r.position <= 5) {
      if (!topFive.has(key)) topFive.set(key, new Set())
      topFive.get(key).add(r.athlete_id)
    }
    if (!resultsByDivision.has(key)) resultsByDivision.set(key, [])
    resultsByDivision.get(key).push(r)
  }

  const betsByRace = new Map()
  for (const b of bets) {
    if (!betsByRace.has(b.race_id)) betsByRace.set(b.race_id, [])
    betsByRace.get(b.race_id).push(b)
  }

  return [...betsByRace.entries()]
    .map(([raceId, raceBets]) => {
      const membersByDivision = { FPRO: new Map(), MPRO: new Map() }

      for (const b of raceBets) {
        const key = `${raceId}:${b.division}`
        const actualPosition = positions.get(`${key}:${b.athlete_id}`) ?? null
        const points = betPoints(b, actualPosition, topFive.get(key) ?? new Set())
        const correct = actualPosition !== null && actualPosition === b.predicted_position

        const membersOfDivision = membersByDivision[b.division]
        if (!membersOfDivision.has(b.user_id)) {
          membersOfDivision.set(b.user_id, {
            user_id: b.user_id,
            display_name: displayNames.get(b.user_id),
            betCount: 0,
            points: 0,
            exactPicks: 0,
            bets: []
          })
        }
        const member = membersOfDivision.get(b.user_id)
        member.betCount += 1
        member.points += points
        if (correct) member.exactPicks += 1
        member.bets.push({ ...b, actual_position: actualPosition, points })
      }

      const divisionData = {}
      for (const div of ['FPRO', 'MPRO']) {
        if (!membersByDivision[div].size) continue
        const divisionResults = resultsByDivision.get(`${raceId}:${div}`) ?? []
        const scored = divisionResults.length > 0
        divisionData[div] = {
          results: divisionResults.slice(0, 5),
          scored,
          members: sortMembers([...membersByDivision[div].values()], scored)
        }
      }

      return { race: raceBets[0].races, divisions: divisionData }
    })
    .sort((a, b) => new Date(b.race.date) - new Date(a.race.date))
}

function sortMembers(members, scored) {
  for (const m of members) {
    m.bets.sort((a, b) => a.predicted_position - b.predicted_position)
  }
  return members.sort((a, b) => {
    if (scored && b.points !== a.points) return b.points - a.points
    if (scored && b.exactPicks !== a.exactPicks) return b.exactPicks - a.exactPicks
    return a.display_name.localeCompare(b.display_name)
  })
}

function isMemberExpanded(raceId, userId) {
  return expandedMembers.value.has(`${raceId}:${userId}`)
}

function toggleMember(raceId, userId) {
  const next = new Set(expandedMembers.value)
  const key = `${raceId}:${userId}`
  if (next.has(key)) {
    next.delete(key)
  } else {
    next.add(key)
  }
  expandedMembers.value = next
}

function isResultsExpanded(raceId) {
  return !collapsedResults.value.has(raceId)
}

function toggleResults(raceId) {
  const next = new Set(collapsedResults.value)
  if (next.has(raceId)) {
    next.delete(raceId)
  } else {
    next.add(raceId)
  }
  collapsedResults.value = next
}

function isLocked(race) {
  const d = new Date(race.date)
  d.setDate(d.getDate() - 1)
  d.setHours(23, 59, 59, 999)
  return new Date() > d
}

function statusClass(c) {
  if (!isLocked(c.race)) return 'bg-green-50 text-green-700'
  if (c.div.scored) return 'bg-indigo-50 text-indigo-700'
  return 'bg-amber-50 text-amber-700'
}

function statusLabel(c) {
  if (!isLocked(c.race)) return 'bets.open'
  if (c.div.scored) return 'bets.scored'
  return 'bets.closed'
}

function formatDate(date) {
  let d
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
    const [y, m, day] = date.slice(0, 10).split('-').map(Number)
    d = new Date(y, m - 1, day)
  } else {
    d = new Date(date)
  }
  return d.toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
