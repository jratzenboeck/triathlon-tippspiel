<template>
  <div>
    <div v-if="loading" class="text-gray-500">Loading...</div>
    <div v-else-if="!group" class="text-gray-500">Group not found.</div>
    <div v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">{{ group.name }}</h1>
          <p class="text-sm text-gray-500">{{ members.length }} member{{ members.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Leaderboard</h2>
        <div v-if="leaderboard.length === 0" class="text-gray-400">No bets placed yet.</div>
        <div v-for="(entry, i) in leaderboard" :key="i"
          class="bg-white rounded-lg shadow-sm border p-3 mb-2 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="font-bold text-gray-400 w-6">{{ i + 1 }}.</span>
            <span>{{ entry.display_name }}</span>
          </div>
          <span class="font-semibold">{{ entry.total_points }} pts</span>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Members</h2>
        <div class="flex flex-wrap gap-2">
          <span v-for="m in members" :key="m.id"
            class="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
            {{ m.display_name }}
          </span>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-semibold mb-3">Invite members</h2>
        <form @submit.prevent="handleInvite" class="flex gap-2">
          <input v-model="inviteEmail" type="email" placeholder="Email address" required
            class="flex-1 rounded border-gray-300 shadow-sm text-sm focus:border-indigo-500 focus:ring-indigo-500" />
          <button type="submit" :disabled="sending"
            class="bg-indigo-600 text-white py-2 px-4 rounded text-sm hover:bg-indigo-700 disabled:opacity-50">
            {{ sending ? 'Sending...' : 'Invite' }}
          </button>
        </form>
        <p v-if="inviteMsg" class="mt-2 text-sm" :class="inviteError ? 'text-red-600' : 'text-green-600'">
          {{ inviteMsg }}
        </p>
      </section>
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
const group = ref(null)
const members = ref([])
const leaderboard = ref([])
const inviteEmail = ref('')
const sending = ref(false)
const inviteMsg = ref('')
const inviteError = ref(false)

onMounted(async () => {
  const { data: g } = await supabase
    .from('groups')
    .select('*')
    .eq('id', route.params.id)
    .single()
  group.value = g

  const { data: ms } = await supabase
    .from('group_members')
    .select('profiles(*)')
    .eq('group_id', route.params.id)
  members.value = (ms || []).map(m => m.profiles).filter(Boolean)

  const { data: bs } = await supabase
    .from('bets')
    .select('user_id, points, profiles!inner(display_name)')
    .in('user_id', members.value.map(m => m.id))
  if (bs) {
    const grouped = {}
    for (const b of bs) {
      if (!grouped[b.user_id]) grouped[b.user_id] = { user_id: b.user_id, display_name: b.profiles.display_name, total_points: 0 }
      grouped[b.user_id].total_points += (b.points || 0)
    }
    leaderboard.value = Object.values(grouped).sort((a, b) => b.total_points - a.total_points)
  }

  loading.value = false
})

async function handleInvite() {
  sending.value = true
  inviteMsg.value = ''
  inviteError.value = false

  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/.netlify/functions/send-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        groupId: group.value.id,
        email: inviteEmail.value,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to send invite')
    inviteMsg.value = 'Invite sent!'
    inviteEmail.value = ''
  } catch (e) {
    inviteError.value = true
    inviteMsg.value = e.message
  } finally {
    sending.value = false
  }
}
</script>
