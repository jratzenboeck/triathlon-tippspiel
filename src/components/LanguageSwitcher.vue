<template>
  <div
    class="flex items-center rounded-full border border-gray-300 overflow-hidden text-xs font-semibold"
    role="group"
    :aria-label="$t('nav.language')"
  >
    <button
      type="button"
      :class="btnClass('en')"
      :aria-pressed="locale === 'en'"
      @click="setLocale('en')"
    >
      EN
    </button>
    <button
      type="button"
      :class="btnClass('de')"
      :aria-pressed="locale === 'de'"
      @click="setLocale('de')"
    >
      DE
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { setLocale as applyLocale } from '../i18n'

const { locale } = useI18n()

function btnClass(code) {
  return locale.value === code
    ? 'bg-indigo-600 text-white px-2.5 py-1'
    : 'bg-white text-gray-500 hover:text-gray-900 px-2.5 py-1'
}

function setLocale(code) {
  applyLocale(code)
}
</script>
