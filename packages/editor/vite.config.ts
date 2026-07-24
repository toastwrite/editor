import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ToastwriteEditor',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      external: [/^@toastwrite\/parser/, 'dompurify', /^prosemirror/],
      output: {
        assetFileNames: 'toastwrite-editor[extname]',
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: false,
  },
});
