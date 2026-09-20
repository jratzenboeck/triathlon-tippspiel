<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('leaderboard.title') }}</h1>
    <p class="text-sm text-gray-500 mb-4">{{ $t('leaderboard.description') }}</p>

    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="entries.length === 0" class="text-gray-400">{{ $t('leaderboard.noBets') }}</div>
    <div v-else class="bg-white rounded-lg shadow-sm border">
      <div
        v-for="(entry, i) in entries"
        :key="entry.user_id"
        :class="[
          'flex items-center justify-between px-4 py-3 border-b last:border-0',
          entry.user_id === auth.user?.id ? 'bg-indigo-50' : ''
        ]"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="font-bold text-gray-400 w-8">{{ i + 1 }}.</span>
          <span class="truncate">{{ entry.display_name }}</span>
        </div>
        <div class="flex items-center gap-4 text-sm text-gray-500">
          <span>{{ $t('leaderboard.betCount', entry.bets) }}</span>
          <span class="font-semibold text-gray-900 w-16 text-right"
            >{{ entry.points }} {{ $t('common.points') }}</span
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const loading = ref(true)
const entries = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('bets')
    .select('user_id, points, profiles!inner(display_name)')

  const scores = {}
  for (const b of data || []) {
    if (!scores[b.user_id]) {
      scores[b.user_id] = {
        user_id: b.user_id,
        display_name: b.profiles.display_name,
        points: 0,
        bets: 0
      }
    }
    scores[b.user_id].points += b.points || 0
    scores[b.user_id].bets += 1
  }

  entries.value = Object.values(scores).sort((a, b) => b.points - a.points)
  loading.value = false
})
</script>
