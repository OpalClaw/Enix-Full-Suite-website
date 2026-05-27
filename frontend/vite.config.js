import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// =============================================================================
// Vite config — Enix Exteriors frontend
// =============================================================================
// • Validates required VITE_* env vars at build time (fails fast in CI).
// • Splits vendor chunks for better caching.
// • Source maps off in production by default (opt-in via VITE_PRODUCTION_SOURCEMAPS).
// • Base path "/" — compatible with Cloudflare Pages, Zo Space, Nginx.

const REQUIRED_ENV = ['VITE_API_BASE_URL', 'VITE_LEAD_API_URL'];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Fail the production build if required env vars are missing.
  if (mode === 'production') {
    const missing = REQUIRED_ENV.filter((k) => !env[k]);
    if (missing.length) {
      throw new Error(
        `Missing required VITE_* env vars for production build: ${missing.join(', ')}`,
      );
    }
  }

  const sourcemap = env.VITE_PRODUCTION_SOURCEMAPS === 'true' || mode !== 'production';

  return {
    base: '/',
    logLevel: 'error',
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      target: 'es2020',
      sourcemap,
      minify: 'esbuild',
      cssMinify: 'esbuild',
      // 1MB warning threshold per chunk.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]react(-dom|-router-dom)?[\\/]/.test(id)) return 'vendor-react';
            if (/@radix-ui[\\/]react-(dialog|dropdown-menu|popover|select|tabs|toast|tooltip)/.test(id)) return 'vendor-radix';
            if (/@tanstack[\\/]react-query/.test(id)) return 'vendor-query';
            if (/[\\/]recharts[\\/]/.test(id)) return 'vendor-charts';
            if (/[\\/](jspdf|html2canvas)[\\/]/.test(id)) return 'vendor-pdf';
            if (/[\\/]three[\\/]/.test(id)) return 'vendor-three';
            if (/[\\/]lucide-react[\\/]/.test(id)) return 'vendor-icons';
            return undefined;
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: false,
    },
    preview: {
      port: 4173,
      strictPort: false,
    },
  };
});
