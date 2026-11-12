import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // MathJax's js/components/version.js falls back to Node's require() unless
  // this global is defined. Keep in sync with the installed mathjax-full.
  define: { PACKAGE_VERSION: JSON.stringify('3.2.1') },
  // MathJax ships CommonJS under js/; pre-bundle the deep imports we use.
  optimizeDeps: {
    include: [
      'mathjax-full/js/mathjax.js',
      'mathjax-full/js/input/tex.js',
      'mathjax-full/js/output/svg.js',
      'mathjax-full/js/adaptors/liteAdaptor.js',
      'mathjax-full/js/handlers/html.js',
      'mathjax-full/js/ui/safe/SafeHandler.js',
    ],
  },
});
