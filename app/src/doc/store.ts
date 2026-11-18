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
  /** Formulas on their own line are numbered (1), (2) … */
  numbered?: boolean;
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

// --- Backup: all documents in one file -----------------------------------------
// Everything lives in this browser only; clearing site data would lose it.
// A backup file is plain JSON: { app: 'equadeck', version: 1, savedAt, docs }.

export function backupFile(docs: Doc[]): Blob {
  const data = { app: 'equadeck', version: 1, savedAt: new Date().toISOString(), docs };
  return new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
}

const isDoc = (d: unknown): d is Doc =>
  !!d && typeof d === 'object' && typeof (d as Doc).id === 'string' && typeof (d as Doc).title === 'string' && typeof (d as Doc).updatedAt === 'number';

/** Documents in a backup file, or null when it isn't one. */
export function readBackup(text: string): Doc[] | null {
  try {
    const data = JSON.parse(text) as { app?: string; docs?: unknown[] };
    if (data.app !== 'equadeck' || !Array.isArray(data.docs)) return null;
    return data.docs.filter(isDoc).map((d) => ({
      ...d,
      paper: d.paper ?? 'blank',
      margins: d.margins ?? 'normal',
      orientation: d.orientation ?? 'portrait',
    }));
  } catch {
    return null;
  }
}

/** Merge a backup into the list: new documents are added, for the same document the newer one wins. */
export function mergeDocs(current: Doc[], incoming: Doc[]): { docs: Doc[]; added: number; updated: number } {
  const byId = new Map(current.map((d) => [d.id, d]));
  let added = 0;
  let updated = 0;
  for (const d of incoming) {
    const mine = byId.get(d.id);
    if (!mine) {
      byId.set(d.id, d);
      added++;
    } else if (d.updatedAt > mine.updatedAt) {
      byId.set(d.id, d);
      updated++;
    }
  }
  return { docs: [...byId.values()], added, updated };
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
