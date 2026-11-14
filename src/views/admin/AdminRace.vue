<template>
  <div>
    <router-link to="/admin" class="text-sm text-indigo-600 hover:underline">
      &larr; {{ $t('admin.backToRaces') }}
    </router-link>

    <div v-if="loading" class="text-gray-500 mt-4">{{ $t('common.loading') }}</div>
    <div v-else-if="!race" class="text-gray-500 mt-4">{{ $t('race.notFound') }}</div>
    <div v-else class="mt-2">
      <h1 class="text-2xl font-bold">{{ race.name }}</h1>
      <p class="text-sm text-gray-500 mb-6">
        {{ race.date }} &middot; {{ race.tier || '–' }} &middot;
        <router-link :to="`/races/${race.id}`" class="text-indigo-600 hover:underline">{{
          $t('admin.viewRace')
        }}</router-link>
      </p>

      <div class="flex flex-wrap gap-2 mb-3" role="tablist">
        <button
          v-for="s in sections"
          :key="s.id"
          role="tab"
          :aria-selected="section === s.id"
          :class="['btn-tab', section === s.id ? 'btn-tab-active' : 'btn-tab-inactive']"
          @click="section = s.id"
        >
          {{ $t(s.label) }}
        </button>
      </div>
      <div class="flex gap-2 mb-5">
        <button
          v-for="div in ['FPRO', 'MPRO']"
          :key="div"
          :class="[
            'rounded-md px-3 py-1 text-sm font-medium border',
            division === div
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
              : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50'
          ]"
          @click="division = div"
        >
          {{ div === 'FPRO' ? $t('common.women') : $t('common.men') }}
        </button>
      </div>

      <p
        v-if="savedNotice"
        class="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
        role="status"
      >
        {{ $t('admin.saved') }}
      </p>

      <ResultsEditor
        v-if="section === 'results'"
        :key="`results-${division}-${version}`"
        :race="race"
        :division="division"
        :athletes="athletesByDivision[division]"
        :rows="results.filter((r) => r.division === division)"
        @saved="reload"
      />
      <StartlistEditor
        v-else-if="section === 'startlist'"
        :key="`startlist-${division}-${version}`"
        :race="race"
        :division="division"
        :athletes="athletesByDivision[division]"
        :rows="startlist.filter((s) => s.division === division)"
        @saved="reload"
      />
      <BetsEditor
        v-else
        :key="`bets-${division}-${version}`"
        :race="race"
        :division="division"
        :athletes="athletesByDivision[division]"
        :bets="bets.filter((b) => b.division === division)"
        :results="results"
        :profiles="profiles"
        @saved="reload"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import ResultsEditor from '../../components/admin/ResultsEditor.vue'
import StartlistEditor from '../../components/admin/StartlistEditor.vue'
import BetsEditor from '../../components/admin/BetsEditor.vue'

const sections = [
  { id: 'results', label: 'admin.results' },
  { id: 'startlist', label: 'admin.startlist' },
  { id: 'bets', label: 'admin.bets' }
]

const route = useRoute()
const loading = ref(true)
const race = ref(null)
const athletes = ref([])
const profiles = ref([])
const results = ref([])
const startlist = ref([])
const bets = ref([])
const section = ref('results')
const division = ref('FPRO')
// Bumped after every save so the editors drop their unsaved copies and start over
// from what is now in the database.
const version = ref(0)
const savedNotice = ref(false)

watch([section, division], () => {
  savedNotice.value = false
})

const athletesByDivision = computed(() => ({
  FPRO: athletes.value.filter((a) => a.division === 'FPRO'),
  MPRO: athletes.value.filter((a) => a.division === 'MPRO')
}))

// PostgREST hands out at most 1000 rows per request, and there are more athletes.
async function fetchAll(table, columns, order) {
  const pageSize = 1000
  const rows = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(order)
      .range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < pageSize) return rows
  }
}

async function loadRaceData() {
  const id = route.params.id
  const [raceRes, resultsRes, startlistRes, betsRes] = await Promise.all([
    supabase.from('races').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('race_results')
      .select('athlete_id, division, position, finish_time, status, pto_points')
      .eq('race_id', id)
      .order('position', { nullsFirst: false }),
    supabase.from('race_startlists').select('athlete_id, division, bib').eq('race_id', id),
    supabase
      .from('bets')
      .select('id, user_id, division, athlete_id, predicted_position, points')
      .eq('race_id', id)
  ])
  race.value = raceRes.data
  results.value = resultsRes.data || []
  startlist.value = startlistRes.data || []
  bets.value = betsRes.data || []
}

async function reload() {
  await loadRaceData()
  version.value++
  savedNotice.value = true
}

onMounted(async () => {
  const [, athleteRows, profileRows] = await Promise.all([
    loadRaceData(),
    fetchAll('athletes', 'id, full_name, country, division', 'full_name'),
    fetchAll('profiles', 'id, display_name', 'display_name')
  ])
  athletes.value = athleteRows
  profiles.value = profileRows
  loading.value = false
})
</script>
