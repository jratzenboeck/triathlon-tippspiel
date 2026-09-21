<template>
  <div class="max-w-md mx-auto mt-16">
    <div class="flex flex-col items-center mb-8">
      <AppLogo :size="64" />
      <h1 class="text-2xl font-bold mt-4">Triathlon Tippspiel</h1>
    </div>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <HoneypotField v-model="honeypot" />
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('login.email') }}</label>
        <input v-model="email" type="email" required class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('login.password') }}</label>
        <input v-model="password" type="password" required class="input" />
      </div>
      <div class="text-right">
        <router-link to="/forgot-password" class="text-sm text-indigo-600">{{
          $t('login.forgotPassword')
        }}</router-link>
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <button type="submit" class="btn btn-primary w-full">
        {{ $t('login.signIn') }}
      </button>
    </form>
    <p class="mt-4 text-sm text-gray-500">
      {{ $t('login.noAccount') }}
      <router-link to="/signup" class="text-indigo-600">{{ $t('login.signUp') }}</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import AppLogo from '../components/AppLogo.vue'
import HoneypotField from '../components/HoneypotField.vue'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const honeypot = ref('')
const error = ref('')

async function handleLogin() {
  error.value = ''
  if (honeypot.value) return
  const { error: err } = await auth.signIn(email.value, password.value)
  if (err) {
    error.value = err.message
  } else {
    router.push('/')
  }
}
</script>
