<template>
  <div>
    <h1 class="text-2xl font-bold mb-1">{{ $t('admin.title') }}</h1>
    <p class="text-sm text-gray-500 mb-6">{{ $t('admin.intro') }}</p>

    <input
      v-model="query"
      type="search"
      class="input mb-4"
      :placeholder="$t('admin.searchRaces')"
      :aria-label="$t('admin.searchRaces')"
    />

    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="filtered.length === 0" class="text-gray-400">{{ $t('admin.noRaces') }}</div>
    <ul v-else class="bg-white rounded-lg shadow-sm border divide-y">
      <li v-for="r in filtered" :key="r.id">
        <router-link
          :to="`/admin/races/${r.id}`"
          class="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50"
        >
          <div class="min-w-0">
            <p class="font-medium text-indigo-600 truncate">{{ r.name }}</p>
            <p class="text-sm text-gray-500">{{ r.date }} &middot; {{ r.tier || '–' }}</p>
          </div>
          <div class="flex flex-wrap justify-end gap-1.5 text-xs shrink-0">
            <span
              v-if="r.results_crawled_at"
              class="px-2 py-0.5 rounded-full bg-green-100 text-green-800"
            >
              {{ $t('admin.hasResults') }}
            </span>
            <span
              v-if="r.startlist_edited_at"
              class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
            >
              {{ $t('admin.startlistEdited') }}
            </span>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const races = ref([])
const loading = ref(true)
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return races.value
  return races.value.filter((r) => r.name.toLowerCase().includes(q) || r.date.includes(q))
})

onMounted(async () => {
  const { data } = await supabase
    .from('races')
    .select('id, name, date, tier, results_crawled_at, startlist_edited_at')
    .order('date', { ascending: false })
  races.value = data || []
  loading.value = false
})
</script>
