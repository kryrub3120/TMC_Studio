import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const envDir = path.resolve(__dirname, '../../');

export default defineConfig({
  plugins: [react()],
  envDir,
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into separate vendor chunk
          'vendor-react': ['react', 'react-dom'],
          // Split Konva canvas into separate chunk  
          'vendor-konva': ['konva', 'react-konva'],
          // Split Zustand state management
          'vendor-zustand': ['zustand'],
          // Split PDF generation (large library)
          'vendor-jspdf': ['jspdf'],
          // Split HTML-to-image library
          'vendor-html2canvas': ['html2canvas'],
          // Split GIF encoding (rarely used)
          'vendor-gif': ['gifenc'],
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
});
