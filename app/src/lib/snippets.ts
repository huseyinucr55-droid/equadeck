// Saved equations for guests, kept in this browser (S12 without an account).
// Same shape as the `snippets` table in replica/schema.sql, so syncing to an
// account later is a straight copy.

import { fill, type Vars } from './i18n';

export type Snippet = { id: string; title: string | null; code: string; settings: { font_size: number }; updated_at: string };

const KEY = 'lx.snippets.v1';
export const LOCAL_LIMIT = 50;

export function listSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as Snippet[]) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s?.code === 'string' && typeof s?.id === 'string') : [];
  } catch {
    return [];
  }
}

function write(list: Snippet[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

export type SaveResult = { ok: true; list: Snippet[] } | { ok: false; reason: string };

export function saveSnippet(code: string, fontSize: number, title: string | null): SaveResult {
  const list = listSnippets();
  if (list.length >= LOCAL_LIMIT) return { ok: false, reason: `This browser holds up to ${LOCAL_LIMIT} equations. Delete one to make room.` };
  const s: Snippet = {
    id: crypto.randomUUID(),
    title: title?.trim() || null,
    code,
    settings: { font_size: fontSize },
    updated_at: new Date().toISOString(),
  };
  const next = [s, ...list];
  return write(next) ? { ok: true, list: next } : { ok: false, reason: 'This browser is not letting us save right now.' };
}

export function removeSnippet(id: string): Snippet[] {
  const next = listSnippets().filter((s) => s.id !== id);
  write(next);
  return next;
}

export function restoreSnippet(s: Snippet): Snippet[] {
  const list = listSnippets().filter((x) => x.id !== s.id);
  const next = [s, ...list].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  write(next);
  return next;
}

export function relativeTime(iso: string, now = Date.now(), t: (s: string, v?: Vars) => string = (s, v) => fill(s, v)): string {
  const s = Math.round((now - new Date(iso).getTime()) / 1000);
  if (s < 60) return t('just now');
  const m = Math.round(s / 60);
  if (m < 60) return t('{n} min ago', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t('{n} h ago', { n: h });
  const d = Math.round(h / 24);
  if (d === 1) return t('yesterday');
  if (d < 30) return t('{n} days ago', { n: d });
  return new Date(iso).toLocaleDateString();
}
