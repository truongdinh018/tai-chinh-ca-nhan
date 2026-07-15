import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'animal-island-ui/style'
import './animal-cursor.css'
import App from './App'
import { I18nProvider } from './i18n/I18nContext'
import { ThemeProvider } from './theme/ThemeContext'
import './App.css'

const boot = document.getElementById('boot')

function showBootError(err: unknown) {
  if (!boot) return
  boot.removeAttribute('data-done')
  boot.innerHTML = `<p><strong>Load error:</strong></p><pre style="white-space:pre-wrap">${
    err instanceof Error ? err.message : String(err)
  }</pre><p>Hard refresh (Ctrl+Shift+R) and try again.</p>`
}

try {
  boot?.setAttribute('data-done', '1')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <I18nProvider>
          <App />
        </I18nProvider>
      </ThemeProvider>
    </StrictMode>,
  )
} catch (err) {
  showBootError(err)
}

window.addEventListener('unhandledrejection', (ev) => {
  if (boot && !document.getElementById('root')?.childElementCount) {
    showBootError(ev.reason)
  }
})
