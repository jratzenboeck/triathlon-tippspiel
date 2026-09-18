<template>
  <div class="min-h-screen bg-gray-50">
    <nav v-if="auth.user" class="bg-white shadow-sm border-b">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 font-bold text-lg text-indigo-600">
          <AppLogo :size="30" />
          Triathlon Tippspiel
        </router-link>

        <div class="hidden sm:flex items-center gap-4 text-sm">
          <router-link to="/groups" class="text-gray-600 hover:text-gray-900">Groups</router-link>
          <router-link to="/bets" class="text-gray-600 hover:text-gray-900">My bets</router-link>
          <router-link to="/profile" class="text-gray-600 hover:text-gray-900">Profile</router-link>
          <button @click="handleSignOut" class="text-gray-400 hover:text-gray-600">Sign out</button>
        </div>

        <button @click="menuOpen = !menuOpen" class="sm:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'">
          <svg v-if="!menuOpen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="menuOpen" class="sm:hidden border-t">
        <div class="max-w-5xl mx-auto px-4 py-2 flex flex-col text-sm">
          <router-link to="/groups" @click="menuOpen = false" class="py-2.5 text-gray-600 hover:text-gray-900">Groups</router-link>
          <router-link to="/bets" @click="menuOpen = false" class="py-2.5 text-gray-600 hover:text-gray-900">My bets</router-link>
          <router-link to="/profile" @click="menuOpen = false" class="py-2.5 text-gray-600 hover:text-gray-900">Profile</router-link>
          <button @click="handleSignOut" class="py-2.5 text-left text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
      </div>
    </nav>
    <main class="max-w-5xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import AppLogo from './AppLogo.vue'

const auth = useAuthStore()
const router = useRouter()
const menuOpen = ref(false)

onMounted(() => {
  auth.fetchUser()
  supabase.auth.onAuthStateChange(() => {
    auth.fetchUser()
  })
})

async function handleSignOut() {
  menuOpen.value = false
  await auth.signOut()
  router.push('/login')
}
</script>