import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5178,
    open: true,
  },
  preview: {
    port: 5178,
  },
  build: {
    rollupOptions: {
      output: {
        // Con Rolldown, 'advancedChunks' permite separar vendor de manera más precisa
        advancedChunks: {
          groups: [
            { name: 'vendor', test: /\/react(?:-dom)?/ }
          ]
        }
      }
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});