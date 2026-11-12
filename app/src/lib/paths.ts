// Links and routing that work both at the domain root (local dev, tests,
// a custom domain) and under a sub-path such as GitHub Pages'
// https://<user>.github.io/<repo>/. Vite sets BASE_URL from `base`
// in vite.config.ts; it always ends with "/".
const BASE = import.meta.env.BASE_URL;

/** An app path ("/", "/about", "/screenshot.png") as a URL under the base. */
export function to(path: string): string {
  return BASE + path.replace(/^\/+/, '');
}

/** The current route without the base and without a trailing slash ("" is the editor). */
export function route(): string {
  const p = location.pathname.startsWith(BASE) ? '/' + location.pathname.slice(BASE.length) : location.pathname;
  return p.replace(/\/+$/, '');
}
