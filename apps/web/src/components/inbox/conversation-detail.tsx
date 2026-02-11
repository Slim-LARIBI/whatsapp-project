'use client';

import { useEffect, useMemo, useState } from 'react';
import { useInboxStore } from '@/store/inbox-store';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  User,
  Phone,
  Mail,
  Tag,
  Bot,
  Sparkles,
  Wand2,
  ShoppingBag,
  CreditCard,
  Truck,
  ShieldCheck,
} from 'lucide-react';

type ConvoData = {
  id?: string;
  status?: string;
  aiIntent?: string;
  aiSummary?: string;

  // optional AI layer (mock)
  aiConfidence?: number; // 0..1
  aiWhy?: string[];

  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    tags?: string[];
    optInStatus?: 'opted_in' | 'opted_out' | 'pending' | string;
  };

  // optional commerce mock (future Woo/Presta)
  commerce?: {
    lastOrder?: {
      id: string;
      total: string;
      currency: string;
      status: 'paid' | 'shipped' | 'delivered' | 'refunded' | string;
      itemsCount: number;
      createdAt: string;
    };
    cart?: {
      total: string;
      currency: string;
      itemsCount: number;
      updatedAt: string;
    };
    clv?: {
      value: string;
      currency: string;
      tier?: 'bronze' | 'silver' | 'gold' | 'vip' | string;
    };
  };
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function pct(n: number) {
  return Math.round(clamp01(n) * 100);
}

function intentBadgeColor(intent?: string) {
  if (!intent) return 'bg-gray-100 text-gray-700 border-gray-200';
  if (intent.includes('order')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (intent.includes('refund') || intent.includes('issue')) return 'bg-red-50 text-red-700 border-red-200';
  if (intent.includes('shipping')) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (intent.includes('thanks')) return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-purple-50 text-purple-700 border-purple-200';
}

function confidenceColor(p: number) {
  if (p >= 80) return 'text-green-700 bg-green-50 border-green-200';
  if (p >= 55) return 'text-amber-800 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function ConversationDetail({ conversationId }: { conversationId: string }) {
  const conversations = useInboxStore((s: any) => s.conversations);

  const storeConvo = useMemo(() => {
    return (conversations || []).find((c: any) => c.id === conversationId);
  }, [conversations, conversationId]);

  const [data, setData] = useState<ConvoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mockMode, setMockMode] = useState(false);

  // Build a safe mock detail from store conversation (front-only)
  const mockDetail: ConvoData = useMemo(() => {
    const firstName =
      (storeConvo?.contact?.name || storeConvo?.contact?.phone || 'Client')
        .toString()
        .split(' ')[0];

    const baseIntent = storeConvo?.aiIntent || 'order_issue';
    const baseSummary = storeConvo?.aiSummary || 'Client demande de l’aide.';

    // simple deterministic confidence mock
    const conf =
      baseIntent === 'order_issue' ? 0.86 :
      baseIntent === 'shipping' ? 0.78 :
      baseIntent === 'thanks' ? 0.92 :
      0.64;

    const why =
      baseIntent === 'order_issue'
        ? ['Mot-clé “problème / commande” détecté', 'Historique: dernier achat récent', 'Message entrant non résolu']
        : baseIntent === 'shipping'
        ? ['Mot-clé “livraison / tracking” détecté', 'Dernier statut commande = paid', 'Timing < 7 jours']
        : baseIntent === 'thanks'
        ? ['Tonalité positive détectée', 'Pas de question explicite', 'Conversation courte']
        : ['Mots-clés génériques détectés', 'Confiance moyenne', 'Besoin de contexte (commande/panier)'];

    return {
      id: conversationId,
      status: storeConvo?.status || 'open',
      aiIntent: baseIntent,
      aiSummary: baseSummary,
      aiConfidence: conf,
      aiWhy: why,
      contact: {
        name: storeConvo?.contact?.name || `${firstName} (mock)`,
        phone: storeConvo?.contact?.phone || '+216XXXXXXXX',
        email: storeConvo?.contact?.email,
        tags: storeConvo?.contact?.tags || (baseIntent ? [baseIntent, 'ecommerce'] : ['ecommerce']),
        optInStatus: storeConvo?.contact?.optInStatus || 'opted_in',
      },
      commerce: {
        lastOrder: {
          id: '1234',
          total: '89',
          currency: 'TND',
          status: 'delivered',
          itemsCount: 2,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        },
        cart: {
          total: '159',
          currency: 'TND',
          itemsCount: 3,
          updatedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        },
        clv: {
          value: '420',
          currency: 'TND',
          tier: 'gold',
        },
      },
    };
  }, [conversationId, storeConvo]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setMockMode(false);

    (async () => {
      try {
        // Try backend
        const res = await api.getConversation(conversationId);
        if (!mounted) return;

        // Normalize minimal fields (backend may not have aiConfidence/aiWhy yet)
        const normalized: ConvoData = {
          ...(res as any),
          id: (res as any)?.id ?? conversationId,
          status: (res as any)?.status ?? 'open',
          contact: (res as any)?.contact ?? mockDetail.contact,
          aiIntent: (res as any)?.aiIntent ?? mockDetail.aiIntent,
          aiSummary: (res as any)?.aiSummary ?? mockDetail.aiSummary,
          aiConfidence: (res as any)?.aiConfidence ?? mockDetail.aiConfidence,
          aiWhy: (res as any)?.aiWhy ?? mockDetail.aiWhy,
          commerce: (res as any)?.commerce ?? mockDetail.commerce,
        };

        setData(normalized);
      } catch (e) {
        // fallback to mock
        if (!mounted) return;
        setMockMode(true);
        setData(mockDetail);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [conversationId, mockDetail]);

  if (loading) {
    return (
      <div className="h-full p-4 text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-full p-4 text-sm text-gray-400">
        No data
      </div>
    );
  }

  const confidence = typeof data.aiConfidence === 'number' ? pct(data.aiConfidence) : null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Top banner */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">
                {data.contact?.name || 'Unknown'}
              </div>
              <div className="mt-1 text-xs text-gray-500 truncate">
                {data.contact?.phone || ''}
              </div>

              {mockMode && (
                <div className="mt-2 text-[11px] px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 inline-flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Backend indisponible → mode mock activé (front-only).
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={cn(
                  'text-[10px] px-2 py-1 rounded-full border',
                  data.status === 'open'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200',
                )}
              >
                {data.status || 'open'}
              </span>

              {data.aiIntent ? (
                <span
                  className={cn(
                    'text-[10px] px-2 py-1 rounded-full border',
                    intentBadgeColor(data.aiIntent),
                  )}
                >
                  AI: {data.aiIntent}
                </span>
              ) : null}
            </div>
          </div>

          {/* Contact quick rows */}
          <div className="mt-4 grid grid-cols-1 gap-2">
            <Row icon={<Phone size={14} className="text-gray-400" />} label="Phone" value={data.contact?.phone || '-'} />
            {data.contact?.email ? (
              <Row icon={<Mail size={14} className="text-gray-400" />} label="Email" value={data.contact.email} />
            ) : null}
          </div>

          {/* Tags */}
          {data.contact?.tags?.length ? (
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Tags</div>
              <div className="flex flex-wrap gap-1">
                {data.contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border border-gray-200"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* AI Insights card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-gray-700" />
              <div className="text-sm font-semibold">AI Insights</div>
            </div>

            {confidence !== null && (
              <span className={cn('text-[11px] px-2 py-1 rounded-full border', confidenceColor(confidence))}>
                Confidence: {confidence}%
              </span>
            )}
          </div>

          {data.aiSummary ? (
            <p className="mt-3 text-sm text-gray-700 leading-relaxed">
              {data.aiSummary}
            </p>
          ) : (
            <p className="mt-3 text-sm text-gray-400">No AI summary.</p>
          )}

          {/* Confidence bar */}
          {confidence !== null && (
            <div className="mt-3">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-whatsapp-green"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {confidence >= 80
                  ? 'High confidence → suggest automation or template.'
                  : confidence >= 55
                  ? 'Medium confidence → ask for order/cart context.'
                  : 'Low confidence → collect more info first.'}
              </div>
            </div>
          )}

          {/* Why list */}
          {Array.isArray(data.aiWhy) && data.aiWhy.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-gray-500" /> Why (mock)
              </div>
              <ul className="space-y-2">
                {data.aiWhy.slice(0, 4).map((w, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 shrink-0" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => alert('Mock: Create automation from intent (Sprint next)')}
              className="flex-1 text-xs py-2 px-3 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <Wand2 size={14} />
              Create automation from intent
            </button>
            <button
              onClick={() => alert('Mock: Apply template suggestion (already in Inbox templates)')}
              className="flex-1 text-xs py-2 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles size={14} />
              Suggest template
            </button>
          </div>
        </div>

        {/* Commerce card (future Woo/Presta) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={16} className="text-gray-700" />
            <div className="text-sm font-semibold">Commerce</div>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700 border-gray-200">
              Mock
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3">
            {/* Last order */}
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500 uppercase">Last order</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Truck size={14} className="text-gray-400" />
                  {data.commerce?.lastOrder?.status || '—'}
                </div>
              </div>

              {data.commerce?.lastOrder ? (
                <div className="mt-2">
                  <div className="text-sm font-medium">
                    #{data.commerce.lastOrder.id} • {data.commerce.lastOrder.total} {data.commerce.lastOrder.currency}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    {data.commerce.lastOrder.itemsCount} item(s)
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400">No order data.</div>
              )}
            </div>

            {/* Cart */}
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500 uppercase">Cart</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <CreditCard size={14} className="text-gray-400" />
                  {data.commerce?.cart?.itemsCount ?? 0} items
                </div>
              </div>

              {data.commerce?.cart ? (
                <div className="mt-2">
                  <div className="text-sm font-medium">
                    {data.commerce.cart.total} {data.commerce.cart.currency}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Updated recently
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400">No cart data.</div>
              )}
            </div>

            {/* CLV */}
            <div className="rounded-xl border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-gray-500 uppercase">CLV</div>
                <span className="text-[10px] px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200">
                  {data.commerce?.clv?.tier || 'tier'}
                </span>
              </div>

              {data.commerce?.clv ? (
                <div className="mt-2 text-sm font-medium">
                  {data.commerce.clv.value} {data.commerce.clv.currency}
                </div>
              ) : (
                <div className="mt-2 text-sm text-gray-400">No CLV data.</div>
              )}
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500">
            Sprint suivant: brancher Woo/Presta → auto-fill order/cart/CLV par phone match.
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => api.updateConversationStatus(conversationId, 'resolved')}
              className="text-xs py-2 px-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors"
            >
              Mark as Resolved
            </button>
            <button
              onClick={() => api.updateConversationStatus(conversationId, 'closed')}
              className="text-xs py-2 px-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-gray-500">{label}</div>
        <div className="text-sm text-gray-800 truncate">{value}</div>
      </div>
    </div>
  );
}