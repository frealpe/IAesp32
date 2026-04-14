import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

// https://vite.dev/config/
// En desarrollo, el proxy redirige /api al servidor Express local (puerto 3000).
// En producción (compilado y servido desde el ESP32), las peticiones van al host real.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    cssInjectedByJsPlugin(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 0,
      deleteOriginFile: false
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },

    },
  },
  build: {
    emptyOutDir: true,
    assetsInlineLimit: 4096,
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        manualChunks: () => 'iot32',
        entryFileNames: `assets/iot32.js`,
        chunkFileNames: `assets/iot32.js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
  },
})
