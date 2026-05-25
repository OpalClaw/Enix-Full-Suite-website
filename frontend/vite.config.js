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
          manualChunks: {
            // Group huge libraries into their own chunks so the main bundle
            // stays small and changes to app code don't invalidate vendor cache.
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-radix': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
            ],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-charts': ['recharts'],
            'vendor-pdf': ['jspdf', 'html2canvas'],
            'vendor-three': ['three'],
            'vendor-icons': ['lucide-react'],
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
