import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { translate } from './messages'
import { LOCALE_KEY, type Locale } from './types'

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function readLocale(): Locale {
  try {
    const v = localStorage.getItem(LOCALE_KEY)
    if (v === 'en' || v === 'vi') return v
  } catch {
    /* ignore */
  }
  return 'vi'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readLocale())

  const value = useMemo<I18nValue>(() => {
    const setLocale = (next: Locale) => {
      setLocaleState(next)
      try {
        localStorage.setItem(LOCALE_KEY, next)
      } catch {
        /* ignore */
      }
      document.documentElement.lang = next === 'vi' ? 'vi' : 'en'
    }
    return {
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n outside provider')
  return ctx
}
