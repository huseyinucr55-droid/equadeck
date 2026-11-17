import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import Privacy from './Privacy';
import Landing from './Landing';
import Terms from './Terms';
import { preload } from './lib/mathjax';
import { route } from './lib/paths';

// The document view (Word-style page) loads its editor code only when opened.
const DocApp = lazy(() => import('./doc/DocApp'));

// Five routes, no router library: the formula editor, the document, the
// landing page, privacy and terms.
const path = route(); // base-aware, so /about also works under /<repo>/about on GitHub Pages

// The editor needs MathJax; fetch it right after the shell paints. The landing
// page warms it too, since "Open the editor" is its one call to action.
if (path !== '/privacy' && path !== '/terms' && path !== '/doc') preload();

const page =
  path === '/privacy' ? (
    <Privacy />
  ) : path === '/terms' ? (
    <Terms />
  ) : path === '/about' ? (
    <Landing />
  ) : path === '/doc' ? (
    <Suspense fallback={null}>
      <DocApp />
    </Suspense>
  ) : (
    <App />
  );

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
