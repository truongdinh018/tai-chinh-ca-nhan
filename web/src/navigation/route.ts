/** Hash routes: `#/dash`, `#/assets`, `#/tools/fire` */

export const APP_TABS = [
  'dash',
  'assets',
  'accounts',
  'tx',
  'calendar',
  'salary',
  'debts',
  'plan',
  'tools',
  'data',
] as const

export type AppTab = (typeof APP_TABS)[number]

export type RouteState = {
  tab: AppTab
  toolId: string | null
}

export function isAppTab(value: string): value is AppTab {
  return (APP_TABS as readonly string[]).includes(value)
}

export function parseHash(hash: string): RouteState {
  const raw = decodeURIComponent(hash.replace(/^#\/?/, '').trim())
  if (!raw) return { tab: 'dash', toolId: null }

  const [tabPartRaw = '', toolPart = ''] = raw.split('/')
  // Old hashes `#/sync` and `#/export` → merged data tab
  const tabPart = tabPartRaw === 'sync' || tabPartRaw === 'export' ? 'data' : tabPartRaw
  const tab = isAppTab(tabPart) ? tabPart : 'dash'
  const toolId = tab === 'tools' && toolPart ? toolPart : null
  return { tab, toolId }
}

export function toHash({ tab, toolId }: RouteState): string {
  if (tab === 'tools' && toolId) return `#/${tab}/${encodeURIComponent(toolId)}`
  return `#/${tab}`
}

export function routesEqual(a: RouteState, b: RouteState): boolean {
  if (a.tab !== b.tab) return false
  if (a.tab === 'tools') return (a.toolId || '') === (b.toolId || '')
  return true
}

export function readLocationRoute(): RouteState {
  return parseHash(window.location.hash)
}
