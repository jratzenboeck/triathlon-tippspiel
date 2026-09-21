<template>
  <div class="max-w-md mx-auto mt-16 text-center">
    <div v-if="loading" class="text-gray-500">{{ $t('invite.processing') }}</div>
    <div v-else-if="error" class="text-red-600">
      <p class="font-bold mb-2">{{ $t('invite.invalid') }}</p>
      <p class="text-sm">{{ error }}</p>
    </div>
    <div v-else-if="joined" class="text-green-600">
      <p class="font-bold text-lg mb-2">{{ $t('invite.joined', { group: groupName }) }}</p>
      <router-link :to="`/groups/${groupId}`" class="text-indigo-600 hover:underline">{{
        $t('invite.goToGroup')
      }}</router-link>
    </div>
    <div v-else>
      <p class="text-lg mb-4">{{ $t('invite.invitedTo', { group: groupName }) }}</p>
      <div v-if="!auth.user">
        <p class="text-sm text-gray-500 mb-4">{{ $t('invite.signUpSignIn') }}</p>
        <router-link to="/signup" class="btn btn-primary">{{ $t('invite.signUp') }}</router-link>
        <span class="mx-2 text-gray-400">{{ $t('invite.or') }}</span>
        <router-link to="/login" class="text-indigo-600 hover:underline">{{
          $t('invite.signIn')
        }}</router-link>
      </div>
      <button v-else :disabled="accepting" class="btn btn-primary" @click="acceptInvite">
        {{ accepting ? $t('invite.joining') : $t('invite.joinGroup') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { storeInviteToken, popInviteToken } from '../lib/pending-invite'

const route = useRoute()
const auth = useAuthStore()
const { t } = useI18n()
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
    error.value = inviteErr?.message || t('invite.notFound')
    loading.value = false
    return
  }

  groupId.value = invite.group_id
  groupName.value = invite.groups?.name || t('invite.aGroup')

  if (!auth.user) storeInviteToken(route.params.token)

  if (auth.user) {
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId.value)
      .eq('user_id', auth.user.id)
    if (existing?.length) {
      joined.value = true
      popInviteToken()
    }
  }

  loading.value = false
})

async function acceptInvite() {
  accepting.value = true
  try {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    const res = await fetch('/.netlify/functions/accept-invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ token: route.params.token })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    joined.value = true
    popInviteToken()
  } catch (e) {
    error.value = e.message
  } finally {
    accepting.value = false
  }
}
</script>
