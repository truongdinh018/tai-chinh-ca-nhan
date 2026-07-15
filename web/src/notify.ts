/** Lightweight toast — avoids animal-island-ui Notification (React 18 client shim breaks on React 19). */

type Kind = 'success' | 'error' | 'info'

type ToastOpts = {
  message: string
  description?: string
  durationMs?: number
  kind?: Kind
}

let root: HTMLDivElement | null = null

function ensureRoot(): HTMLDivElement {
  if (root?.isConnected) return root
  root = document.createElement('div')
  root.className = 'app-toast-root'
  root.setAttribute('aria-live', 'polite')
  document.body.appendChild(root)
  return root
}

export function notify(opts: ToastOpts) {
  if (typeof document === 'undefined') return
  const host = ensureRoot()
  const el = document.createElement('div')
  el.className = `app-toast app-toast--${opts.kind ?? 'info'}`
  el.setAttribute('role', 'status')

  const title = document.createElement('div')
  title.className = 'app-toast-title'
  title.textContent = opts.message
  el.appendChild(title)

  if (opts.description) {
    const desc = document.createElement('div')
    desc.className = 'app-toast-desc'
    desc.textContent = opts.description
    el.appendChild(desc)
  }

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'app-toast-close'
  close.setAttribute('aria-label', 'Close')
  close.textContent = '×'
  close.onclick = () => el.remove()
  el.appendChild(close)

  host.appendChild(el)
  requestAnimationFrame(() => el.classList.add('is-on'))

  const ms = opts.durationMs ?? (opts.kind === 'error' ? 4500 : 3000)
  window.setTimeout(() => {
    el.classList.remove('is-on')
    window.setTimeout(() => el.remove(), 220)
  }, ms)
}

export function notifySuccess(message: string, description?: string) {
  notify({ message, description, kind: 'success' })
}

export function notifyError(message: string, description?: string) {
  notify({ message, description, kind: 'error' })
}
