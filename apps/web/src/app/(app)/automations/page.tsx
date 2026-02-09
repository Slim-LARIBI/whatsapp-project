'use client';

import React, { useEffect, useMemo, useState } from 'react';
import * as storage from '@/lib/automation-storage';

type TriggerKey = 'cart_abandoned' | 'order_paid' | 'shipping_update';

type ConditionKey =
  | 'is_vip'
  | 'cart_gt_100'
  | 'consent_opted_in'
  | 'country_tn'
  | 'order_total_gt_200';

type ActionKey = 'send_template' | 'wait' | 'send_offer' | 'add_tag' | 'ai_reply';

type AutomationV1 = {
  id: string;
  name: string;
  status: 'draft' | 'active';
  trigger: TriggerKey;
  conditions: { key: ConditionKey; label: string }[];
  actions: (
    | { key: 'send_template'; templateName: string }
    | { key: 'wait'; minutes: number }
    | { key: 'send_offer'; offerName: string; priceTnd: number; discountPct?: number }
    | { key: 'add_tag'; tag: string }
    | { key: 'ai_reply'; tone: 'friendly' | 'formal'; instructions?: string }
  )[];
  updatedAt: string;
};

const TRIGGERS: { key: TriggerKey; label: string; hint: string }[] = [
  { key: 'cart_abandoned', label: 'Abandoned cart', hint: 'When a cart is inactive for X minutes' },
  { key: 'order_paid', label: 'Order paid', hint: 'When an order status becomes “paid”' },
  { key: 'shipping_update', label: 'Shipping update', hint: 'When tracking status changes' },
];

const CONDITIONS: { key: ConditionKey; label: string }[] = [
  { key: 'is_vip', label: 'Is VIP' },
  { key: 'cart_gt_100', label: 'Cart > 100' },
  { key: 'consent_opted_in', label: 'Consent = opted_in' },
  { key: 'country_tn', label: 'Country = TN' },
  { key: 'order_total_gt_200', label: 'Order total > 200' },
];

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: 'send_template', label: 'Send template' },
  { key: 'wait', label: 'Wait 1h' },
  { key: 'send_offer', label: 'Send offer' },
  { key: 'add_tag', label: 'Add tag' },
  { key: 'ai_reply', label: 'AI reply' },
];

function uid() {
  return `auto_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function safeCall<T>(fn: any, ...args: any[]): T | null {
  try {
    if (typeof fn !== 'function') return null;
    return fn(...args) as T;
  } catch {
    return null;
  }
}

/**
 * ✅ Storage adapter (ne casse pas ton projet)
 * On essaye plusieurs noms possibles dans automation-storage.ts
 */
function loadAll(): AutomationV1[] {
  const s: any = storage;

  // common names we might have in your file
  const candidates = [
    s.loadAutomations,
    s.getAutomations,
    s.listAutomations,
    s.readAutomations,
    s.load,
    s.getAll,
  ];

  for (const fn of candidates) {
    const res = safeCall<AutomationV1[]>(fn);
    if (Array.isArray(res)) return res;
  }

  // fallback localStorage key (au cas où ton storage n’a rien)
  if (typeof window !== 'undefined') {
    const raw =
      localStorage.getItem('wa_automations_v1') ||
      localStorage.getItem('automations') ||
      localStorage.getItem('wa_automations');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as AutomationV1[];
      } catch {}
    }
  }

  return [];
}

function persistAll(list: AutomationV1[]) {
  const s: any = storage;

  // Try explicit "saveAll"
  const saved =
    safeCall<boolean>(s.saveAutomations, list) ??
    safeCall<boolean>(s.setAutomations, list) ??
    safeCall<boolean>(s.writeAutomations, list) ??
    safeCall<boolean>(s.saveAll, list);

  if (saved !== null) return;

  // Fallback localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('wa_automations_v1', JSON.stringify(list));
  }
}

function upsertAutomation(a: AutomationV1) {
  const list = loadAll();
  const idx = list.findIndex((x) => x.id === a.id);
  const next = [...list];
  if (idx >= 0) next[idx] = a;
  else next.unshift(a);
  persistAll(next);

  // If your storage has saveAutomation / upsertAutomation, call it too (optional)
  const s: any = storage;
  safeCall(s.saveAutomation, a);
  safeCall(s.upsertAutomation, a);
}

function removeAutomation(id: string) {
  const list = loadAll().filter((x) => x.id !== id);
  persistAll(list);
  const s: any = storage;
  safeCall(s.deleteAutomation, id);
  safeCall(s.removeAutomation, id);
}

function buildDryRunJson(a: AutomationV1) {
  return {
    trigger: a.trigger,
    conditions: a.conditions.map((c) => ({ key: c.key, label: c.label })),
    actions: a.actions.map((act) => {
      if (act.key === 'send_template') return { key: act.key, templateName: act.templateName };
      if (act.key === 'wait') return { key: act.key, minutes: act.minutes };
      if (act.key === 'send_offer')
        return {
          key: act.key,
          offerName: act.offerName,
          priceTnd: act.priceTnd,
          discountPct: act.discountPct ?? undefined,
        };
      if (act.key === 'add_tag') return { key: act.key, tag: act.tag };
      if (act.key === 'ai_reply')
        return { key: act.key, tone: act.tone, instructions: act.instructions ?? undefined };
      return act;
    }),
  };
}

function humanTimeline(a: AutomationV1) {
  const rows: { n: number; title: string; subtitle?: string }[] = [];
  rows.push({ n: 1, title: 'When', subtitle: TRIGGERS.find((t) => t.key === a.trigger)?.label });

  if (a.conditions.length) {
    rows.push({
      n: rows.length + 1,
      title: 'If',
      subtitle: a.conditions.map((c) => c.label).join(' AND '),
    });
  } else {
    rows.push({ n: rows.length + 1, title: 'If', subtitle: 'No conditions (always run)' });
  }

  a.actions.forEach((act) => {
    if (act.key === 'send_template') {
      rows.push({ n: rows.length + 1, title: 'Then', subtitle: `Send template: ${act.templateName}` });
    } else if (act.key === 'wait') {
      rows.push({ n: rows.length + 1, title: 'Then', subtitle: `Wait ${act.minutes} minutes` });
    } else if (act.key === 'send_offer') {
      rows.push({
        n: rows.length + 1,
        title: 'Then',
        subtitle: `Send offer: ${act.offerName} — ${act.priceTnd} TND${act.discountPct ? ` (-${act.discountPct}%)` : ''}`,
      });
    } else if (act.key === 'add_tag') {
      rows.push({ n: rows.length + 1, title: 'Then', subtitle: `Add tag: ${act.tag}` });
    } else if (act.key === 'ai_reply') {
      rows.push({ n: rows.length + 1, title: 'Then', subtitle: `AI reply (${act.tone})` });
    }
  });

  return rows;
}

const seedAutomation = (): AutomationV1 => ({
  id: uid(),
  name: 'Abandoned Cart → Reminder + Offer',
  status: 'draft',
  trigger: 'cart_abandoned',
  conditions: [],
  actions: [
    { key: 'send_template', templateName: 'Abandoned cart - reminder' },
    { key: 'wait', minutes: 60 },
  ],
  updatedAt: new Date().toISOString(),
});

export default function AutomationsPage() {
  const [library, setLibrary] = useState<AutomationV1[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(() => {
    return library.find((a) => a.id === selectedId) ?? null;
  }, [library, selectedId]);

  const [draft, setDraft] = useState<AutomationV1 | null>(null);

  useEffect(() => {
    const list = loadAll();
    setLibrary(list);
    if (!selectedId && list[0]) setSelectedId(list[0].id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selected) setDraft(selected);
  }, [selected]);

  const refresh = () => {
    const list = loadAll();
    setLibrary(list);
    if (selectedId && !list.some((x) => x.id === selectedId)) setSelectedId(list[0]?.id ?? null);
  };

  const onNew = () => {
    const a = seedAutomation();
    upsertAutomation(a);
    refresh();
    setSelectedId(a.id);
  };

  const onSave = () => {
    if (!draft) return;
    const next: AutomationV1 = { ...draft, updatedAt: new Date().toISOString() };
    upsertAutomation(next);
    refresh();
  };

  const onDelete = () => {
    if (!draft) return;
    removeAutomation(draft.id);
    refresh();
  };

  const toggleCondition = (key: ConditionKey) => {
    if (!draft) return;
    const exists = draft.conditions.some((c) => c.key === key);
    const label = CONDITIONS.find((c) => c.key === key)?.label ?? key;
    const next = exists
      ? draft.conditions.filter((c) => c.key !== key)
      : [...draft.conditions, { key, label }];
    setDraft({ ...draft, conditions: next });
  };

  const addAction = (key: ActionKey) => {
    if (!draft) return;

    let act: any = null;
    if (key === 'send_template') act = { key, templateName: 'Order confirmation' };
    if (key === 'wait') act = { key, minutes: 60 };
    if (key === 'send_offer') act = { key, offerName: 'SPF 50 Sunscreen', priceTnd: 45, discountPct: 10 };
    if (key === 'add_tag') act = { key, tag: 'abandoned_cart_followup' };
    if (key === 'ai_reply') act = { key, tone: 'friendly', instructions: 'Help the customer and propose next step.' };
    setDraft({ ...draft, actions: [...draft.actions, act] });
  };

  const moveAction = (index: number, dir: -1 | 1) => {
    if (!draft) return;
    const next = [...draft.actions];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[index];
    next[index] = next[j];
    next[j] = tmp;
    setDraft({ ...draft, actions: next });
  };

  const removeActionAt = (index: number) => {
    if (!draft) return;
    const next = draft.actions.filter((_, i) => i !== index);
    setDraft({ ...draft, actions: next });
  };

  const exportAll = async () => {
    const data = JSON.stringify(loadAll(), null, 2);
    await navigator.clipboard.writeText(data);
    alert('Export copied to clipboard ✅');
  };

  const importAll = () => {
    const raw = prompt('Paste JSON here (array of automations):');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      // minimal normalize
      const normalized: AutomationV1[] = parsed.map((x: any) => ({
        id: String(x.id ?? uid()),
        name: String(x.name ?? 'Untitled automation'),
        status: x.status === 'active' ? 'active' : 'draft',
        trigger: (x.trigger ?? 'cart_abandoned') as TriggerKey,
        conditions: Array.isArray(x.conditions) ? x.conditions : [],
        actions: Array.isArray(x.actions) ? x.actions : [],
        updatedAt: String(x.updatedAt ?? new Date().toISOString()),
      }));
      persistAll(normalized);
      refresh();
      alert('Import OK ✅');
    } catch (e: any) {
      alert(`Import failed: ${e?.message ?? 'Invalid JSON'}`);
    }
  };

  const dry = useMemo(() => (draft ? buildDryRunJson(draft) : null), [draft]);
  const timeline = useMemo(() => (draft ? humanTimeline(draft) : []), [draft]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold">Automation Builder</h1>
            <p className="text-sm text-gray-500">
              Create simple automations for WhatsApp & e-commerce (mock).
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onNew}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              + New
            </button>
            <button
              onClick={exportAll}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Export
            </button>
            <button
              onClick={importAll}
              className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            >
              Import
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 mt-6">
          {/* Library */}
          <div className="col-span-4">
            <div className="border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Library</h2>
                <span className="text-xs text-gray-400">{library.length}</span>
              </div>

              <div className="mt-3 space-y-2">
                {library.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No automations yet. Click <b>New</b>.
                  </div>
                ) : (
                  library.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedId(a.id)}
                      className={[
                        'w-full text-left rounded-lg border px-3 py-2 hover:bg-gray-50',
                        selectedId === a.id ? 'border-green-300 bg-green-50' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{a.name}</div>
                          <div className="text-xs text-gray-500">
                            Trigger: {TRIGGERS.find((t) => t.key === a.trigger)?.label ?? a.trigger}
                          </div>
                        </div>
                        <span
                          className={[
                            'text-[11px] px-2 py-0.5 rounded-full border',
                            a.status === 'active'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-gray-100 text-gray-700 border-gray-200',
                          ].join(' ')}
                        >
                          {a.status}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Builder */}
          <div className="col-span-8">
            {!draft ? (
              <div className="border rounded-xl p-6 text-sm text-gray-500">
                Select an automation from the library or click <b>New</b>.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Name + Status */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                      className="w-full text-sm font-medium px-3 py-2 rounded-lg border"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setDraft({ ...draft, status: draft.status === 'active' ? 'draft' : 'active' })
                        }
                        className={[
                          'px-3 py-2 rounded-lg border text-sm',
                          draft.status === 'active'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-white hover:bg-gray-50',
                        ].join(' ')}
                      >
                        {draft.status === 'active' ? 'Active' : 'Draft'}
                      </button>

                      <button
                        onClick={onSave}
                        className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700"
                      >
                        Save
                      </button>

                      <button
                        onClick={onDelete}
                        className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trigger */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Trigger</h3>
                    <span className="text-xs text-gray-400">
                      {TRIGGERS.find((t) => t.key === draft.trigger)?.hint}
                    </span>
                  </div>

                  <select
                    value={draft.trigger}
                    onChange={(e) => setDraft({ ...draft, trigger: e.target.value as TriggerKey })}
                    className="mt-3 w-full px-3 py-2 rounded-lg border text-sm"
                  >
                    {TRIGGERS.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditions */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Conditions</h3>
                    <span className="text-xs text-gray-400">All conditions must be true</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => {
                      const active = draft.conditions.some((x) => x.key === c.key);
                      return (
                        <button
                          key={c.key}
                          onClick={() => toggleCondition(c.key)}
                          className={[
                            'px-3 py-1.5 rounded-full border text-xs',
                            active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50',
                          ].join(' ')}
                        >
                          {active ? '✓ ' : '+ '}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Actions</h3>
                    <span className="text-xs text-gray-400">Executed in order</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {ACTIONS.map((a) => (
                      <button
                        key={a.key}
                        onClick={() => addAction(a.key)}
                        className="px-3 py-1.5 rounded-full border text-xs hover:bg-gray-50"
                      >
                        + {a.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {draft.actions.map((act, idx) => (
                      <div
                        key={`${act.key}-${idx}`}
                        className="flex items-center justify-between gap-3 border rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{act.key}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {act.key === 'send_template' && `Template: ${(act as any).templateName}`}
                            {act.key === 'wait' && `Minutes: ${(act as any).minutes}`}
                            {act.key === 'send_offer' &&
                              `Offer: ${(act as any).offerName} — ${(act as any).priceTnd} TND`}
                            {act.key === 'add_tag' && `Tag: ${(act as any).tag}`}
                            {act.key === 'ai_reply' && `Tone: ${(act as any).tone}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => moveAction(idx, -1)}
                            className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => moveAction(idx, 1)}
                            className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                            title="Move down"
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => removeActionAt(idx)}
                            className="px-2 py-1 rounded border text-xs hover:bg-gray-50"
                            title="Remove"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Timeline (human-readable)</h3>
                    <span className="text-xs text-gray-400">What will happen</span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {timeline.map((r) => (
                      <div key={r.n} className="flex items-start gap-3 border rounded-lg px-3 py-2">
                        <div className="w-7 h-7 rounded-full border flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                          {r.n}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{r.title}</div>
                          <div className="text-xs text-gray-600">{r.subtitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-gray-500">
                    💡 This timeline matches the JSON contract below. Later, the backend will execute it.
                  </div>
                </div>

                {/* Dry run */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Dry run (simulation)</h3>
                    <button
                      onClick={async () => {
                        if (!dry) return;
                        await navigator.clipboard.writeText(JSON.stringify(dry, null, 2));
                        alert('Dry run JSON copied ✅');
                      }}
                      className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
                    >
                      Copy JSON
                    </button>
                  </div>

                  <pre className="mt-3 text-xs bg-gray-50 border rounded-lg p-3 overflow-auto">
{JSON.stringify(dry, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-400">
          Tip: si tu veux lancer sur un autre port → utilise juste <b>pnpm --filter @whatsapp-platform/web dev</b> (ton script gère déjà le port).
        </div>
      </div>
    </div>
  );
}