import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'konva', 'react-konva', 'zustand'],
  },
});
