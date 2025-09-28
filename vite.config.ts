import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // Note: Les clés API ne doivent JAMAIS être exposées côté client
    // Utilisez un backend proxy pour sécuriser les appels API

    return {
      plugins: [react()],

      define: {
        // Variables d'environnement pour le client (ATTENTION: Visibles côté client)
        // Ne jamais exposer de clés API ici en production
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
        'process.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString())
      },

      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },

      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: false,
        open: false
      },

      build: {
        target: 'esnext',
        minify: 'esbuild',
        sourcemap: true,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              genai: ['@google/genai']
            }
          }
        }
      },

      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai', 'uuid']
      }
    };
});
