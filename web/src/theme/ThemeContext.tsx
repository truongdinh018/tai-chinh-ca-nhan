import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { THEME_KEY, type ThemeMode } from '../i18n/types'

type ThemeValue = {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function readTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute('data-theme', theme)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => readTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const value = useMemo<ThemeValue>(() => {
    const setTheme = (next: ThemeMode) => {
      setThemeState(next)
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* ignore */
      }
      applyTheme(next)
    }
    return {
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }
  }, [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme outside provider')
  return ctx
}
