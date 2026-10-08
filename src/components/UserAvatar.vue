<template>
  <img
    v-if="url && !failed"
    :src="url"
    :alt="$t('profile.pictureAlt', { name })"
    :class="['shrink-0 rounded-full object-cover', size]"
    @error="failed = true"
  />
  <span
    v-else
    :class="[
      'flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700',
      size
    ]"
    aria-hidden="true"
  >
    {{ initial }}
  </span>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '../lib/supabase'

const BUCKET_NAME = 'profile-pictures'

const props = defineProps({
  name: { type: String, default: '' },
  avatarPath: { type: String, default: null },
  size: { type: String, default: 'h-8 w-8 text-sm' }
})

const failed = ref(false)

watch(
  () => props.avatarPath,
  () => {
    failed.value = false
  }
)

const url = computed(() =>
  props.avatarPath
    ? supabase.storage.from(BUCKET_NAME).getPublicUrl(props.avatarPath).data.publicUrl
    : null
)

const initial = computed(() => props.name.charAt(0).toUpperCase() || '?')
</script>
