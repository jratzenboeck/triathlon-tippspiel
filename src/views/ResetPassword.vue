<template>
  <div class="max-w-md mx-auto mt-16">
    <div class="flex flex-col items-center mb-8">
      <AppLogo :size="64" />
      <h1 class="text-2xl font-bold mt-4">{{ $t('resetPassword.title') }}</h1>
    </div>

    <div v-if="loading" class="text-center text-sm text-gray-500">{{ $t('common.loading') }}</div>

    <form v-else-if="ready && !done" class="space-y-4" @submit.prevent="handleSubmit">
      <div>
        <label class="block text-sm font-medium text-gray-700">{{
          $t('resetPassword.password')
        }}</label>
        <input v-model="password" type="password" required minlength="6" class="input" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">{{
          $t('resetPassword.confirmPassword')
        }}</label>
        <input v-model="confirmPassword" type="password" required minlength="6" class="input" />
      </div>
      <p v-if="mismatch" class="text-red-600 text-sm">{{ $t('resetPassword.mismatch') }}</p>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
      <button type="submit" :disabled="updating" class="btn btn-primary w-full">
        {{ $t('resetPassword.submit') }}
      </button>
    </form>

    <div v-else-if="done" class="space-y-4 text-center">
      <p class="text-green-600 text-sm">{{ $t('resetPassword.success') }}</p>
      <router-link to="/login" class="btn btn-primary inline-block">{{
        $t('resetPassword.signIn')
      }}</router-link>
    </div>

    <div v-else class="space-y-4 text-center">
      <p class="text-red-600 text-sm">{{ $t('resetPassword.error') }}</p>
      <router-link to="/forgot-password" class="text-sm text-indigo-600">{{
        $t('resetPassword.requestNew')
      }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import AppLogo from '../components/AppLogo.vue'

const auth = useAuthStore()

const loading = ref(true)
const ready = ref(false)
const done = ref(false)
const updating = ref(false)
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const mismatch = ref(false)
let subscription = null

async function checkInitial() {
  await auth.fetchUser()
  if (auth.user) ready.value = true
  loading.value = false
}

function handleAuthChange(event) {
  if (event === 'PASSWORD_RECOVERY') {
    auth.fetchUser()
    ready.value = true
    loading.value = false
  }
}

onMounted(async () => {
  subscription = supabase.auth.onAuthStateChange(handleAuthChange)
  await checkInitial()
})

onUnmounted(() => {
  subscription?.data.subscription.unsubscribe()
})

async function handleSubmit() {
  error.value = ''
  mismatch.value = false
  if (password.value !== confirmPassword.value) {
    mismatch.value = true
    return
  }
  updating.value = true
  const { error: err } = await auth.updatePassword(password.value)
  updating.value = false
  if (err) {
    error.value = err.message
  } else {
    await auth.signOut()
    done.value = true
  }
}
</script>