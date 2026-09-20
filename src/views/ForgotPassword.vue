<template>
  <div class="max-w-md mx-auto mt-16">
    <div class="flex flex-col items-center mb-8">
      <AppLogo :size="64" />
      <h1 class="text-2xl font-bold mt-4">{{ $t('forgotPassword.title') }}</h1>
    </div>
    <p class="mb-4 text-sm text-gray-500">{{ $t('forgotPassword.description') }}</p>
    <form class="space-y-4" @submit.prevent="handleReset">
      <div>
        <label class="block text-sm font-medium text-gray-700">{{
          $t('forgotPassword.email')
        }}</label>
        <input v-model="email" type="email" required class="input" />
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <p v-if="sent" class="text-green-600 text-sm">{{ $t('forgotPassword.sent') }}</p>
      <button type="submit" :disabled="sending" class="btn btn-primary w-full">
        {{ $t('forgotPassword.submit') }}
      </button>
    </form>
    <p class="mt-4 text-sm text-gray-500">
      <router-link to="/login" class="text-indigo-600">{{ $t('forgotPassword.backToLogin') }}</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import AppLogo from '../components/AppLogo.vue'

const auth = useAuthStore()

const email = ref('')
const error = ref('')
const sent = ref(false)
const sending = ref(false)

async function handleReset() {
  error.value = ''
  sent.value = false
  sending.value = true
  const { error: err } = await auth.resetPassword(email.value)
  sending.value = false
  if (err) {
    error.value = err.message
  } else {
    sent.value = true
  }
}
</script>