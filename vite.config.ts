import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(() => {
  // Tauriでは特定の環境変数を使用
  const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined

  return {
    // Cloudflare Pagesではルートパスを使用
    // GitHub Pagesを使用する場合は base: '/typeflow/' に変更
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': `${__dirname}/src`,
      },
    },
    // Tauri開発モードで必要
    clearScreen: false,
    server: {
      port: 5173,
      // Tauriからアクセスできるようにする
      strictPort: true,
      host: isTauri ? '127.0.0.1' : undefined,
    },
    // TAURI_で始まる環境変数へのアクセスを許可
    envPrefix: ['VITE_', 'TAURI_'],
    // ビルド設定
    // 注意: src/server ディレクトリは tsconfig.json で除外されているため、
    // フロントエンドのビルドには含まれません
    build: {
      // ビルドの最適化設定
      minify: 'esbuild' as const,
      sourcemap: false,
      // Tauriでは特定のターゲットを指定
      target: isTauri ? ['es2021', 'chrome100', 'safari13'] : 'esnext',
    },
  }
})
