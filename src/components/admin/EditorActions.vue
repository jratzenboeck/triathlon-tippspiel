<template>
  <div class="mt-4 flex flex-wrap items-center gap-3">
    <button
      v-if="addLabel"
      type="button"
      class="btn bg-gray-100 text-gray-800 hover:bg-gray-200"
      @click="$emit('add')"
    >
      + {{ addLabel }}
    </button>
    <button type="button" class="btn btn-primary" :disabled="saving" @click="$emit('save')">
      {{ saving ? $t('race.saving') : saveLabel || $t('admin.save') }}
    </button>
    <span v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</span>
  </div>
</template>

<script setup>
defineProps({
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
  addLabel: { type: String, default: '' },
  saveLabel: { type: String, default: '' }
})
defineEmits(['add', 'save'])
</script>
