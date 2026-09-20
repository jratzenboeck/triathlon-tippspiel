<template>
  <div>
    <div v-if="loading" class="text-gray-500">Loading...</div>
    <div v-else-if="!group" class="text-gray-500">Group not found.</div>
    <div v-else>
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">{{ group.name }}</h1>
          <p class="text-sm text-gray-500">
            {{ members.length }} member{{ members.length !== 1 ? 's' : '' }}
          </p>
        </div>
      </div>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Leaderboard</h2>
        <div v-if="leaderboard.length === 0" class="text-gray-400">No bets placed yet.</div>
        <div
          v-for="(entry, i) in leaderboard"
          :key="i"
          class="bg-white rounded-lg shadow-sm border p-3 mb-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-3">
            <span class="font-bold text-gray-400 w-6">{{ i + 1 }}.</span>
            <span>{{ entry.display_name }}</span>
          </div>
          <span class="font-semibold">{{ entry.total_points }} pts</span>
        </div>
      </section>

      <section class="mb-8">
        <h2 class="text-lg font-semibold mb-3">Members</h2>
        <p v-if="memberError" class="mb-2 text-sm text-red-600">{{ memberError }}</p>
        <div
          v-for="m in members"
          :key="m.id"
          class="bg-white rounded-lg shadow-sm border p-3 mb-2 flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span>{{ m.display_name }}</span>
            <span
              v-if="m.is_admin"
              class="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
            >
              Admin
            </span>
          </div>
          <button
            v-if="isAdmin && !m.is_admin"
            :disabled="grantingId === m.id"
            class="btn btn-tab-inactive text-sm"
            @click="grantAdmin(m.id)"
          >
            {{ grantingId === m.id ? 'Granting...' : 'Make admin' }}
          </button>
        </div>
      </section>

      <section v-if="isAdmin">
        <h2 class="text-lg font-semibold mb-3">Invite members</h2>
        <form class="flex gap-2" @submit.prevent="handleInvite">
          <input
            v-model="inviteEmail"
            type="email"
            placeholder="Email address"
            required
            class="input flex-1 !mt-0"
          />
          <button type="submit" :disabled="sending" class="btn btn-primary">
            {{ sending ? 'Sending...' : 'Invite' }}
          </button>
        </form>
        <p
          v-if="inviteMsg"
          class="mt-2 text-sm"
          :class="inviteError ? 'text-red-600' : 'text-green-600'"
        >
          {{ inviteMsg }}
        </p>
      </section>
      <p v-else class="text-sm text-gray-500">Only group admins can invite members.</p>
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
const isAdmin = ref(false)
const grantingId = ref(null)
const memberError = ref('')
const inviteEmail = ref('')
const sending = ref(false)
const inviteMsg = ref('')
const inviteError = ref(false)

onMounted(async () => {
  const { data: g } = await supabase.from('groups').select('*').eq('id', route.params.id).single()
  group.value = g

  const { data: ms } = await supabase
    .from('group_members')
    .select('user_id, is_admin, profiles(*)')
    .eq('group_id', route.params.id)
  members.value = (ms || [])
    .map((m) => ({ id: m.user_id, display_name: m.profiles?.display_name, is_admin: m.is_admin }))
    .filter((m) => m.display_name)

  isAdmin.value = !!members.value.find((m) => m.id === auth.user.id)?.is_admin

  const { data: bs } = await supabase
    .from('bets')
    .select('user_id, points, profiles!inner(display_name)')
    .in(
      'user_id',
      members.value.map((m) => m.id)
    )
  if (bs) {
    const grouped = {}
    for (const b of bs) {
      if (!grouped[b.user_id])
        grouped[b.user_id] = {
          user_id: b.user_id,
          display_name: b.profiles.display_name,
          total_points: 0
        }
      grouped[b.user_id].total_points += b.points || 0
    }
    leaderboard.value = Object.values(grouped).sort((a, b) => b.total_points - a.total_points)
  }

  loading.value = false
})

async function grantAdmin(userId) {
  grantingId.value = userId
  memberError.value = ''
  try {
    const { error } = await supabase.rpc('grant_group_admin', {
      group_id: group.value.id,
      user_id: userId
    })
    if (error) throw error
    const member = members.value.find((m) => m.id === userId)
    if (member) member.is_admin = true
  } catch (e) {
    memberError.value = e.message
  } finally {
    grantingId.value = null
  }
}

async function handleInvite() {
  sending.value = true
  inviteMsg.value = ''
  inviteError.value = false

  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    const res = await fetch('/.netlify/functions/send-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({
        groupId: group.value.id,
        email: inviteEmail.value
      })
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
