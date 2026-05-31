import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Backend target used by the dev proxy (avoids CORS in development).
  const apiTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000';

  return {
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': { target: apiTarget, changeOrigin: true },
        '/health': { target: apiTarget, changeOrigin: true },
        '/version': { target: apiTarget, changeOrigin: true },
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            katex: ['katex'],
            highlight: ['react-syntax-highlighter'],
            markdown: ['react-markdown'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
