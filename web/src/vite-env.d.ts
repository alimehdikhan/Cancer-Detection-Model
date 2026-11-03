/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the API, default `/api/v1` (proxied in dev and by nginx in production). */
  readonly VITE_API_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
