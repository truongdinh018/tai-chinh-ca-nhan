/** Shim for animal-island-ui Notification (React 18 client bundle breaks on React 19). */
import { createRoot, hydrateRoot } from 'react-dom/client'

export const c = { createRoot, hydrateRoot }
