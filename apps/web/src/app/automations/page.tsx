'use client';

import { useMemo, useState } from 'react';
import {
  Zap,
  ShoppingCart,
  Package,
  CreditCard,
  Clock,
  Filter,
  Split,
  MessageSquare,
  Tag,
  Percent,
  Bot,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  Save,
  Play,
  CheckCircle2,
} from 'lucide-react';

type TriggerType = 'abandoned_cart' | 'order_paid' | 'shipping_update' | 'product_view' | 'tag_added';
type StepType = 'wait' | 'condition' | 'send_template' | 'send_offer' | 'add_tag' | 'ai_reply';

type ConditionField = 'cart_value' | 'order_value' | 'customer_segment' | 'consent' | 'last_purchase_days';
type Operator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'in';

type Condition = {
  field: ConditionField;
  op: Operator;
  value: string;
};

type Step =
  | { id: string; type: 'wait'; minutes: number }
  | { id: string; type: 'condition'; label: string; rules: Condition[] }
  | { id: string; type: 'send_template'; templateId: string; variables: Record<string, string> }
  | { id: string; type: 'send_offer'; productName: string; priceTnd: number; discountPct?: number }
  | { id: string; type: 'add_tag'; tag: string }
  | { id: string; type: 'ai_reply'; tone: 'friendly' | 'pro' | 'short'; goal: string };

type Automation = {
  id: string;
  name: string;
  status: 'draft' | 'active';
  trigger: { type: TriggerType };
  steps: Step[];
};

const uid = () => Math.random().toString(36).slice(2, 10);

const ICONS: Record<TriggerType, any> = {
  abandoned_cart: ShoppingCart,
  order_paid: CreditCard,
  shipping_update: Package,
  product_view: Eye,
  tag_added: Tag,
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  abandoned_cart: 'Abandoned cart',
  order_paid: 'Order paid',
  shipping_update: 'Shipping update',
  product_view: 'Product viewed',
  tag_added: 'Tag added',
};

const TEMPLATE_LIBRARY = [
  {
    id: 'tpl_abandon_1',
    name: 'Abandoned cart - reminder',
    body:
      '🛒 Vous avez laissé des articles dans votre panier.\nVoulez-vous que je vous envoie le lien pour finaliser la commande ?',
  },
  {
    id: 'tpl_postpurchase_1',
    name: 'Post-purchase - cross-sell',
    body:
      'Merci pour votre achat 🙏\n✨ Reco: {{product_name}} ({{price}} TND) — Souhaitez-vous que je vous envoie le lien ?',
  },
  {
    id: 'tpl_shipping_1',
    name: 'Shipping update',
    body:
      '🚚 Expédition: votre commande {{order_id}} est en route.\nTransporteur: {{carrier}}\nSuivi: {{tracking_url}}',
  },
  {
    id: 'tpl_promo_1',
    name: 'Promo -10%',
    body:
      '🎁 Offre spéciale: -10% avec le code {{code}} (valable jusqu’au {{date}}).\nJe vous propose une sélection ?',
  },
];

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: 'a1',
    name: 'Abandoned Cart → Reminder + Offer',
    status: 'draft',
    trigger: { type: 'abandoned_cart' },
    steps: [
      { id: uid(), type: 'wait', minutes: 30 },
      {
        id: uid(),
        type: 'condition',
        label: 'Cart value ≥ 120 TND & consent opted_in',
        rules: [
          { field: 'cart_value', op: 'gte', value: '120' },
          { field: 'consent', op: 'eq', value: 'opted_in' },
        ],
      },
      { id: uid(), type: 'send_template', templateId: 'tpl_abandon_1', variables: {} },
      { id: uid(), type: 'wait', minutes: 240 },
      { id: uid(), type: 'send_offer', productName: 'SPF 50 Sunscreen', priceTnd: 45, discountPct: 10 },
      { id: uid(), type: 'add_tag', tag: 'abandoned_cart_followup' },
    ],
  },
  {
    id: 'a2',
    name: 'Order Paid → Cross-sell (Skincare)',
    status: 'active',
    trigger: { type: 'order_paid' },
    steps: [
      { id: uid(), type: 'wait', minutes: 10 },
      {
        id: uid(),
        type: 'send_template',
        templateId: 'tpl_postpurchase_1',
        variables: { product_name: 'Hydrating Serum', price: '39' },
      },
      { id: uid(), type: 'add_tag', tag: 'postpurchase_crosssell' },
    ],
  },
  {
    id: 'a3',
    name: 'Shipping Update → Notify customer',
    status: 'active',
    trigger: { type: 'shipping_update' },
    steps: [{ id: uid(), type: 'send_template', templateId: 'tpl_shipping_1', variables: {} }],
  },
];

function badge(status: Automation['status']) {
  return status === 'active'
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-gray-50 text-gray-700 border-gray-200';
}

function fieldLabel(f: ConditionField) {
  return (
    {
      cart_value: 'Cart value (TND)',
      order_value: 'Order value (TND)',
      customer_segment: 'Customer segment',
      consent: 'Consent',
      last_purchase_days: 'Last purchase (days)',
    }[f] || f
  );
}

function opLabel(op: Operator) {
  return (
    {
      gt: '>',
      gte: '≥',
      lt: '<',
      lte: '≤',
      eq: '=',
      neq: '≠',
      in: 'in',
    }[op] || op
  );
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>(MOCK_AUTOMATIONS);
  const [selectedId, setSelectedId] = useState<string>(automations[0]?.id ?? '');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const selected = useMemo(
    () => automations.find((a) => a.id === selectedId) ?? automations[0],
    [automations, selectedId]
  );

  const selectedStep = useMemo(() => {
    if (!selected || !selectedStepId) return null;
    return selected.steps.find((s) => s.id === selectedStepId) ?? null;
  }, [selected, selectedStepId]);

  const TriggerIcon = selected ? ICONS[selected.trigger.type] : Zap;

  const updateSelected = (patch: Partial<Automation>) => {
    if (!selected) return;
    setAutomations((prev) => prev.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)));
  };

  const updateStep = (stepId: string, updater: (s: Step) => Step) => {
    if (!selected) return;
    const nextSteps = selected.steps.map((s) => (s.id === stepId ? updater(s) : s));
    updateSelected({ steps: nextSteps });
  };

  const addStep = (type: StepType) => {
    if (!selected) return;
    const base: Step =
      type === 'wait'
        ? { id: uid(), type: 'wait', minutes: 15 }
        : type === 'condition'
        ? {
            id: uid(),
            type: 'condition',
            label: 'New condition',
            rules: [{ field: 'consent', op: 'eq', value: 'opted_in' }],
          }
        : type === 'send_template'
        ? { id: uid(), type: 'send_template', templateId: TEMPLATE_LIBRARY[0].id, variables: {} }
        : type === 'send_offer'
        ? { id: uid(), type: 'send_offer', productName: 'Gentle Cleanser', priceTnd: 29, discountPct: 0 }
        : type === 'add_tag'
        ? { id: uid(), type: 'add_tag', tag: 'new_tag' }
        : { id: uid(), type: 'ai_reply', tone: 'friendly', goal: 'Ask for order id' };

    const next = [...selected.steps, base];
    updateSelected({ steps: next });
    setSelectedStepId(base.id);
  };

  const removeStep = (stepId: string) => {
    if (!selected) return;
    const next = selected.steps.filter((s) => s.id !== stepId);
    updateSelected({ steps: next });
    if (selectedStepId === stepId) setSelectedStepId(null);
  };

  const moveStep = (stepId: string, dir: -1 | 1) => {
    if (!selected) return;
    const idx = selected.steps.findIndex((s) => s.id === stepId);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= selected.steps.length) return;
    const next = [...selected.steps];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    updateSelected({ steps: next });
  };

  const addAutomation = () => {
    const a: Automation = {
      id: uid(),
      name: 'New automation',
      status: 'draft',
      trigger: { type: 'abandoned_cart' },
      steps: [{ id: uid(), type: 'wait', minutes: 30 }],
    };
    setAutomations((p) => [a, ...p]);
    setSelectedId(a.id);
    setSelectedStepId(null);
  };

  const toggleActive = () => {
    if (!selected) return;
    updateSelected({ status: selected.status === 'active' ? 'draft' : 'active' });
  };

  const preview = useMemo(() => buildPreview(selected), [selected]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-gray-700" />
          <div className="text-sm font-semibold">Automation Builder</div>
          <div className="text-xs text-gray-500">Mock (front only)</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={addAutomation}
            className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New automation
          </button>
          <button
            onClick={toggleActive}
            className={`h-9 px-3 rounded-xl border text-sm flex items-center gap-2 ${badge(
              selected?.status ?? 'draft'
            )}`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {selected?.status === 'active' ? 'Active' : 'Draft'}
          </button>

          <button
            onClick={() => alert('Mock: saved ✅')}
            className="h-9 px-3 rounded-xl bg-whatsapp-green text-white hover:bg-whatsapp-dark text-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={() => alert('Mock: run simulation ▶️')}
            className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Test run
          </button>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* LEFT: automations list */}
        <aside className="w-[340px] bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="text-xs text-gray-500 uppercase">Automations</div>
            <div className="text-sm font-semibold mt-1">Library</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {automations.map((a) => {
              const Icon = ICONS[a.trigger.type];
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedId(a.id);
                    setSelectedStepId(null);
                  }}
                  className={[
                    'w-full text-left border rounded-2xl p-3 transition-colors',
                    a.id === selectedId ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:bg-gray-50',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{a.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Trigger: {TRIGGER_LABELS[a.trigger.type]}
                        </div>
                      </div>
                    </div>

                    <span className={`text-[11px] px-2 py-1 rounded-full border ${badge(a.status)}`}>
                      {a.status}
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-gray-500">
                    {a.steps.length} step{a.steps.length > 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER: canvas */}
        <main className="flex-1 min-w-0 flex flex-col">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">No automation selected</div>
          ) : (
            <>
              {/* top canvas header */}
              <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TriggerIcon className="w-4 h-4 text-gray-700" />
                    <span className="text-xs text-gray-500">Trigger</span>
                    <span className="text-sm font-semibold">{TRIGGER_LABELS[selected.trigger.type]}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Build a flow: Trigger → Wait/Condition → Actions (Template/Offer/AI)
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={selected.trigger.type}
                    onChange={(e) =>
                      updateSelected({ trigger: { type: e.target.value as TriggerType } })
                    }
                    className="h-9 px-3 rounded-xl border border-gray-200 text-sm"
                  >
                    {Object.keys(TRIGGER_LABELS).map((k) => (
                      <option key={k} value={k}>
                        {TRIGGER_LABELS[k as TriggerType]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* canvas content */}
              <div className="flex-1 min-h-0 overflow-y-auto p-6">
                {/* palette */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <PaletteBtn icon={Clock} label="Wait" onClick={() => addStep('wait')} />
                  <PaletteBtn icon={Split} label="Condition" onClick={() => addStep('condition')} />
                  <PaletteBtn icon={MessageSquare} label="Send template" onClick={() => addStep('send_template')} />
                  <PaletteBtn icon={Percent} label="Send offer" onClick={() => addStep('send_offer')} />
                  <PaletteBtn icon={Tag} label="Add tag" onClick={() => addStep('add_tag')} />
                  <PaletteBtn icon={Bot} label="AI reply" onClick={() => addStep('ai_reply')} />
                </div>

                {/* flow */}
                <div className="max-w-3xl mx-auto space-y-3">
                  {/* trigger node */}
                  <NodeShell selected={false}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">Trigger</div>
                        <div className="text-xs text-gray-500">{TRIGGER_LABELS[selected.trigger.type]}</div>
                      </div>
                    </div>
                  </NodeShell>

                  <Connector />

                  {selected.steps.map((s, i) => (
                    <div key={s.id}>
                      <NodeShell selected={selectedStepId === s.id} onClick={() => setSelectedStepId(s.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center">
                              <StepIcon step={s} />
                            </div>

                            <div className="min-w-0">
                              <div className="text-sm font-semibold">{stepTitle(s)}</div>
                              <div className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">
                                {stepSubtitle(s)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(s.id, -1);
                              }}
                              className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                              title="Move up"
                            >
                              <ArrowUp className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                moveStep(s.id, 1);
                              }}
                              className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                              title="Move down"
                            >
                              <ArrowDown className="w-4 h-4 text-gray-700" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStep(s.id);
                              }}
                              className="w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-gray-700" />
                            </button>
                          </div>
                        </div>
                      </NodeShell>

                      {i !== selected.steps.length - 1 && <Connector />}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>

        {/* RIGHT: properties panel */}
        <aside className="w-[380px] bg-white border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="text-xs text-gray-500 uppercase">Properties</div>
            <div className="text-sm font-semibold mt-1">
              {selectedStep ? 'Edit step' : 'Preview'}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            {!selected ? null : selectedStep ? (
              <StepEditor
                step={selectedStep}
                onChange={(next) => updateStep(selectedStep.id, () => next)}
              />
            ) : (
              <PreviewPanel preview={preview} />
            )}
          </div>

          <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
            Next after front: connect real events (Woo/Presta webhooks) → queue → WhatsApp API send ✅
          </div>
        </aside>
      </div>
    </div>
  );
}/* =========================
   UI SMALL COMPONENTS
========================= */
function PaletteBtn({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-10 px-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-sm flex items-center gap-2"
    >
      <Icon className="w-4 h-4 text-gray-700" />
      {label}
    </button>
  );
}

function NodeShell({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white border rounded-2xl p-4 shadow-sm cursor-pointer transition-colors',
        selected ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200 hover:bg-gray-50',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-[2px] h-6 bg-gray-200 rounded-full" />
    </div>
  );
}

function StepIcon({ step }: { step: Step }) {
  switch (step.type) {
    case 'wait':
      return <Clock className="w-5 h-5 text-gray-700" />;
    case 'condition':
      return <Filter className="w-5 h-5 text-gray-700" />;
    case 'send_template':
      return <MessageSquare className="w-5 h-5 text-gray-700" />;
    case 'send_offer':
      return <Percent className="w-5 h-5 text-gray-700" />;
    case 'add_tag':
      return <Tag className="w-5 h-5 text-gray-700" />;
    case 'ai_reply':
      return <Bot className="w-5 h-5 text-gray-700" />;
    default:
      return <Zap className="w-5 h-5 text-gray-700" />;
  }
}

function stepTitle(s: Step) {
  switch (s.type) {
    case 'wait':
      return 'Wait';
    case 'condition':
      return 'Condition';
    case 'send_template':
      return 'Send template';
    case 'send_offer':
      return 'Send offer';
    case 'add_tag':
      return 'Add tag';
    case 'ai_reply':
      return 'AI reply';
  }
}

function stepSubtitle(s: Step) {
  switch (s.type) {
    case 'wait':
      return `Delay: ${s.minutes} minutes`;
    case 'condition':
      return `${s.label}\n${s.rules.map((r) => `• ${fieldLabel(r.field)} ${opLabel(r.op)} ${r.value}`).join('\n')}`;
    case 'send_template': {
      const tpl = TEMPLATE_LIBRARY.find((t) => t.id === s.templateId);
      return `Template: ${tpl?.name ?? s.templateId}`;
    }
    case 'send_offer':
      return `${s.productName} — ${s.priceTnd} TND${s.discountPct ? ` (-${s.discountPct}%)` : ''}`;
    case 'add_tag':
      return `Tag: ${s.tag}`;
    case 'ai_reply':
      return `Tone: ${s.tone}\nGoal: ${s.goal}`;
  }
}

/* =========================
   EDITOR (RIGHT PANEL)
========================= */
function StepEditor({ step, onChange }: { step: Step; onChange: (s: Step) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="text-xs text-gray-500 uppercase">Step</div>
        <div className="text-sm font-semibold mt-1">{stepTitle(step)}</div>
      </div>

      {step.type === 'wait' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Minutes</label>
          <input
            type="number"
            value={step.minutes}
            min={1}
            onChange={(e) => onChange({ ...step, minutes: Number(e.target.value || 0) })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
          />
          <p className="text-xs text-gray-500">Ex: 30 min (abandoned cart), 10 min (post-purchase)</p>
        </div>
      )}

      {step.type === 'condition' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Label</label>
            <input
              value={step.label}
              onChange={(e) => onChange({ ...step, label: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Rules</div>

            <div className="space-y-2">
              {step.rules.map((r, idx) => (
                <div key={idx} className="border border-gray-200 rounded-2xl p-3">
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={r.field}
                      onChange={(e) => {
                        const next = [...step.rules];
                        next[idx] = { ...r, field: e.target.value as ConditionField };
                        onChange({ ...step, rules: next });
                      }}
                      className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
                    >
                      <option value="cart_value">cart_value</option>
                      <option value="order_value">order_value</option>
                      <option value="customer_segment">customer_segment</option>
                      <option value="consent">consent</option>
                      <option value="last_purchase_days">last_purchase_days</option>
                    </select>

                    <select
                      value={r.op}
                      onChange={(e) => {
                        const next = [...step.rules];
                        next[idx] = { ...r, op: e.target.value as Operator };
                        onChange({ ...step, rules: next });
                      }}
                      className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
                    >
                      <option value="gt">gt</option>
                      <option value="gte">gte</option>
                      <option value="lt">lt</option>
                      <option value="lte">lte</option>
                      <option value="eq">eq</option>
                      <option value="neq">neq</option>
                      <option value="in">in</option>
                    </select>

                    <input
                      value={r.value}
                      onChange={(e) => {
                        const next = [...step.rules];
                        next[idx] = { ...r, value: e.target.value };
                        onChange({ ...step, rules: next });
                      }}
                      className="h-10 px-3 rounded-xl border border-gray-200 text-sm"
                      placeholder="value"
                    />
                  </div>

                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        const next = step.rules.filter((_, i) => i !== idx);
                        onChange({ ...step, rules: next.length ? next : step.rules });
                      }}
                      className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onChange({ ...step, rules: [...step.rules, { field: 'consent', op: 'eq', value: 'opted_in' }] })}
              className="h-10 px-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add rule
            </button>
          </div>
        </div>
      )}

      {step.type === 'send_template' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <select
              value={step.templateId}
              onChange={(e) => onChange({ ...step, templateId: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
            >
              {TEMPLATE_LIBRARY.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 uppercase">Preview</div>
            <div className="text-sm mt-2 whitespace-pre-wrap">
              {renderTemplate(step.templateId, step.variables)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Variables (optional)</div>
            <VarRow
              k="order_id"
              v={step.variables.order_id ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, order_id: val } })}
            />
            <VarRow
              k="carrier"
              v={step.variables.carrier ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, carrier: val } })}
            />
            <VarRow
              k="tracking_url"
              v={step.variables.tracking_url ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, tracking_url: val } })}
            />
            <VarRow
              k="product_name"
              v={step.variables.product_name ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, product_name: val } })}
            />
            <VarRow
              k="price"
              v={step.variables.price ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, price: val } })}
            />
            <VarRow
              k="code"
              v={step.variables.code ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, code: val } })}
            />
            <VarRow
              k="date"
              v={step.variables.date ?? ''}
              onChange={(val) => onChange({ ...step, variables: { ...step.variables, date: val } })}
            />
          </div>
        </div>
      )}

      {step.type === 'send_offer' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Product</label>
          <input
            value={step.productName}
            onChange={(e) => onChange({ ...step, productName: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
          />

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Price (TND)</label>
              <input
                type="number"
                value={step.priceTnd}
                onChange={(e) => onChange({ ...step, priceTnd: Number(e.target.value || 0) })}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Discount %</label>
              <input
                type="number"
                value={step.discountPct ?? 0}
                onChange={(e) => onChange({ ...step, discountPct: Number(e.target.value || 0) })}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
              />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-3">
            <div className="text-xs text-gray-500 uppercase">WhatsApp message</div>
            <div className="text-sm mt-2 whitespace-pre-wrap">
              🎁 Offre recommandée: {step.productName} — {step.priceTnd} TND
              {step.discountPct ? ` (-${step.discountPct}%)` : ''}
              {'\n'}Souhaitez-vous que je vous envoie le lien ?
            </div>
          </div>
        </div>
      )}

      {step.type === 'add_tag' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Tag</label>
          <input
            value={step.tag}
            onChange={(e) => onChange({ ...step, tag: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
          />
          <p className="text-xs text-gray-500">Used for segmentation & journeys (VIP, intent, status…)</p>
        </div>
      )}

      {step.type === 'ai_reply' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tone</label>
            <select
              value={step.tone}
              onChange={(e) => onChange({ ...step, tone: e.target.value as any })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
            >
              <option value="friendly">friendly</option>
              <option value="pro">pro</option>
              <option value="short">short</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Goal</label>
            <input
              value={step.goal}
              onChange={(e) => onChange({ ...step, goal: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm"
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="text-xs text-gray-500 uppercase">Mock output</div>
            <div className="text-sm mt-2 whitespace-pre-wrap">
              {step.tone === 'pro'
                ? `Bonjour,\n${step.goal}. Pouvez-vous me donner plus de détails s’il vous plaît ?`
                : step.tone === 'short'
                ? `${step.goal} ✅`
                : `Salut 👋 ${step.goal}. Je m’en occupe 🙂`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VarRow({ k, v, onChange }: { k: string; v: string; onChange: (val: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 items-center">
      <div className="text-xs text-gray-500">{`{{${k}}}`}</div>
      <input
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="col-span-2 h-9 px-3 rounded-xl border border-gray-200 text-sm"
        placeholder="value"
      />
    </div>
  );
}

/* =========================
   PREVIEW (RIGHT PANEL)
========================= */
function PreviewPanel({ preview }: { preview: { title: string; lines: string[] } }) {
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
        <div className="text-xs text-gray-500 uppercase">Simulation</div>
        <div className="text-sm font-semibold mt-1">{preview.title}</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <div className="text-xs text-gray-500 uppercase">What will happen</div>
        <div className="mt-3 space-y-2">
          {preview.lines.map((l, i) => (
            <div key={i} className="text-sm flex items-start gap-2">
              <div className="w-6 h-6 rounded-xl bg-gray-100 flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                {i + 1}
              </div>
              <div className="whitespace-pre-wrap">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Next UX: add “branch yes/no” rendering, schedule windows (quiet hours), and A/B test templates.
      </div>
    </div>
  );
}

/* =========================
   HELPERS
========================= */
function renderTemplate(templateId: string, vars: Record<string, string>) {
  const tpl = TEMPLATE_LIBRARY.find((t) => t.id === templateId)?.body ?? '';
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

function buildPreview(a?: Automation) {
  if (!a) return { title: 'No automation', lines: [] };
  const lines: string[] = [];
  lines.push(`Trigger: ${TRIGGER_LABELS[a.trigger.type]}`);
  a.steps.forEach((s) => {
    if (s.type === 'wait') lines.push(`Wait ${s.minutes} minutes`);
    if (s.type === 'condition') lines.push(`If (${s.rules.map((r) => `${r.field} ${opLabel(r.op)} ${r.value}`).join(' AND ')}) then continue`);
    if (s.type === 'send_template') lines.push(`Send template: ${TEMPLATE_LIBRARY.find((t) => t.id === s.templateId)?.name ?? s.templateId}`);
    if (s.type === 'send_offer') lines.push(`Send offer: ${s.productName} (${s.priceTnd} TND${s.discountPct ? ` -${s.discountPct}%` : ''})`);
    if (s.type === 'add_tag') lines.push(`Add tag: ${s.tag}`);
    if (s.type === 'ai_reply') lines.push(`AI reply (${s.tone}): ${s.goal}`);
  });
  return { title: a.name, lines };
}
