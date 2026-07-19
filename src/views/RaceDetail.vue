<template>
  <div>
    <div v-if="loading" class="text-gray-500">Loading...</div>
    <div v-else-if="!race" class="text-gray-500">Race not found.</div>
    <div v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-bold">{{ race.name }}</h1>
        <p class="text-sm text-gray-500">{{ formatDate(race.date) }} &middot; {{ race.tier }} &middot; {{ race.distance }}</p>
        <p v-if="isLocked" class="text-red-600 text-sm font-medium mt-1">Betting is closed</p>
        <p v-else class="text-green-600 text-sm font-medium mt-1">Betting open until {{ formatDate(lockDate) }}</p>
      </div>

      <div v-if="!isLocked" class="mb-6">
        <div class="flex gap-2 mb-4">
          <button @click="activeDivision = 'FPRO'"
            :class="['px-4 py-2 rounded text-sm font-medium', activeDivision === 'FPRO' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700']">
            Women
          </button>
          <button @click="activeDivision = 'MPRO'"
            :class="['px-4 py-2 rounded text-sm font-medium', activeDivision === 'MPRO' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700']">
            Men
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="pos in 5" :key="pos" class="flex items-center gap-3">
            <span class="font-bold text-gray-500 w-8">{{ pos }}.</span>
            <input type="text"
              :placeholder="'Search athlete...'"
              v-model="searchQueries[activeDivision][pos]"
              @input="searchAthletes(activeDivision, pos)"
              class="flex-1 rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500" />
            <div v-if="searchResults[activeDivision][pos]?.length" class="relative">
              <div class="absolute right-0 top-0 bg-white border rounded shadow-lg z-10 w-64">
                <button v-for="a in searchResults[activeDivision][pos]" :key="a.id"
                  @click="selectAthlete(activeDivision, pos, a)"
                  class="block w-full text-left px-3 py-2 text-sm hover:bg-indigo-50">
                  {{ a.full_name }} <span class="text-gray-400">{{ a.country }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="placed" class="mt-4 flex items-center gap-4 text-sm">
          <span class="text-green-600 font-medium">Bet saved</span>
          <button @click="saveBet" class="text-indigo-600 hover:underline">Update</button>
        </div>
        <button v-else @click="saveBet" :disabled="saving"
          class="mt-4 bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 disabled:opacity-50">
          {{ saving ? 'Saving...' : 'Place bet' }}
        </button>
        <p v-if="saveError" class="text-red-600 text-sm mt-2">{{ saveError }}</p>
      </div>

      <section v-if="hasResults">
        <h2 class="text-lg font-semibold mb-3">Results</h2>
        <div class="flex gap-2 mb-4">
          <button @click="activeDivision = 'FPRO'"
            :class="['px-4 py-2 rounded text-sm font-medium', activeDivision === 'FPRO' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700']">
            Women
          </button>
          <button @click="activeDivision = 'MPRO'"
            :class="['px-4 py-2 rounded text-sm font-medium', activeDivision === 'MPRO' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700']">
            Men
          </button>
        </div>
        <table class="w-full bg-white rounded-lg shadow-sm border text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="p-3">Pos</th>
              <th class="p-3">Athlete</th>
              <th class="p-3">Country</th>
              <th class="p-3">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results[activeDivision]" :key="r.id" class="border-b last:border-0">
              <td class="p-3 font-bold">{{ r.position }}</td>
              <td class="p-3">{{ r.athletes?.full_name }}</td>
              <td class="p-3">{{ r.athletes?.country }}</td>
              <td class="p-3">{{ r.finish_time }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="hasBets" class="mt-8">
        <h2 class="text-lg font-semibold mb-3">Your bets</h2>
        <div class="flex gap-2 mb-4">
          <button v-for="div in betDivisions" :key="div" @click="betDivision = div"
            :class="['px-4 py-2 rounded text-sm font-medium', betDivision === div ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700']">
            {{ div === 'FPRO' ? 'Women' : 'Men' }}
          </button>
        </div>
        <table class="w-full bg-white rounded-lg shadow-sm border text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="p-3">Pred</th>
              <th class="p-3">Athlete</th>
              <th class="p-3">Result</th>
              <th class="p-3">Pts</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in myBets[betDivision]" :key="b.id" class="border-b last:border-0">
              <td class="p-3 font-bold">{{ b.predicted_position }}</td>
              <td class="p-3">{{ b.athletes?.full_name }}</td>
              <td class="p-3">{{ b.actual_position ?? '–' }}</td>
              <td class="p-3 font-semibold">{{ b.points }}</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-gray-500 mt-2">Total: <span class="font-semibold">{{ betTotal }} pts</span></p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const loading = ref(true)
const saving = ref(false)
const saveError = ref('')
const placed = ref(false)
const race = ref(null)
const activeDivision = ref('FPRO')

const searchQueries = ref({ FPRO: {}, MPRO: {} })
const searchResults = ref({ FPRO: {}, MPRO: {} })
const selections = ref({ FPRO: {}, MPRO: {} })
const existingBets = ref({ FPRO: {}, MPRO: {} })
const results = ref({ FPRO: [], MPRO: [] })
const hasResults = ref(false)
const myBets = ref({ FPRO: [], MPRO: [] })
const hasBets = ref(false)
const betDivisions = ref([])
const betDivision = ref('FPRO')
const betTotal = ref(0)

const lockDate = computed(() => {
  if (!race.value) return null
  const d = new Date(race.value.date)
  d.setDate(d.getDate() - 1)
  d.setHours(23, 59, 59, 999)
  return d
})

const isLocked = computed(() => {
  if (!lockDate.value) return true
  return new Date() > lockDate.value
})

onMounted(async () => {
  const { data: r } = await supabase
    .from('races')
    .select('*')
    .eq('id', route.params.id)
    .single()
  race.value = r

  const { data: rrs } = await supabase
    .from('race_results')
    .select('*, athletes(*)')
    .eq('race_id', route.params.id)
    .order('division')
    .order('position')
  if (rrs?.length) {
    hasResults.value = true
    for (const rr of rrs) {
      if (!results.value[rr.division]) results.value[rr.division] = []
      results.value[rr.division].push(rr)
    }
  }

  const { data: bets } = await supabase
    .from('bets')
    .select('*, athletes(*)')
    .eq('race_id', route.params.id)
    .eq('user_id', auth.user.id)
    .order('predicted_position')
  if (bets?.length) {
    const resultMap = {}
    for (const div of Object.keys(results.value)) {
      for (const rr of results.value[div]) {
        resultMap[`${div}:${rr.athlete_id}`] = rr.position
      }
    }
    for (const b of bets) {
      existingBets.value[b.division][b.predicted_position] = b
      selections.value[b.division][b.predicted_position] = b.athletes
      searchQueries.value[b.division][b.predicted_position] = b.athletes?.full_name || ''
      b.actual_position = resultMap[`${b.division}:${b.athlete_id}`] ?? null
      if (!myBets.value[b.division]) myBets.value[b.division] = []
      myBets.value[b.division].push(b)
    }
    placed.value = true
    betDivisions.value = Object.keys(myBets.value)
    betDivision.value = betDivisions.value[0]
    betTotal.value = bets.reduce((sum, b) => sum + (b.points || 0), 0)
    hasBets.value = true
  }

  loading.value = false
})

async function searchAthletes(division, pos) {
  const q = searchQueries.value[division][pos]
  if (!q || q.length < 2) {
    searchResults.value[division][pos] = []
    return
  }
  const { data } = await supabase
    .from('athletes')
    .select('id, full_name, slug, country')
    .ilike('full_name', `%${q}%`)
    .eq('division', division)
    .limit(10)
  searchResults.value[division][pos] = data || []
}

function selectAthlete(division, pos, athlete) {
  selections.value[division][pos] = athlete
  searchQueries.value[division][pos] = athlete.full_name
  searchResults.value[division][pos] = []
}

async function saveBet() {
  saveError.value = ''
  saving.value = true
  try {
    const { error: delErr } = await supabase
      .from('bets')
      .delete()
      .eq('race_id', race.value.id)
      .eq('user_id', auth.user.id)
      .eq('division', activeDivision.value)
    if (delErr) throw delErr

    const rows = []
    for (let pos = 1; pos <= 5; pos++) {
      const athlete = selections.value[activeDivision.value][pos]
      if (!athlete) continue
      rows.push({
        user_id: auth.user.id,
        race_id: race.value.id,
        division: activeDivision.value,
        athlete_id: athlete.id,
        predicted_position: pos,
      })
    }

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('bets').insert(rows)
      if (insErr) throw insErr
    }

    placed.value = true
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
