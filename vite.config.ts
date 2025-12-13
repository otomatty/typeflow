import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const projectRoot = import.meta.dirname

  return {
    // GitHub Pages用のbase path設定
    base: mode === 'production' ? '/typeflow/' : '/',
    plugins: [
      react(),
      tailwindcss(),
      // DO NOT REMOVE
      createIconImportProxy() as PluginOption,
      sparkPlugin() as PluginOption,
    ],
    resolve: {
      alias: {
        '@': `${projectRoot}/src`
      }
    },
    server: {
      port: 5173,
    },
  }
});
