// Documents live in this browser (localStorage), like the saved equations.
import type { JSONContent } from '@tiptap/react';

export type Paper = 'blank' | 'squared' | 'lined';
export type Margins = 'normal' | 'narrow' | 'wide';
export type Orientation = 'portrait' | 'landscape';

export type Doc = {
  id: string;
  title: string;
  updatedAt: number;
  content: JSONContent | null;
  paper: Paper;
  margins: Margins;
  orientation: Orientation;
};

const KEY = 'lx.docs.v1';
const CURRENT = 'lx.docs.current';

export const MARGIN_MM: Record<Margins, number> = { normal: 25, narrow: 12.7, wide: 35 };

export function newDoc(title: string): Doc {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
  return { id, title, updatedAt: Date.now(), content: null, paper: 'blank', margins: 'normal', orientation: 'portrait' };
}

export function loadDocs(): Doc[] {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as Doc[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveDocs(docs: Doc[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(docs));
  } catch {
    /* storage full or blocked: the document just isn't kept */
  }
}

export function loadCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT);
  } catch {
    return null;
  }
}

export function saveCurrentId(id: string) {
  try {
    localStorage.setItem(CURRENT, id);
  } catch {
    /* ignore */
  }
}
