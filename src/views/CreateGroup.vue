<template>
  <div class="max-w-md mx-auto mt-8">
    <h1 class="text-2xl font-bold mb-6">Create group</h1>
    <form @submit.prevent="handleCreate" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Group name</label>
        <input v-model="name" type="text" required
          class="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <button type="submit" class="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
        Create
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const name = ref('')
const error = ref('')

async function handleCreate() {
  error.value = ''
  const { data: group, error: err } = await supabase
    .from('groups')
    .insert({ name: name.value, created_by: auth.user.id })
    .select()
    .single()

  if (err) {
    error.value = err.message
    return
  }

  await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: auth.user.id })

  router.push(`/groups/${group.id}`)
}
</script>
