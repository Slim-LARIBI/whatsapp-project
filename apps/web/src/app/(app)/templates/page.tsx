'use client';

import { useMemo, useState } from 'react';
import { Search, Copy, Sparkles, Tag, ShoppingCart, Truck, Gift } from 'lucide-react';

type TemplateCategory = 'abandoned_cart' | 'order' | 'shipping' | 'promo' | 'support';

type Template = {
  id: string;
  name: string;
  category: TemplateCategory;
  lang: 'fr' | 'en';
  body: string;
  tags: string[];
  variables: string[]; // e.g. {{first_name}}
};

const TEMPLATES: Template[] = [
  {
    id: 't_abandoned_1',
    name: 'Panier abandonné — Rappel doux',
    category: 'abandoned_cart',
    lang: 'fr',
    body:
      "Bonjour {{first_name}} 👋\n\nOn a remarqué que votre panier est toujours en attente 🛒\nSouhaitez-vous que je vous aide à finaliser votre commande ?\n\n👉 Votre panier : {{cart_total}} TND\n",
    tags: ['relance', 'panier', 'crc'],
    variables: ['{{first_name}}', '{{cart_total}}'],
  },
  {
    id: 't_abandoned_2',
    name: 'Panier abandonné — Offre -10%',
    category: 'abandoned_cart',
    lang: 'fr',
    body:
      "Hello {{first_name}} 😊\n\nVotre panier vous attend 🛒\nPour vous aider à finaliser, je peux vous proposer -10% aujourd’hui.\n\n✅ Total panier : {{cart_total}} TND\n🎁 Code : {{coupon_code}}\n",
    tags: ['promo', 'panier', 'coupon'],
    variables: ['{{first_name}}', '{{cart_total}}', '{{coupon_code}}'],
  },
  {
    id: 't_order_1',
    name: 'Commande confirmée',
    category: 'order',
    lang: 'fr',
    body:
      "Merci {{first_name}} 🙏\n\n✅ Votre commande #{{order_id}} est confirmée.\nMontant : {{order_total}} TND\n\nJe reste dispo si besoin.",
    tags: ['order', 'confirmation'],
    variables: ['{{first_name}}', '{{order_id}}', '{{order_total}}'],
  },
  {
    id: 't_ship_1',
    name: 'Expédition en cours',
    category: 'shipping',
    lang: 'fr',
    body:
      "Bonjour {{first_name}} 👋\n\n🚚 Votre commande #{{order_id}} est en cours d’expédition.\nTransporteur : {{carrier}}\nSuivi : {{tracking_url}}\n",
    tags: ['shipping', 'tracking'],
    variables: ['{{first_name}}', '{{order_id}}', '{{carrier}}', '{{tracking_url}}'],
  },
  {
    id: 't_promo_1',
    name: 'Promo VIP — Offre personnalisée',
    category: 'promo',
    lang: 'fr',
    body:
      "Bonjour {{first_name}} ✨\n\nEn tant que client VIP, je peux vous proposer une offre personnalisée aujourd’hui 🎁\nSouhaitez-vous une recommandation selon votre dernier achat ?",
    tags: ['vip', 'promo', 'upsell'],
    variables: ['{{first_name}}'],
  },
  {
    id: 't_support_1',
    name: 'Demande numéro de commande',
    category: 'support',
    lang: 'fr',
    body:
      "Bonjour {{first_name}} 👋\n\nPour que je vérifie, pouvez-vous me donner votre numéro de commande svp ?",
    tags: ['support', 'order_issue'],
    variables: ['{{first_name}}'],
  },
];

const CATEGORY_META: Record<TemplateCategory, { label: string; icon: any }> = {
  abandoned_cart: { label: 'Abandoned cart', icon: ShoppingCart },
  order: { label: 'Order', icon: Tag },
  shipping: { label: 'Shipping', icon: Truck },
  promo: { label: 'Promo', icon: Gift },
  support: { label: 'Support', icon: Sparkles },
};

function cn(...c: Array<string | false | undefined | null>) {
  return c.filter(Boolean).join(' ');
}

function fillVariables(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v ?? `{{${key}}}`;
  });
}

export default function TemplatesPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [lang, setLang] = useState<'all' | 'fr' | 'en'>('all');

  // MOCK variables preview (front only)
  const previewVars = useMemo(
    () => ({
      first_name: 'Amira',
      cart_total: '159',
      coupon_code: 'VIP10',
      order_id: '1234',
      order_total: '89',
      carrier: 'Aramex',
      tracking_url: 'https://tracking.example.com/1234',
    }),
    [],
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const matchesQ =
        !s ||
        t.name.toLowerCase().includes(s) ||
        t.tags.some((x) => x.toLowerCase().includes(s)) ||
        t.body.toLowerCase().includes(s);
      const matchesCategory = category === 'all' || t.category === category;
      const matchesLang = lang === 'all' || t.lang === lang;
      return matchesQ && matchesCategory && matchesLang;
    });
  }, [q, category, lang]);

  const onCopy = async (t: Template) => {
    const filled = fillVariables(t.body, previewVars);
    await navigator.clipboard.writeText(filled);
    alert(`Copied: "${t.name}"`);
  };

  return (
    <div className="flex h-[calc(100vh-0px)] bg-gray-50">
      {/* Left filters */}
      <aside className="w-[320px] border-r border-gray-200 bg-white p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Templates</h1>
            <p className="text-xs text-gray-500">Copy/paste ready WhatsApp replies</p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            {filtered.length} results
          </span>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search template, tag, keyword..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">Category</div>
          <div className="flex flex-col gap-1">
            <button
              className={cn(
                'text-left px-3 py-2 rounded-lg border text-sm',
                category === 'all'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-white border-gray-200 hover:bg-gray-50',
              )}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {(Object.keys(CATEGORY_META) as TemplateCategory[]).map((k) => {
              const Icon = CATEGORY_META[k].icon;
              return (
                <button
                  key={k}
                  className={cn(
                    'text-left px-3 py-2 rounded-lg border text-sm flex items-center gap-2',
                    category === k
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-white border-gray-200 hover:bg-gray-50',
                  )}
                  onClick={() => setCategory(k)}
                >
                  <Icon size={16} className="text-gray-500" />
                  {CATEGORY_META[k].label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase">Language</div>
          <div className="flex gap-2">
            {(['all', 'fr', 'en'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={cn(
                  'px-3 py-2 rounded-lg border text-sm flex-1',
                  lang === l
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-white border-gray-200 hover:bg-gray-50',
                )}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
          <div className="text-xs font-semibold text-gray-700 mb-2">Preview variables (mock)</div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
            <div className="truncate">first_name: <b>{previewVars.first_name}</b></div>
            <div className="truncate">cart_total: <b>{previewVars.cart_total}</b></div>
            <div className="truncate">coupon_code: <b>{previewVars.coupon_code}</b></div>
            <div className="truncate">order_id: <b>{previewVars.order_id}</b></div>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">
            Later: these values will come from Woo/Presta API.
          </p>
        </div>
      </aside>

      {/* Main list */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-4">
          {filtered.map((t) => {
            const Icon = CATEGORY_META[t.category].icon;
            const filled = fillVariables(t.body, previewVars);

            return (
              <div
                key={t.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-gray-500" />
                      <h2 className="font-semibold text-sm truncate">{t.name}</h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {t.lang.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.tags.map((x) => (
                        <span
                          key={x}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                        >
                          {x}
                        </span>
                      ))}
                      {t.variables.map((v) => (
                        <span
                          key={v}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-100"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => onCopy(t)}
                    className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-whatsapp-green text-white text-sm font-medium hover:bg-whatsapp-dark transition-colors"
                  >
                    <Copy size={16} />
                    Copy
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                    <div className="text-xs font-semibold text-gray-600 mb-2">Raw</div>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">{t.body}</pre>
                  </div>
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                    <div className="text-xs font-semibold text-green-700 mb-2">Preview (filled)</div>
                    <pre className="text-xs text-green-900 whitespace-pre-wrap">{filled}</pre>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
              No templates found. Try another keyword or category.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}