<template>
  <div>
    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="!race" class="text-gray-500">{{ $t('race.notFound') }}</div>
    <div v-else>
      <div class="mb-6">
        <h1 class="text-2xl font-bold">{{ race.name }}</h1>
        <p class="text-sm text-gray-500">
          {{ formatDate(race.date) }} &middot; {{ race.tier }} &middot; {{ race.distance }}
        </p>
        <p v-if="isLocked" class="text-red-600 text-sm font-medium mt-1">
          {{ $t('race.bettingClosed') }}
        </p>
        <p v-else class="text-green-600 text-sm font-medium mt-1">
          {{ $t('race.bettingOpenUntil', { date: formatDate(lockDate) }) }}
        </p>
      </div>

      <div v-if="!isLocked" class="mb-6">
        <div class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <template v-if="startlistMissing[activeDivision]">{{
            $t('race.startlistMissingDivision', {
              division: $t(activeDivision === 'FPRO' ? 'common.women' : 'common.men')
            })
          }}</template>
          <template v-else>{{
            hasStartlist ? $t('race.startlistAvailable') : $t('race.startlistNote')
          }}</template>
        </div>
        <div class="flex gap-2 mb-4">
          <button
            :class="['btn-tab', activeDivision === 'FPRO' ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = 'FPRO'"
          >
            {{ $t('common.women') }}
          </button>
          <button
            :class="['btn-tab', activeDivision === 'MPRO' ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = 'MPRO'"
          >
            {{ $t('common.men') }}
          </button>
        </div>

        <p class="sr-only" role="status">{{ announcement }}</p>
        <div v-if="!startlistMissing[activeDivision]" class="space-y-3">
          <div v-for="pos in 5" :key="pos" class="flex items-center gap-3">
            <span class="font-bold text-gray-500 w-8">{{ pos }}.</span>
            <div class="relative flex-1" @focusout="onSlotFocusOut($event, activeDivision, pos)">
              <input
                :id="inputId(activeDivision, pos)"
                v-model="searchQueries[activeDivision][pos]"
                type="text"
                role="combobox"
                aria-autocomplete="list"
                :aria-label="$t('race.slotLabel', { position: pos })"
                :aria-expanded="isOpen(activeDivision, pos)"
                :aria-controls="
                  isOpen(activeDivision, pos) ? listboxId(activeDivision, pos) : undefined
                "
                :aria-activedescendant="activeDescendant(activeDivision, pos)"
                :placeholder="$t('race.searchPlaceholder')"
                class="input !mt-0"
                @input="searchAthletes(activeDivision, pos)"
                @keydown="onSlotKeydown($event, activeDivision, pos)"
              />
              <div
                v-if="isOpen(activeDivision, pos)"
                :id="listboxId(activeDivision, pos)"
                role="listbox"
                class="absolute left-0 top-full mt-1.5 z-10 w-full rounded-lg border border-gray-200 bg-white shadow-xl overflow-y-auto max-h-72"
                @click.stop
                @mousedown.prevent
              >
                <div
                  v-for="(a, i) in searchResults[activeDivision][pos]"
                  :id="optionId(activeDivision, pos, a)"
                  :key="a.id"
                  role="option"
                  :aria-selected="i === activeIndex(activeDivision, pos)"
                  :class="[
                    'flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm border-b border-gray-100 last:border-0',
                    i === activeIndex(activeDivision, pos) ? 'bg-indigo-50' : 'hover:bg-indigo-50'
                  ]"
                  @click="selectAthlete(activeDivision, pos, a)"
                >
                  <span class="text-base leading-none">{{ flag(a.country) }}</span>
                  <span class="flex-1 truncate">{{ a.full_name }}</span>
                  <span class="text-gray-400 text-xs">{{ a.country }}</span>
                </div>
              </div>
            </div>
          </div>
          <p class="text-xs text-gray-500">{{ $t('race.keyboardHint') }}</p>
        </div>

        <div
          v-if="!startlistMissing[activeDivision] && placed"
          class="mt-4 flex items-center gap-4 text-sm"
        >
          <span v-if="savedNotice" class="text-green-600 font-medium">{{
            $t('race.betSaved')
          }}</span>
          <button
            :disabled="saving"
            class="text-indigo-600 font-medium hover:underline disabled:opacity-50"
            @click="saveBet"
          >
            {{ $t('race.update') }}
          </button>
        </div>
        <button
          v-else-if="!startlistMissing[activeDivision]"
          :disabled="saving"
          class="btn btn-primary mt-4"
          @click="saveBet"
        >
          {{ saving ? $t('race.saving') : $t('race.placeBet') }}
        </button>
        <p v-if="saveError" class="text-red-600 text-sm mt-2">{{ saveError }}</p>
      </div>

      <section v-if="hasStartlist" class="mt-8">
        <h2 class="text-lg font-semibold mb-3">{{ $t('race.startlist') }}</h2>
        <div class="flex gap-2 mb-4">
          <button
            :class="['btn-tab', activeDivision === 'FPRO' ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = 'FPRO'"
          >
            {{ $t('common.women') }}
          </button>
          <button
            :class="['btn-tab', activeDivision === 'MPRO' ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = 'MPRO'"
          >
            {{ $t('common.men') }}
          </button>
        </div>
        <p v-if="startlistMissing[activeDivision]" class="text-sm text-gray-500">
          {{
            $t('race.startlistMissingDivision', {
              division: $t(activeDivision === 'FPRO' ? 'common.women' : 'common.men')
            })
          }}
        </p>
        <table v-else class="w-full bg-white rounded-lg shadow-sm border text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="p-3">{{ $t('race.bib') }}</th>
              <th class="p-3">{{ $t('common.athlete') }}</th>
              <th class="p-3">{{ $t('common.country') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in startlist[activeDivision]" :key="s.id" class="border-b last:border-0">
              <td class="p-3 font-bold">{{ s.bib || '–' }}</td>
              <td class="p-3">{{ s.athletes?.full_name }}</td>
              <td class="p-3">
                <span class="text-base leading-none">{{ flag(s.athletes?.country) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="hasResults" class="mt-8">
        <h2 class="text-lg font-semibold mb-3">{{ $t('race.results') }}</h2>
        <div class="flex gap-2 mb-4">
          <button
            :class="['btn-tab', activeDivision === 'FPRO' ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = 'FPRO'"
          >
            {{ $t('common.women') }}
          </button>
          <button
            :class="['btn-tab', activeDivision === 'MPRO' ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="activeDivision = 'MPRO'"
          >
            {{ $t('common.men') }}
          </button>
        </div>
        <table class="w-full bg-white rounded-lg shadow-sm border text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="p-3">{{ $t('common.position') }}</th>
              <th class="p-3">{{ $t('common.athlete') }}</th>
              <th class="p-3">{{ $t('common.country') }}</th>
              <th class="p-3">{{ $t('race.time') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in results[activeDivision]" :key="r.id" class="border-b last:border-0">
              <td class="p-3 font-bold">{{ r.position }}</td>
              <td class="p-3">{{ r.athletes?.full_name }}</td>
              <td class="p-3">
                <span class="text-base leading-none">{{ flag(r.athletes?.country) }}</span>
              </td>
              <td class="p-3">{{ r.finish_time }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="hasBets" class="mt-8">
        <h2 class="text-lg font-semibold mb-3">{{ $t('race.yourBets') }}</h2>
        <div class="flex gap-2 mb-4">
          <button
            v-for="div in betDivisions"
            :key="div"
            :class="['btn-tab', betDivision === div ? 'btn-tab-active' : 'btn-tab-inactive']"
            @click="betDivision = div"
          >
            {{ div === 'FPRO' ? $t('common.women') : $t('common.men') }}
          </button>
        </div>
        <table class="w-full bg-white rounded-lg shadow-sm border text-sm">
          <thead>
            <tr class="border-b text-left text-gray-500">
              <th class="p-3">{{ $t('common.pred') }}</th>
              <th class="p-3">{{ $t('common.athlete') }}</th>
              <th class="p-3">{{ $t('common.result') }}</th>
              <th class="p-3">{{ $t('common.points') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in myBets[betDivision]" :key="b.id" class="border-b last:border-0">
              <td class="p-3 font-bold">{{ b.predicted_position }}</td>
              <td class="p-3">
                <span class="inline-flex items-center gap-2">
                  <span v-if="b.athletes?.country" class="text-base leading-none">{{
                    flag(b.athletes.country)
                  }}</span>
                  {{ b.athletes?.full_name }}
                </span>
              </td>
              <td class="p-3">{{ b.actual_position ?? '–' }}</td>
              <td class="p-3 font-semibold">{{ b.points }}</td>
            </tr>
          </tbody>
        </table>
        <p class="text-sm text-gray-500 mt-2">
          {{ $t('common.total') }}:
          <span class="font-semibold">{{ betTotal }} {{ $t('common.points') }}</span>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { flag } from '../lib/flags'

const route = useRoute()
const auth = useAuthStore()
const { locale, t } = useI18n()
const loading = ref(true)
const saving = ref(false)
const saveError = ref('')
const placed = ref(false)
const savedNotice = ref(false)
const race = ref(null)
const activeDivision = ref('FPRO')

const searchQueries = ref({ FPRO: {}, MPRO: {} })
const searchResults = ref({ FPRO: {}, MPRO: {} })
const activeIndexes = ref({ FPRO: {}, MPRO: {} })
const announcement = ref('')
const selections = ref({ FPRO: {}, MPRO: {} })
const existingBets = ref({ FPRO: {}, MPRO: {} })
const results = ref({ FPRO: [], MPRO: [] })
const hasResults = ref(false)
const hasStartlist = ref(false)
const startlistAthleteIds = ref({ FPRO: [], MPRO: [] })
const startlist = ref({ FPRO: [], MPRO: [] })
const startlistMissing = ref({ FPRO: false, MPRO: false })
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

function inputId(division, pos) {
  return `slot-${division}-${pos}-input`
}

function listboxId(division, pos) {
  return `slot-${division}-${pos}-listbox`
}

function optionId(division, pos, athlete) {
  return `slot-${division}-${pos}-option-${athlete.id}`
}

function resultsFor(division, pos) {
  return searchResults.value[division][pos] || []
}

function activeIndex(division, pos) {
  return activeIndexes.value[division][pos] ?? -1
}

function isOpen(division, pos) {
  return resultsFor(division, pos).length > 0
}

function activeDescendant(division, pos) {
  const athlete = resultsFor(division, pos)[activeIndex(division, pos)]
  return athlete ? optionId(division, pos, athlete) : undefined
}

function openDropdown(division, pos, list) {
  searchResults.value[division][pos] = list
  activeIndexes.value[division][pos] = list.length > 0 ? 0 : -1
}

function closeDropdown(division, pos) {
  searchResults.value[division][pos] = []
  activeIndexes.value[division][pos] = -1
}

function closeAllDropdowns() {
  for (const div of ['FPRO', 'MPRO']) {
    for (let pos = 1; pos <= 5; pos++) {
      closeDropdown(div, pos)
    }
  }
}

function scrollActiveOptionIntoView(division, pos) {
  const id = activeDescendant(division, pos)
  if (!id) return
  nextTick(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }))
}

function onSlotFocusOut(event, division, pos) {
  if (event.currentTarget.contains(event.relatedTarget)) return
  closeDropdown(division, pos)
}

function onSlotKeydown(event, division, pos) {
  const list = resultsFor(division, pos)
  const step = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0

  if (step !== 0) {
    if (list.length === 0) return
    event.preventDefault()
    const current = activeIndex(division, pos)
    activeIndexes.value[division][pos] =
      current < 0 ? (step > 0 ? 0 : list.length - 1) : (current + step + list.length) % list.length
    scrollActiveOptionIntoView(division, pos)
    return
  }

  if (event.key === 'Enter') {
    const athlete = list[activeIndex(division, pos)]
    if (!athlete) return
    event.preventDefault()
    selectAthlete(division, pos, athlete)
    return
  }

  if (event.key === 'Escape') {
    if (isOpen(division, pos)) closeDropdown(division, pos)
    else clearSlot(division, pos)
    return
  }

  if (event.key === 'Tab') closeDropdown(division, pos)
}

function onDocumentClick() {
  closeAllDropdowns()
}

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  await loadRace()
  await loadMyBets()
  loading.value = false
})

async function loadRace() {
  const { data: r } = await supabase.from('races').select('*').eq('id', route.params.id).single()
  race.value = r

  results.value = { FPRO: [], MPRO: [] }
  hasResults.value = false
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

  hasStartlist.value = false
  startlist.value = { FPRO: [], MPRO: [] }
  startlistAthleteIds.value = { FPRO: [], MPRO: [] }
  startlistMissing.value = { FPRO: false, MPRO: false }
  const { data: startlistData } = await supabase
    .from('race_startlists')
    .select('athlete_id, division, bib, athletes(*)')
    .eq('race_id', route.params.id)
  if (startlistData?.length) {
    hasStartlist.value = true
    for (const s of startlistData) {
      startlistAthleteIds.value[s.division].push(s.athlete_id)
      startlist.value[s.division].push(s)
    }
  }
  const bibNum = (s) => (s.bib ? parseInt(s.bib.slice(1), 10) : Number.POSITIVE_INFINITY)
  for (const div of ['FPRO', 'MPRO']) {
    startlist.value[div].sort((a, b) => bibNum(a) - bibNum(b))
    startlistMissing.value[div] = hasStartlist.value && startlistAthleteIds.value[div].length === 0
  }
}

async function loadMyBets() {
  existingBets.value = { FPRO: {}, MPRO: {} }
  selections.value = { FPRO: {}, MPRO: {} }
  searchQueries.value = { FPRO: {}, MPRO: {} }
  activeIndexes.value = { FPRO: {}, MPRO: {} }
  announcement.value = ''
  myBets.value = { FPRO: [], MPRO: [] }
  hasBets.value = false
  placed.value = false
  betDivisions.value = []
  betTotal.value = 0

  const { data: bets } = await supabase
    .from('bets')
    .select('*, athletes(*)')
    .eq('race_id', route.params.id)
    .eq('user_id', auth.user.id)
    .order('predicted_position')
  if (!bets?.length) return

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
  if (!betDivisions.value.includes(betDivision.value)) {
    betDivision.value = betDivisions.value[0]
  }
  betTotal.value = bets.reduce((sum, b) => sum + (b.points || 0), 0)
  hasBets.value = true
}

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

async function searchAthletes(division, pos) {
  const q = searchQueries.value[division][pos]
  if (startlistMissing.value[division] || !q || q.length < 2) {
    closeDropdown(division, pos)
    announcement.value = ''
    return
  }
  const ids = startlistAthleteIds.value[division]
  let query = supabase
    .from('athletes')
    .select('id, full_name, slug, country')
    .ilike('full_name', `%${q}%`)
    .eq('division', division)
  if (ids.length > 0) {
    query = query.in('id', ids)
  }
  const { data } = await query.limit(10)
  const list = data || []
  openDropdown(division, pos, list)
  announcement.value = list.length
    ? t('race.resultCount', { count: list.length })
    : t('race.noResults')
}

function selectAthlete(division, pos, athlete) {
  selections.value[division][pos] = athlete
  searchQueries.value[division][pos] = athlete.full_name
  closeDropdown(division, pos)
  announcement.value = t('race.picked', { athlete: athlete.full_name, position: pos })
}

function clearSlot(division, pos) {
  const hadSelection = Boolean(selections.value[division][pos])
  selections.value[division][pos] = undefined
  searchQueries.value[division][pos] = ''
  closeDropdown(division, pos)
  if (hadSelection) announcement.value = t('race.pickCleared', { position: pos })
}

async function saveBet() {
  saveError.value = ''
  savedNotice.value = false
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
        predicted_position: pos
      })
    }

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from('bets').insert(rows)
      if (insErr) throw insErr
    }

    await loadMyBets()
    savedNotice.value = true
  } catch (e) {
    saveError.value = e.message
  } finally {
    saving.value = false
  }
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
