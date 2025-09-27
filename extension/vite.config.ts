import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

export default defineConfig({
  plugins: [crx({ manifest })],

  // Node.js compatibility for CI
  define: {
    global: 'globalThis',
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    __VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/chunk-[hash].js',
      },
    },
  },

  // Development server configuration
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5174,
    },
  },

  // TypeScript path resolution
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '../shared/src',
    },
  },


  // Optimize dependencies
  optimizeDeps: {
    include: ['webextension-polyfill'],
  },
});