<template>
  <div class="max-w-md mx-auto mt-16">
    <h1 class="text-2xl font-bold mb-6">{{ $t('signup.title') }}</h1>
    <form class="space-y-4" @submit.prevent="handleSignUp">
      <div>
        <label class="block text-sm font-medium text-gray-700">{{
          $t('signup.displayName')
        }}</label>
        <input v-model="displayName" type="text" required class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('signup.email') }}</label>
        <input v-model="email" type="email" required class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ $t('signup.password') }}</label>
        <input v-model="password" type="password" required minlength="6" class="input" />
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-600 text-sm">{{ $t('signup.checkEmail') }}</p>
      <button type="submit" class="btn btn-primary w-full">
        {{ $t('signup.title') }}
      </button>
    </form>
    <p class="mt-4 text-sm text-gray-500">
      {{ $t('signup.alreadyHaveAccount') }}
      <router-link to="/login" class="text-indigo-600">{{ $t('signup.signIn') }}</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const displayName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref(false)

async function handleSignUp() {
  error.value = ''
  success.value = false
  const { error: err } = await auth.signUp(email.value, password.value, displayName.value)
  if (err) {
    error.value = err.message
  } else {
    success.value = true
  }
}
</script>
