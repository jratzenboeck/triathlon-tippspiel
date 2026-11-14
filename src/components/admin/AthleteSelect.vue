<template>
  <select
    :value="modelValue || ''"
    class="input !mt-0 !py-1.5"
    :aria-label="label"
    @change="$emit('update:modelValue', $event.target.value || null)"
  >
    <option value="">{{ $t('admin.pickAthlete') }}</option>
    <option v-for="a in athletes" :key="a.id" :value="a.id">
      {{ a.full_name }}{{ a.country ? ` (${a.country})` : '' }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: null },
  athletes: { type: Array, required: true },
  label: { type: String, default: '' }
})
defineEmits(['update:modelValue'])
</script>
