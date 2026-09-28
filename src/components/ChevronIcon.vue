<template>
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    class="h-4 w-4 text-gray-400 shrink-0 transition-transform"
    :class="{ 'rotate-180': open }"
  >
    <path
      fill-rule="evenodd"
      d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z"
      clip-rule="evenodd"
    />
  </svg>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false }
})
</script>
