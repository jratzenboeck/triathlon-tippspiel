import { createI18n } from 'vue-i18n'
import en from './locales/en.js'
import de from './locales/de.js'

const stored = localStorage.getItem('locale')
const browser = (navigator.language || '').toLowerCase().startsWith('de') ? 'de' : 'en'

export const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: stored || browser,
  fallbackLocale: 'en',
  messages: { en, de },
})

export function setLocale(locale) {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  localStorage.setItem('locale', locale)
}