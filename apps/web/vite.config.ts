import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const envDir = path.resolve(__dirname, '../../');

const spaPreviewRoutes = ['/app', '/board', '/invite', '/auth/callback', '/auth/reset-password'];

const previewRouting = (): Plugin => ({
  name: 'tmc-preview-routing',
  configurePreviewServer(server) {
    server.middlewares.use((request, _response, next) => {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const isSpaRoute = spaPreviewRoutes.includes(url.pathname) || url.pathname.startsWith('/board/');

      if (isSpaRoute) {
        request.url = `/spa.html${url.search}`;
      }

      next();
    });
  },
});

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), previewRouting()],
  envDir,
  ssr: {
    // Keep one shared i18n context instance while rendering workspace packages.
    noExternal: ['@tmc/ui', '@tmc/core'],
  },
  // Load env files (.env, .env.local, ...) from the monorepo root so that a
  // single source of truth controls the environment. The root `.env.local`
  // points at the DEV Supabase project; production builds (Netlify) inject
  // VITE_* vars from the dashboard, which take precedence over any file.
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: isSsrBuild ? undefined : {
      output: {
        manualChunks: {
          // Split React into separate vendor chunk
          'vendor-react': ['react', 'react-dom'],
          // Split Konva canvas into separate chunk  
          'vendor-konva': ['konva', 'react-konva'],
          // Split Zustand state management
          'vendor-zustand': ['zustand'],
          // PDF and GIF stay lazy through their dynamic editor imports.
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'konva', 'react-konva', 'zustand'],
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
}));
