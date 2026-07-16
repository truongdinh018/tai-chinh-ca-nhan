import { Cursor, Footer, Icon, Tabs } from 'animal-island-ui'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api } from './api/client'
import { EntityModal } from './components/EntityModal'
import { ImportJsonModal } from './components/ImportJsonModal'
import { useI18n } from './i18n/I18nContext'
import {
  isAppTab,
  readLocationRoute,
  routesEqual,
  toHash,
  type AppTab,
  type RouteState,
} from './navigation/route'
import { notifyError, notifySuccess } from './notify'
import { AccountsPage } from './pages/AccountsPage'
import { AssetsPage } from './pages/AssetsPage'
import { CalendarPage } from './pages/CalendarPage'
import { Dashboard } from './pages/Dashboard'
import { DataPage } from './pages/DataPage'
import { DebtsPage } from './pages/DebtsPage'
import { PlanPage } from './pages/PlanPage'
import { SalaryPage } from './pages/SalaryPage'
import { ToolsPage } from './pages/ToolsPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { UnlockScreen } from './pages/UnlockScreen'
import { useTheme } from './theme/ThemeContext'
import './App.css'

const DEFAULT_TOOL = 'luong_gross_net'

export default function App() {
  const { t, locale, setLocale } = useI18n()
  const { theme, setTheme } = useTheme()
  const [ready, setReady] = useState(false)
  const [needsUnlock, setNeedsUnlock] = useState(false)
  const [lockEnabled, setLockEnabled] = useState(false)
  const [error, setError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [dataEpoch, setDataEpoch] = useState(0)
  const initial = useMemo(() => readLocationRoute(), [])
  const [tab, setTab] = useState<AppTab>(initial.tab)
  const [focusToolId, setFocusToolId] = useState<string>(
    initial.toolId || DEFAULT_TOOL,
  )
  const lastToolRef = useRef(initial.toolId || DEFAULT_TOOL)
  const routeRef = useRef<RouteState>({
    tab: initial.tab,
    toolId: initial.tab === 'tools' ? initial.toolId || DEFAULT_TOOL : null,
  })

  const applyRoute = useCallback((route: RouteState) => {
    setTab(route.tab)
    if (route.tab === 'tools') {
      const tool = route.toolId || lastToolRef.current || DEFAULT_TOOL
      lastToolRef.current = tool
      setFocusToolId(tool)
      routeRef.current = { tab: 'tools', toolId: tool }
    } else {
      routeRef.current = { tab: route.tab, toolId: null }
    }
  }, [])

  const navigate = useCallback(
    (next: RouteState, mode: 'push' | 'replace' = 'push') => {
      const normalized: RouteState =
        next.tab === 'tools'
          ? {
              tab: 'tools',
              toolId: next.toolId || lastToolRef.current || DEFAULT_TOOL,
            }
          : { tab: next.tab, toolId: null }

      const prev = routeRef.current
      const unchanged = routesEqual(prev, normalized)
      applyRoute(normalized)

      const hash = toHash(normalized)
      if (mode === 'replace' || unchanged) {
        history.replaceState(normalized, '', hash)
        return
      }
      history.pushState(normalized, '', hash)
    },
    [applyRoute],
  )

  useEffect(() => {
    void (async () => {
      try {
        const { locked, unlocked } = await api.lockStatus()
        setLockEnabled(locked)
        if (locked && !unlocked) {
          setNeedsUnlock(true)
          setReady(true)
          return
        }
        await api.status()
        setReady(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e))
        setReady(true)
      }
    })()
  }, [])

  useEffect(() => {
    const boot = routeRef.current
    const normalized: RouteState =
      boot.tab === 'tools'
        ? { tab: 'tools', toolId: boot.toolId || DEFAULT_TOOL }
        : { tab: boot.tab, toolId: null }
    history.replaceState(normalized, '', toHash(normalized))
  }, [])

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      const fromState = parseStored(event.state)
      applyRoute(fromState ?? readLocationRoute())
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [applyRoute])

  if (!ready) {
    return (
      <Cursor>
        <div className="boot-error muted">{t('app.booting')}</div>
      </Cursor>
    )
  }

  if (needsUnlock) {
    return (
      <Cursor>
        <UnlockScreen
          onUnlocked={() => {
            setNeedsUnlock(false)
            setLockEnabled(true)
          }}
        />
      </Cursor>
    )
  }

  function openTool(toolId: string) {
    navigate({ tab: 'tools', toolId }, 'push')
  }

  function onTabChange(key: string) {
    if (!isAppTab(key)) return
    navigate(
      {
        tab: key,
        toolId: key === 'tools' ? lastToolRef.current : null,
      },
      'push',
    )
  }

  function onToolNavigate(toolId: string) {
    navigate({ tab: 'tools', toolId }, 'push')
  }

  async function confirmResetData() {
    setResetBusy(true)
    try {
      await api.clearAll()
      notifySuccess(t('app.resetDone'))
      setResetOpen(false)
      window.location.hash = '#/dash'
      window.location.reload()
    } catch (err) {
      notifyError(t('app.resetFail'), err instanceof Error ? err.message : String(err))
    } finally {
      setResetBusy(false)
    }
  }

  const items = [
    {
      key: 'dash',
      label: t('tab.dash'),
      children: <Dashboard onOpenTool={openTool} />,
    },
    { key: 'assets', label: t('tab.assets'), children: <AssetsPage /> },
    { key: 'accounts', label: t('tab.accounts'), children: <AccountsPage /> },
    { key: 'tx', label: t('tab.tx'), children: <TransactionsPage /> },
    { key: 'calendar', label: t('tab.calendar'), children: <CalendarPage /> },
    { key: 'salary', label: t('tab.salary'), children: <SalaryPage /> },
    { key: 'debts', label: t('tab.debts'), children: <DebtsPage /> },
    { key: 'plan', label: t('tab.plan'), children: <PlanPage /> },
    {
      key: 'tools',
      label: t('tab.tools'),
      children: <ToolsPage focusToolId={focusToolId} onToolNavigate={onToolNavigate} />,
    },
    { key: 'data', label: t('tab.data'), children: <DataPage onLockChange={setLockEnabled} /> },
  ]

  return (
    <Cursor>
      <div className="page-shell screen-only">
        <div className="sky" aria-hidden>
          <span className="cloud c1" />
          <span className="cloud c2" />
          <span className="cloud c3" />
          <span className="orb o1" />
          <span className="orb o2" />
          <span className="orb o3" />
        </div>
        <div className="app-shell">
          <header className="topbar">
            <div className="brand-mark">
              <Icon name="icon-shopping" size={28} bounce />
              <span>{t('app.title')}</span>
            </div>
            <div className="prefs-bar" role="group" aria-label="Preferences">
              <div className="prefs-segment">
                <button
                  type="button"
                  className={locale === 'vi' ? 'is-active' : undefined}
                  onClick={() => setLocale('vi')}
                >
                  {t('app.lang.vi')}
                </button>
                <button
                  type="button"
                  className={locale === 'en' ? 'is-active' : undefined}
                  onClick={() => setLocale('en')}
                >
                  {t('app.lang.en')}
                </button>
              </div>
              <div className="prefs-segment">
                <button
                  type="button"
                  className={theme === 'light' ? 'is-active' : undefined}
                  onClick={() => setTheme('light')}
                  title={t('app.theme.light')}
                >
                  ☀️
                </button>
                <button
                  type="button"
                  className={theme === 'dark' ? 'is-active' : undefined}
                  onClick={() => setTheme('dark')}
                  title={t('app.theme.dark')}
                >
                  🌙
                </button>
              </div>
              <button
                type="button"
                className="prefs-icon-btn"
                onClick={() => setImportOpen(true)}
                title={t('app.importJson')}
                aria-label={t('app.importJson')}
              >
                <span aria-hidden>↥</span>
              </button>
              {lockEnabled ? (
                <button
                  type="button"
                  className="prefs-icon-btn"
                  onClick={() => {
                    api.lockSession()
                    setNeedsUnlock(true)
                  }}
                  title={t('app.lockNow')}
                  aria-label={t('app.lockNow')}
                >
                  <span aria-hidden>🔒</span>
                </button>
              ) : null}
              <button
                type="button"
                className="prefs-icon-btn prefs-icon-btn--danger"
                onClick={() => setResetOpen(true)}
                title={t('app.resetData')}
                aria-label={t('app.resetData')}
              >
                <span aria-hidden>↻</span>
              </button>
            </div>
          </header>
          {error ? <p className="error">{error}</p> : null}
          <div className="main-panel" key={dataEpoch}>
            <Tabs
              items={items}
              activeKey={tab}
              onChange={onTabChange}
              aria-label="Finance sections"
            />
          </div>
        </div>
        <div className="site-footer" aria-hidden>
          <Footer type="sea" seamless />
        </div>
      </div>
      <ImportJsonModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onApplied={() => {
          setImportOpen(false)
          setDataEpoch((n) => n + 1)
        }}
      />
      <EntityModal
        open={resetOpen}
        mode="delete"
        title={t('app.resetConfirmTitle')}
        busy={resetBusy}
        deleteLabel={t('app.resetData')}
        onClose={() => {
          if (!resetBusy) setResetOpen(false)
        }}
        onConfirmDelete={confirmResetData}
      >
        <p>{t('app.resetConfirmBody')}</p>
      </EntityModal>
    </Cursor>
  )
}

function parseStored(state: unknown): RouteState | null {
  if (!state || typeof state !== 'object') return null
  const tab = (state as { tab?: unknown }).tab
  const toolId = (state as { toolId?: unknown }).toolId
  if (typeof tab !== 'string' || !isAppTab(tab)) return null
  return {
    tab,
    toolId: typeof toolId === 'string' ? toolId : null,
  }
}
