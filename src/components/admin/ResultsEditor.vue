<template>
  <section>
    <p class="text-sm text-gray-500 mb-3">{{ $t('admin.resultsHint') }}</p>

    <div class="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-gray-500">
            <th class="p-2 w-20">{{ $t('common.position') }}</th>
            <th class="p-2">{{ $t('common.athlete') }}</th>
            <th class="p-2 w-32">{{ $t('race.time') }}</th>
            <th class="p-2 w-32">{{ $t('admin.status') }}</th>
            <th class="p-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in draft" :key="row.key" class="border-b last:border-0">
            <td class="p-2">
              <input
                v-model.number="row.position"
                type="number"
                min="1"
                class="input !mt-0 !py-1.5"
                :aria-label="$t('admin.positionOfRow', { row: i + 1 })"
              />
            </td>
            <td class="p-2">
              <AthleteSelect
                v-model="row.athlete_id"
                :athletes="athletes"
                :label="$t('admin.athleteOfRow', { row: i + 1 })"
              />
            </td>
            <td class="p-2">
              <input
                v-model="row.finish_time"
                type="text"
                placeholder="3:12:44"
                class="input !mt-0 !py-1.5"
                :aria-label="$t('admin.timeOfRow', { row: i + 1 })"
              />
            </td>
            <td class="p-2">
              <select
                v-model="row.status"
                class="input !mt-0 !py-1.5"
                :aria-label="$t('admin.statusOfRow', { row: i + 1 })"
              >
                <option value="finished">{{ $t('admin.statusFinished') }}</option>
                <option value="dnf">DNF</option>
                <option value="dns">DNS</option>
              </select>
            </td>
            <td class="p-2 text-right">
              <button
                type="button"
                class="text-gray-400 hover:text-red-600"
                :aria-label="$t('admin.removeRow', { row: i + 1 })"
                @click="draft.splice(i, 1)"
              >
                &times;
              </button>
            </td>
          </tr>
          <tr v-if="draft.length === 0">
            <td colspan="5" class="p-4 text-center text-gray-400">{{ $t('admin.noResults') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <EditorActions
      :saving="saving"
      :error="error"
      :add-label="$t('admin.addResult')"
      @add="addRow"
      @save="save"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../lib/supabase'
import { scoreBets } from '../../lib/scoring'
import AthleteSelect from './AthleteSelect.vue'
import EditorActions from './EditorActions.vue'

const props = defineProps({
  race: { type: Object, required: true },
  division: { type: String, required: true },
  athletes: { type: Array, required: true },
  rows: { type: Array, required: true }
})
const emit = defineEmits(['saved'])
const { t } = useI18n()

let nextKey = 0
const draft = ref(
  props.rows.map((r) => ({
    key: nextKey++,
    athlete_id: r.athlete_id,
    position: r.position,
    finish_time: r.finish_time || '',
    status: r.status || 'finished',
    pto_points: r.pto_points
  }))
)
const saving = ref(false)
const error = ref('')

function addRow() {
  const last = Math.max(0, ...draft.value.map((r) => Number(r.position) || 0))
  draft.value.push({
    key: nextKey++,
    athlete_id: null,
    position: last + 1,
    finish_time: '',
    status: 'finished',
    pto_points: null
  })
}

function validate() {
  const seen = new Set()
  for (const row of draft.value) {
    if (!row.athlete_id) return t('admin.errorMissingAthlete')
    if (seen.has(row.athlete_id)) return t('admin.errorDuplicateAthlete')
    seen.add(row.athlete_id)
    const pos = row.position
    if (pos !== '' && pos !== null && (!Number.isInteger(pos) || pos < 1)) {
      return t('admin.errorPosition')
    }
  }
  return ''
}

// Re-scores every bet on the race against the saved results, so standings change now
// rather than when score-race next runs.
async function rescoreRace() {
  const [{ data: results, error: rErr }, { data: bets, error: bErr }] = await Promise.all([
    supabase
      .from('race_results')
      .select('athlete_id, division, position')
      .eq('race_id', props.race.id),
    supabase
      .from('bets')
      .select('id, athlete_id, division, predicted_position')
      .eq('race_id', props.race.id)
  ])
  if (rErr) throw rErr
  if (bErr) throw bErr
  if (!bets.length) return
  const { error: pErr } = await supabase.rpc('admin_set_bet_points', {
    p_points: scoreBets(bets, results)
  })
  if (pErr) throw pErr
}

async function save() {
  error.value = validate()
  if (error.value) return
  saving.value = true
  try {
    const rows = draft.value.map((r) => ({
      athlete_id: r.athlete_id,
      position: r.position === '' ? null : r.position,
      finish_time: r.finish_time.trim(),
      status: r.status,
      pto_points: r.pto_points
    }))
    const { error: rpcErr } = await supabase.rpc('admin_replace_race_results', {
      p_race_id: props.race.id,
      p_division: props.division,
      p_rows: rows
    })
    if (rpcErr) throw rpcErr
    await rescoreRace()
    emit('saved')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
