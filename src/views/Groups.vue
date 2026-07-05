<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Groups</h1>
      <router-link to="/groups/new"
        class="bg-indigo-600 text-white py-2 px-4 rounded text-sm hover:bg-indigo-700">
        New group
      </router-link>
    </div>
    <div v-if="loading" class="text-gray-500">Loading...</div>
    <div v-else-if="groups.length === 0" class="text-gray-400">
      No groups yet. <router-link to="/groups/new" class="text-indigo-600">Create one</router-link>.
    </div>
    <div v-for="group in groups" :key="group.id"
      class="bg-white rounded-lg shadow-sm border p-4 mb-3 flex items-center justify-between">
      <div>
        <router-link :to="`/groups/${group.id}`" class="font-medium text-indigo-600 hover:underline">
          {{ group.name }}
        </router-link>
        <p class="text-sm text-gray-500">Created {{ formatDate(group.created_at) }}</p>
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
  return new Date(date).toLocaleDateString('de-DE')
}
</script>
