<template>
  <div class="max-w-md mx-auto mt-16 text-center">
    <div v-if="loading" class="text-gray-500">Processing invite...</div>
    <div v-else-if="error" class="text-red-600">
      <p class="font-bold mb-2">Invalid or expired invite</p>
      <p class="text-sm">{{ error }}</p>
    </div>
    <div v-else-if="joined" class="text-green-600">
      <p class="font-bold text-lg mb-2">You joined {{ groupName }}!</p>
      <router-link :to="`/groups/${groupId}`" class="text-indigo-600 hover:underline">Go to group</router-link>
    </div>
    <div v-else>
      <p class="text-lg mb-4">You've been invited to join <strong>{{ groupName }}</strong></p>
      <div v-if="!auth.user">
        <p class="text-sm text-gray-500 mb-4">Sign up or sign in to join.</p>
        <router-link to="/signup" class="bg-indigo-600 text-white py-2 px-6 rounded inline-block hover:bg-indigo-700">Sign up</router-link>
        <span class="mx-2 text-gray-400">or</span>
        <router-link to="/login" class="text-indigo-600 hover:underline">Sign in</router-link>
      </div>
      <button v-else @click="acceptInvite" :disabled="accepting"
        class="bg-indigo-600 text-white py-2 px-6 rounded hover:bg-indigo-700 disabled:opacity-50">
        {{ accepting ? 'Joining...' : 'Join group' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const auth = useAuthStore()
const loading = ref(true)
const error = ref('')
const groupName = ref('')
const groupId = ref('')
const joined = ref(false)
const accepting = ref(false)

onMounted(async () => {
  const { data: invite, error: inviteErr } = await supabase
    .from('invites')
    .select('*, groups(name)')
    .eq('token', route.params.token)
    .single()

  if (inviteErr || !invite || invite.used) {
    error.value = inviteErr?.message || 'Invite not found or already used.'
    loading.value = false
    return
  }

  groupId.value = invite.group_id
  groupName.value = invite.groups?.name || 'a group'

  if (auth.user) {
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId.value)
      .eq('user_id', auth.user.id)
    if (existing?.length) {
      joined.value = true
    }
  }

  loading.value = false
})

async function acceptInvite() {
  accepting.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/.netlify/functions/accept-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ token: route.params.token }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    joined.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    accepting.value = false
  }
}
</script>
