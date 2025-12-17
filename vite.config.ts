import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    // GitHub Pages用のbase path設定
    base: mode === 'production' ? '/typeflow/' : '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': `${__dirname}/src`,
      },
    },
    server: {
      port: 5173,
    },
  }
})
