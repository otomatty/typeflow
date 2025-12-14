import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
  ];

  // GitHub Spark plugins - iconImportProxy for dev, sparkPlugin disabled (causes 403)
  if (command === 'serve') {
    plugins.push(createIconImportProxy() as PluginOption);
    // sparkPlugin disabled - requires GitHub Spark platform authentication
    // plugins.push(sparkPlugin() as PluginOption);
  }

  return {
    // GitHub Pages用のbase path設定
    base: mode === 'production' ? '/typeflow/' : '/',
    plugins,
    resolve: {
      alias: {
        '@': `${__dirname}/src`
      }
    },
    server: {
      port: 5173,
    },
  }
});
