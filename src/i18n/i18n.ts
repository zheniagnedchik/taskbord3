import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '@/locales/en.json'
import ru from '@/locales/ru.json'

export const LOCALE_STORAGE_KEY = 'taskbord3-locale'

export type AppLocale = 'en' | 'ru'

function normalizeLng(raw: string | null | undefined): AppLocale {
  if (!raw) return 'en'
  const lower = raw.toLowerCase()
  if (lower === 'ru' || lower.startsWith('ru-')) return 'ru'
  return 'en'
}

function initialLanguage(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (stored) return normalizeLng(stored)
  } catch {
    /* ignore */
  }
  return normalizeLng(typeof navigator !== 'undefined' ? navigator.language : 'en')
}

function syncDomLang(lng: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

syncDomLang(i18n.language)

i18n.on('languageChanged', (lng) => {
  syncDomLang(lng)
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
})

export default i18n
