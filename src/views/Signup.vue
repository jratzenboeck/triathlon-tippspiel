<template>
  <div class="max-w-md mx-auto mt-16">
    <h1 class="text-2xl font-bold mb-6">Sign up</h1>
    <form @submit.prevent="handleSignUp" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Display name</label>
        <input v-model="displayName" type="text" required class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <input v-model="email" type="email" required class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Password</label>
        <input v-model="password" type="password" required minlength="6" class="input" />
      </div>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <p v-if="success" class="text-green-600 text-sm">Check your email for the verification link.</p>
      <button type="submit" class="btn btn-primary w-full">
        Sign up
      </button>
    </form>
    <p class="mt-4 text-sm text-gray-500">
      Already have an account?
      <router-link to="/login" class="text-indigo-600">Sign in</router-link>
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
