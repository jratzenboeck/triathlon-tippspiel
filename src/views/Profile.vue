<template>
  <div class="max-w-md mx-auto mt-8">
    <h1 class="text-2xl font-bold mb-6">Profile</h1>
    <div class="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Display name</label>
        <p class="mt-1 text-gray-900">{{ auth.profile?.display_name }}</p>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Email</label>
        <p class="mt-1 text-gray-900">{{ auth.user?.email }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()
</script>
