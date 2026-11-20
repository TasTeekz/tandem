import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import kk from './locales/kk.json'
import ru from './locales/ru.json'

export const LOCALES = ['en', 'ru', 'kk'] as const
export type Locale = (typeof LOCALES)[number]

const stored = (() => {
  try { return localStorage.getItem('tandem-locale') } catch { return null }
})()

void i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, ru: { translation: ru }, kk: { translation: kk } },
  lng: stored && (LOCALES as readonly string[]).includes(stored) ? stored : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export const setLocale = (l: Locale) => {
  void i18next.changeLanguage(l)
  try { localStorage.setItem('tandem-locale', l) } catch { /* storage blocked */ }
}

export { i18next }
