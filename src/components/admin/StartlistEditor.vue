<template>
  <section>
    <div
      v-if="race.startlist_edited_at"
      class="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3"
    >
      <span>{{ $t('admin.startlistLocked') }}</span>
      <button
        type="button"
        class="font-medium underline hover:no-underline"
        :disabled="saving"
        @click="releaseToCrawler"
      >
        {{ $t('admin.startlistRelease') }}
      </button>
    </div>
    <p v-else class="text-sm text-gray-500 mb-3">{{ $t('admin.startlistHint') }}</p>

    <div class="bg-white rounded-lg shadow-sm border overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b text-left text-gray-500">
            <th class="p-2 w-24">{{ $t('race.bib') }}</th>
            <th class="p-2">{{ $t('common.athlete') }}</th>
            <th class="p-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in draft" :key="row.key" class="border-b last:border-0">
            <td class="p-2">
              <input
                v-model="row.bib"
                type="text"
                class="input !mt-0 !py-1.5"
                :aria-label="$t('admin.bibOfRow', { row: i + 1 })"
              />
            </td>
            <td class="p-2">
              <AthleteSelect
                v-model="row.athlete_id"
                :athletes="athletes"
                :label="$t('admin.athleteOfRow', { row: i + 1 })"
              />
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
            <td colspan="3" class="p-4 text-center text-gray-400">{{ $t('admin.noStartlist') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <EditorActions
      :saving="saving"
      :error="error"
      :add-label="$t('admin.addStarter')"
      @add="draft.push({ key: nextKey++, athlete_id: null, bib: '' })"
      @save="save"
    />
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../lib/supabase'
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
  props.rows.map((r) => ({ key: nextKey++, athlete_id: r.athlete_id, bib: r.bib || '' }))
)
const saving = ref(false)
const error = ref('')

async function save() {
  error.value = ''
  const ids = draft.value.map((r) => r.athlete_id)
  if (ids.some((id) => !id)) error.value = t('admin.errorMissingAthlete')
  else if (new Set(ids).size !== ids.length) error.value = t('admin.errorDuplicateAthlete')
  if (error.value) return

  saving.value = true
  try {
    const { error: rpcErr } = await supabase.rpc('admin_replace_startlist', {
      p_race_id: props.race.id,
      p_division: props.division,
      p_rows: draft.value.map((r) => ({ athlete_id: r.athlete_id, bib: r.bib.trim() }))
    })
    if (rpcErr) throw rpcErr
    emit('saved')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function releaseToCrawler() {
  saving.value = true
  try {
    const { error: updErr } = await supabase
      .from('races')
      .update({ startlist_edited_at: null })
      .eq('id', props.race.id)
    if (updErr) throw updErr
    emit('saved')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>
