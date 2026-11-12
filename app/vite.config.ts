import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves the site under /<repo>/; the deploy workflow sets
// PAGES_BASE to that. Locally, in tests and on a custom domain it stays "/".
const base = process.env.PAGES_BASE || '/';

// GitHub Pages has no rewrites: opening /about directly would 404. Its 404.html
// is served for unknown paths, so make it the app too; main.tsx picks the page.
const spaFallback = (): Plugin => {
  let outDir = 'dist';
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html');
      copyFileSync(index, resolve(outDir, '404.html'));
      // Real files for the known pages, so they answer 200 (not 404) for
      // search engines and link previews; main.tsx picks the page by path.
      for (const page of ['about', 'privacy']) {
        mkdirSync(resolve(outDir, page), { recursive: true });
        copyFileSync(index, resolve(outDir, page, 'index.html'));
      }
    },
  };
};

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), spaFallback()],
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
