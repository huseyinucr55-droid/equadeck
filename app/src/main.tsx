import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import Privacy from './Privacy';
import Landing from './Landing';
import Terms from './Terms';
import { preload } from './lib/mathjax';
import { route } from './lib/paths';

// Four routes, no router library: the editor, the landing page, privacy and terms.
const path = route(); // base-aware, so /about also works under /<repo>/about on GitHub Pages

// The editor needs MathJax; fetch it right after the shell paints. The landing
// page warms it too, since "Open the editor" is its one call to action.
if (path !== '/privacy' && path !== '/terms') preload();

const page =
  path === '/privacy' ? <Privacy /> : path === '/terms' ? <Terms /> : path === '/about' ? <Landing /> : <App />;

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
