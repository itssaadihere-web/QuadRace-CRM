import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/solomon.ts',
      name: 'SolomonWidget',
      fileName: () => 'solomon.js',
      formats: ['iife']
    },
    cssCodeSplit: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    outDir: 'dist'
  }
});
