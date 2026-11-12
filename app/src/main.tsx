import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App';
import Privacy from './Privacy';
import { preload } from './lib/mathjax';

// Fetch the MathJax engine right after the shell paints.
if (location.pathname.replace(/\/+$/, '') !== '/privacy') preload();

// Two routes, no router library: the editor and the privacy page.
const page = location.pathname.replace(/\/+$/, '') === '/privacy' ? <Privacy /> : <App />;

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
