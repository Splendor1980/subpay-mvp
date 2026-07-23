import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// On Replit: PORT and BASE_PATH are injected by the platform.
// On Railway / any other host: PORT is set by the platform, BASE_PATH defaults to '/'.
const rawPort = process.env.PORT;
const isReplit = process.env.REPL_ID !== undefined;

if (!rawPort && isReplit) {
  throw new Error('PORT environment variable is required but was not provided.');
}

const port = rawPort ? Number(rawPort) : 3000;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

const isReplitDev =
  process.env.NODE_ENV !== 'production' && process.env.REPL_ID !== undefined;

const replitDevPlugins = isReplitDev
  ? await Promise.all([
      import('@replit/vite-plugin-cartographer').then((m) =>
        m.cartographer({
          root: path.resolve(import.meta.dirname, '..'),
        }),
      ),
      import('@replit/vite-plugin-dev-banner').then((m) => m.devBanner()),
    ])
  : [];

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...replitDevPlugins,
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    // Required for @rialo packages to resolve browser-compatible exports
    conditions: ['browser', 'module', 'import'],
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
