import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 4000,
    open: true,
    watch: {
      usePolling: true
    }
  },
  build: {
    outDir: 'public',
    emptyOutDir: true
  }
});