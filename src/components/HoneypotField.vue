<template>
  <div class="sr-only" aria-hidden="true">
    <label for="website">Website</label>
    <input id="website" v-model="value" name="website" type="text" tabindex="-1" autocomplete="off" />
  </div>
</template>

<script setup>
const value = defineModel({ type: String, default: '' })
</script>