<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from './components/AppLayout.vue'
import { supabase } from './lib/supabase'
import { getInviteToken } from './lib/pending-invite'

const router = useRouter()

function redirectToPendingInvite() {
  const token = getInviteToken()
  if (token && !router.currentRoute.value.path.startsWith(`/invite/${token}`)) {
    router.push(`/invite/${token}`)
  }
}

onMounted(async () => {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (session) redirectToPendingInvite()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') redirectToPendingInvite()
  })
})
</script>
