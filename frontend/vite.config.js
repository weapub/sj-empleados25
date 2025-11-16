import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    open: true,
    strictPort: true,
  },
  preview: {
    port: 5178,
  },
  build: {
    // Deshabilitado 'advancedChunks' de Rolldown por incompatibilidad en build
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});