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
            { name: 'vendor-react', test: /\/react(?:-dom)?/ },
            { name: 'vendor-router', test: /react-router-dom/ },
            { name: 'vendor-axios', test: /axios/ },
            { name: 'vendor-bootstrap', test: /react-bootstrap|bootstrap/ },
            { name: 'vendor-icons', test: /lucide-react|react-icons/ },
            { name: 'vendor-swal', test: /sweetalert2/ },
            { name: 'vendor-pdf', test: /pdfjs-dist/ }
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