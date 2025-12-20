import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(() => {
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
    server: {
      port: 5173,
    },
    // ビルド設定
    // 注意: src/server ディレクトリは tsconfig.json で除外されているため、
    // フロントエンドのビルドには含まれません
    build: {
      // ビルドの最適化設定
      minify: 'esbuild' as const,
      sourcemap: false,
    },
  }
})
