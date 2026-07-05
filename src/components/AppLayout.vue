<template>
  <div class="min-h-screen bg-gray-50">
    <nav v-if="auth.user" class="bg-white shadow-sm border-b">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <router-link to="/" class="font-bold text-lg text-indigo-600">
          Triathlon Tippspiel
        </router-link>
        <div class="flex items-center gap-4 text-sm">
          <router-link to="/groups" class="text-gray-600 hover:text-gray-900">Groups</router-link>
          <router-link to="/profile" class="text-gray-600 hover:text-gray-900">{{ auth.profile?.display_name }}</router-link>
          <button @click="handleSignOut" class="text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'

const auth = useAuthStore()

onMounted(() => {
  auth.fetchUser()
  supabase.auth.onAuthStateChange(() => {
    auth.fetchUser()
  })
})

async function handleSignOut() {
  await auth.signOut()
}
</script>
