<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" role="img" aria-label="Triathlon Tippspiel">
    <defs>
      <linearGradient id="tt-logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6366f1" />
        <stop offset="1" stop-color="#a855f7" />
      </linearGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#tt-logo-grad)" />
    <text x="12" y="12" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="11" letter-spacing="0.5">
      TRI
    </text>
  </svg>
</template>

<script setup>
defineProps({
  size: { type: [Number, String], default: 32 },
})
</script>