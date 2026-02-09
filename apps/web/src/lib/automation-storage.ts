// apps/web/src/lib/automation-storage.ts
import type { AutomationV1 } from './automation-contract';

const LS_KEY = 'wa_automations_v1';

export interface AutomationStorage {
  list(): AutomationV1[];
  get(id: string): AutomationV1 | null;
  upsert(a: AutomationV1): void;
  remove(id: string): void;
  replaceAll(list: AutomationV1[]): void;
  exportJson(): string;
  importJson(json: string): { ok: true; count: number } | { ok: false; error: string };
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): AutomationV1[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<AutomationV1[]>(window.localStorage.getItem(LS_KEY));
  return Array.isArray(parsed) ? parsed : [];
}

function writeAll(list: AutomationV1[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export const automationStorage: AutomationStorage = {
  list() {
    return readAll().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  },

  get(id) {
    return readAll().find((x) => x.id === id) ?? null;
  },

  upsert(a) {
    const now = new Date().toISOString();
    const list = readAll();
    const idx = list.findIndex((x) => x.id === a.id);
    const item: AutomationV1 = {
      ...a,
      updatedAt: now,
      createdAt: a.createdAt ?? now,
    };
    if (idx === -1) list.unshift(item);
    else list[idx] = item;
    writeAll(list);
  },

  remove(id) {
    const list = readAll().filter((x) => x.id !== id);
    writeAll(list);
  },

  replaceAll(list) {
    writeAll(list);
  },

  exportJson() {
    return JSON.stringify(readAll(), null, 2);
  },

  importJson(json) {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) return { ok: false, error: 'JSON must be an array' };

      // basic validation
      for (const a of parsed) {
        if (!a || typeof a !== 'object') return { ok: false, error: 'Invalid item in array' };
        if (a.version !== 1) return { ok: false, error: 'Only version 1 supported' };
        if (!a.id || !a.name || !a.trigger) return { ok: false, error: 'Missing fields (id/name/trigger)' };
        if (!Array.isArray(a.conditions) || !Array.isArray(a.actions)) return { ok: false, error: 'conditions/actions must be arrays' };
      }

      writeAll(parsed as AutomationV1[]);
      return { ok: true, count: (parsed as AutomationV1[]).length };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? 'Invalid JSON' };
    }
  },
};