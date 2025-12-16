/// <reference types="vite/client" />

// Node.js 20.11+ ESM import.meta properties
interface ImportMeta {
  dirname: string
  filename: string
}

// Vite環境変数の型定義
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
