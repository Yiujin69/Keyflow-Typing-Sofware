import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the built bundle can be loaded from file:// inside Electron,
// and still work when served statically from disk. No network dependencies.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 4317,
    strictPort: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 8192,
    chunkSizeWarningLimit: 1200,
  },
});
