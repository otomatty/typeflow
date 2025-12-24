import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 翻訳リソース
import jaCommon from './locales/ja/common.json'
import jaMenu from './locales/ja/menu.json'
import jaGame from './locales/ja/game.json'
import jaSettings from './locales/ja/settings.json'
import jaStats from './locales/ja/stats.json'
import jaWords from './locales/ja/words.json'
import jaPractice from './locales/ja/practice.json'

import enCommon from './locales/en/common.json'
import enMenu from './locales/en/menu.json'
import enGame from './locales/en/game.json'
import enSettings from './locales/en/settings.json'
import enStats from './locales/en/stats.json'
import enWords from './locales/en/words.json'
import enPractice from './locales/en/practice.json'

const resources = {
  ja: {
    common: jaCommon,
    menu: jaMenu,
    game: jaGame,
    settings: jaSettings,
    stats: jaStats,
    words: jaWords,
    practice: jaPractice,
  },
  en: {
    common: enCommon,
    menu: enMenu,
    game: enGame,
    settings: enSettings,
    stats: enStats,
    words: enWords,
    practice: enPractice,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ja',
    defaultNS: 'common',
    ns: ['common', 'menu', 'game', 'settings', 'stats', 'words', 'practice'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'typeflow-language',
    },
  })

export default i18n
