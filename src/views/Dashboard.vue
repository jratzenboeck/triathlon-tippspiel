<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ $t('dashboard.title') }}</h1>
    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else>
      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">{{ $t('dashboard.yourGroups') }}</h2>
        <div v-if="groups.length === 0" class="text-gray-400">
          {{ $t('dashboard.noGroups') }}
          <router-link to="/groups/new" class="text-indigo-600">{{ $t('dashboard.createOne') }}</router-link>.
        </div>
        <div v-for="group in groups" :key="group.id"
          class="bg-white rounded-lg shadow-sm border p-4 mb-3">
          <router-link :to="`/groups/${group.id}`" class="font-medium text-indigo-600 hover:underline">
            {{ group.name }}
          </router-link>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">{{ $t('dashboard.previousRaces') }}</h2>
        <div v-if="past.length === 0" class="text-gray-400">{{ $t('dashboard.noPreviousRaces') }}</div>
        <div v-for="race in past" :key="race.id"
          class="bg-white rounded-lg shadow-sm border p-4 mb-3 flex items-center justify-between">
          <div>
            <router-link :to="`/races/${race.id}`" class="font-medium text-indigo-600 hover:underline">
              {{ race.name }}
            </router-link>
            <p class="text-sm text-gray-500">{{ formatDate(race.date) }} &middot; {{ race.tier }}</p>
          </div>
          <span class="text-xs text-gray-400">{{ race.distance }}</span>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-3">{{ $t('dashboard.upcomingRaces') }}</h2>
        <div v-if="upcoming.length === 0" class="text-gray-400">{{ $t('dashboard.noUpcomingRaces') }}</div>
        <div v-for="race in upcoming" :key="race.id"
          class="bg-white rounded-lg shadow-sm border p-4 mb-3 flex items-center justify-between">
          <div>
            <router-link :to="`/races/${race.id}`" class="font-medium text-indigo-600 hover:underline">
              {{ race.name }}
            </router-link>
            <p class="text-sm text-gray-500">{{ formatDate(race.date) }} &middot; {{ race.tier }}</p>
          </div>
          <span class="text-xs text-gray-400">{{ race.distance }}</span>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const { locale } = useI18n()
const auth = useAuthStore()
const loading = ref(true)
const upcoming = ref([])
const past = ref([])
const groups = ref([])

onMounted(async () => {
  const today = new Date().toISOString().split('T')[0]

  const [upcomingRes, pastRes, membershipsRes] = await Promise.all([
    supabase.from('races').select('*').gte('date', today).order('date', { ascending: true }).limit(5),
    supabase.from('races').select('*').lt('date', today).order('date', { ascending: false }).limit(5),
    supabase.from('group_members').select('group_id').eq('user_id', auth.user.id),
  ])

  upcoming.value = upcomingRes.data || []
  past.value = pastRes.data || []

  const memberships = membershipsRes.data
  if (memberships?.length) {
    const ids = memberships.map(m => m.group_id)
    const { data: gs } = await supabase.from('groups').select('*').in('id', ids)
    groups.value = gs || []
  }

  loading.value = false
})

function formatDate(date) {
  return new Date(date).toLocaleDateString(locale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>
