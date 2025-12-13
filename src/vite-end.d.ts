/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Node.js 20.11+ ESM import.meta properties
interface ImportMeta {
  dirname: string
  filename: string
}