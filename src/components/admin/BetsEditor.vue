<template>
  <section>
    <p class="text-sm text-gray-500 mb-3">{{ $t('admin.betsHint') }}</p>

    <div v-if="players.length === 0" class="text-gray-400 mb-4">{{ $t('admin.noBets') }}</div>

    <div
      v-for="player in players"
      :key="player.userId"
      class="bg-white rounded-lg shadow-sm border mb-4 p-4"
      :data-testid="`bets-${player.userId}`"
    >
      <div class="flex items-center justify-between gap-3 mb-3">
        <h3 class="font-semibold">{{ player.name }}</h3>
        <span class="text-sm text-gray-500"
          >{{ $t('common.total') }}: {{ player.total }} {{ $t('common.points') }}</span
        >
      </div>
      <div class="space-y-2">
        <div v-for="pos in 5" :key="pos" class="flex items-center gap-3">
          <span class="font-bold text-gray-500 w-6">{{ pos }}.</span>
          <div class="flex-1">
            <AthleteSelect
              v-model="player.picks[pos]"
              :athletes="athletes"
              :label="$t('admin.pickOfPlayer', { player: player.name, position: pos })"
            />
          </div>
          <span class="w-14 text-right text-sm text-gray-500">{{
            player.points[pos] !== undefined ? `${player.points[pos]} ${$t('common.points')}` : ''
          }}</span>
        </div>
      </div>
      <EditorActions
        :saving="savingFor === player.userId"
        :error="errors[player.userId] || ''"
        :save-label="$t('admin.savePicks', { player: player.name })"
        @save="save(player)"
      />
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <select v-model="newPlayer" class="input !mt-0 !w-auto" :aria-label="$t('admin.addPlayer')">
        <option value="">{{ $t('admin.addPlayer') }}</option>
        <option v-for="p in otherProfiles" :key="p.id" :value="p.id">{{ p.display_name }}</option>
      </select>
      <button
        type="button"
        class="btn bg-gray-100 text-gray-800 hover:bg-gray-200"
        :disabled="!newPlayer"
        @click="addPlayer"
      >
        + {{ $t('admin.addPicks') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../../lib/supabase'
import { scoreBets } from '../../lib/scoring'
import AthleteSelect from './AthleteSelect.vue'
import EditorActions from './EditorActions.vue'

const props = defineProps({
  race: { type: Object, required: true },
  division: { type: String, required: true },
  athletes: { type: Array, required: true },
  bets: { type: Array, required: true },
  results: { type: Array, required: true },
  profiles: { type: Array, required: true }
})
const emit = defineEmits(['saved'])
const { t } = useI18n()

const nameById = new Map(props.profiles.map((p) => [p.id, p.display_name]))

function newPlayerEntry(userId) {
  return { userId, name: nameById.get(userId) || userId, picks: {}, points: {}, total: 0 }
}

const players = ref(
  (() => {
    const byUser = new Map()
    for (const b of props.bets) {
      if (!byUser.has(b.user_id)) byUser.set(b.user_id, newPlayerEntry(b.user_id))
      const p = byUser.get(b.user_id)
      p.picks[b.predicted_position] = b.athlete_id
      p.points[b.predicted_position] = b.points
      p.total += b.points || 0
    }
    return [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name))
  })()
)

const newPlayer = ref('')
const savingFor = ref(null)
const errors = ref({})

const otherProfiles = computed(() => {
  const taken = new Set(players.value.map((p) => p.userId))
  return props.profiles.filter((p) => !taken.has(p.id))
})

function addPlayer() {
  players.value.push(newPlayerEntry(newPlayer.value))
  newPlayer.value = ''
}

async function save(player) {
  errors.value = { ...errors.value, [player.userId]: '' }
  const picks = []
  for (let pos = 1; pos <= 5; pos++) {
    const athleteId = player.picks[pos]
    if (athleteId) picks.push({ athlete_id: athleteId, predicted_position: pos })
  }
  if (new Set(picks.map((p) => p.athlete_id)).size !== picks.length) {
    errors.value = { ...errors.value, [player.userId]: t('admin.errorDuplicateAthlete') }
    return
  }

  // Points against the results as they stand, so a corrected pick on a finished race
  // counts straight away.
  const scored = scoreBets(
    picks.map((p, i) => ({ id: i, division: props.division, ...p })),
    props.results
  )
  const rows = picks.map((p, i) => ({ ...p, points: scored[i].points }))

  savingFor.value = player.userId
  try {
    const { error } = await supabase.rpc('admin_replace_bets', {
      p_user_id: player.userId,
      p_race_id: props.race.id,
      p_division: props.division,
      p_rows: rows
    })
    if (error) throw error
    emit('saved')
  } catch (e) {
    errors.value = { ...errors.value, [player.userId]: e.message }
  } finally {
    savingFor.value = null
  }
}
</script>
