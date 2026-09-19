<template>
  <div class="max-w-md mx-auto mt-8">
    <h1 class="text-2xl font-bold mb-6">{{ $t('createGroup.title') }}</h1>
    <form @submit.prevent="handleCreate" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('createGroup.groupName') }}</label>
        <input v-model="name" type="text" required class="input" />
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <button type="submit" class="btn btn-primary w-full">
        {{ $t('createGroup.create') }}
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
    .insert({ group_id: group.id, user_id: auth.user.id, is_admin: true })

  router.push(`/groups/${group.id}`)
}
</script>
