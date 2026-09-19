<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ $t('groups.title') }}</h1>
      <router-link to="/groups/new" class="btn btn-primary">
        {{ $t('groups.newGroup') }}
      </router-link>
    </div>
    <div v-if="loading" class="text-gray-500">{{ $t('common.loading') }}</div>
    <div v-else-if="groups.length === 0" class="text-gray-400">
      {{ $t('groups.none') }} <router-link to="/groups/new" class="text-indigo-600">{{ $t('groups.createOne') }}</router-link>.
    </div>
    <div v-for="group in groups" :key="group.id"
      class="bg-white rounded-lg shadow-sm border p-4 mb-3 flex items-center justify-between">
      <div>
        <router-link :to="`/groups/${group.id}`" class="font-medium text-indigo-600 hover:underline">
          {{ group.name }}
        </router-link>
        <p class="text-sm text-gray-500">{{ $t('groups.created', { date: formatDate(group.created_at) }) }}</p>
      </div>
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
const groups = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('group_members')
    .select('groups(*)')
    .eq('user_id', auth.user.id)
  groups.value = (data || []).map((d) => d.groups).filter(Boolean)
  loading.value = false
})

function formatDate(date) {
  return new Date(date).toLocaleDateString(locale.value)
}
</script>
