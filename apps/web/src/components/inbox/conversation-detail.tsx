'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  User,
  Phone,
  Mail,
  Tag,
  Bot,
  TicketPercent,
  Truck,
  UserPlus,
  CheckCircle2,
  Sparkles,
  ShoppingCart,
  Package,
  Wallet,
} from 'lucide-react';

interface ConversationDetailProps {
  conversationId: string;
}

type OptInStatus = 'opted_in' | 'opted_out' | 'pending';
type OrderStatus = 'paid' | 'shipped' | 'delivered' | 'refunded';

interface ConvoData {
  contact?: {
    name: string;
    phone: string;
    email?: string;
    tags?: string[];
    optInStatus: OptInStatus;
  };
  status: 'open' | 'closed' | 'pending';
  aiIntent?: string;
  aiSummary?: string;

  // Optional “segments”
  segments?: string[]; // ["VIP", "Repeat buyer", "AI: order_issue"]
}

const MOCK_CONVO: ConvoData = {
  contact: {
    name: 'Amira Ben Salah',
    phone: '+21622123456',
    email: 'amira@example.com',
    tags: ['order_issue', 'open'],
    optInStatus: 'opted_in',
  },
  status: 'pending',
  aiIntent: 'order_issue',
  aiSummary: 'Problème avec une commande',
  segments: ['VIP', 'Repeat buyer', 'AI: order_issue'],
};

const MOCK_COMMERCE = {
  kpis: { clv: 489, orders: 4, aov: 122 },
  cart: {
    status: 'abandoned' as 'active' | 'abandoned' | 'empty',
    total: 159,
    updatedAt: '09 Feb, 00:15',
    items: [
      { name: 'Shampooing doux', price: 49 },
      { name: 'Sérum vitamine C', price: 110 },
    ],
  },
  orders: [
    {
      id: '#1234',
      when: '06 févr., 01:00',
      amount: 89,
      status: 'delivered' as OrderStatus,
      items: [{ name: 'Gel douche', price: 44.5 }],
    },
    {
      id: '#1201',
      when: '19 janv., 01:00',
      amount: 140,
      status: 'paid' as OrderStatus,
      items: [
        { name: 'Crème hydratante', price: 85 },
        { name: 'Gommage', price: 55 },
      ],
    },
  ],
  crossSell: [
    { id: 'p1', name: 'Hydrating Serum', price: 39, note: 'Pairs well with last purchase' },
    { id: 'p2', name: 'Gentle Cleanser', price: 29, note: 'Top repeat buy for this segment' },
    { id: 'p3', name: 'SPF 50 Sunscreen', price: 45, note: 'Frequently bought together' },
  ],
};

function pill(base: string, tone: 'gray' | 'green' | 'yellow' | 'red' | 'blue') {
  const map = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return `text-[11px] px-2 py-0.5 rounded-full ${map[tone]} ${base}`;
}

function consentPill(consent?: OptInStatus) {
  if (consent === 'opted_in') return 'bg-green-100 text-green-700';
  if (consent === 'opted_out') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-800';
}

function orderStatusPill(s: OrderStatus) {
  if (s === 'delivered') return 'bg-green-100 text-green-700';
  if (s === 'paid') return 'bg-yellow-100 text-yellow-800';
  if (s === 'shipped') return 'bg-blue-100 text-blue-700';
  return 'bg-red-100 text-red-700';
}

function insertToComposer(text: string) {
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
  if (!textarea) return;
  const prev = textarea.value || '';
  textarea.value = prev.trim() ? `${prev}\n\n${text}` : text;
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  textarea.focus();
}

export function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const [data, setData] = useState<ConvoData | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let alive = true;
    setData(null);
    setUsingMock(false);

    api.getConversation(conversationId)
      .then((res) => {
        if (!alive) return;
        setData(res as ConvoData);
      })
      .catch(() => {
        if (!alive) return;
        setUsingMock(true);
        setData(MOCK_CONVO);
      });

    return () => {
      alive = false;
    };
  }, [conversationId]);

  const segments = useMemo(() => {
    const s = data?.segments?.length ? data.segments : [];
    return s;
  }, [data]);

  if (!data) return <div className="p-4 text-sm text-gray-400">Loading...</div>;

  return (
    <aside className="h-full overflow-y-auto border-l border-gray-200 bg-white">
      {/* sticky banner */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 p-3">
        {usingMock && (
          <div className="text-xs bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg px-3 py-2">
            Backend indisponible → mode mock activé (front-only).
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Top card: identity + quick actions */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-whatsapp-green text-white flex items-center justify-center font-semibold">
              {(data.contact?.name?.[0] || data.contact?.phone?.[0] || 'U').toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{data.contact?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500 truncate">{data.contact?.phone || ''}</div>
                </div>

                <span className={pill('', data.status === 'open' ? 'green' : data.status === 'closed' ? 'gray' : 'yellow')}>
                  {data.status}
                </span>
              </div>

              {/* Badges */}
              <div className="mt-2 flex flex-wrap gap-1">
                {segments.map((s) => (
                  <span
                    key={s}
                    className={pill('', s.toLowerCase().includes('vip') ? 'yellow' : s.toLowerCase().includes('repeat') ? 'gray' : 'blue')}
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Quick actions grid */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
                  onClick={() => alert('Mock: Create coupon')}
                >
                  <TicketPercent size={14} /> Create coupon
                </button>

                <button
                  className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
                  onClick={() => alert('Mock: Resend tracking')}
                >
                  <Truck size={14} /> Resend tracking
                </button>

                <button
                  className="text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
                  onClick={() => alert('Mock: Assign agent')}
                >
                  <UserPlus size={14} /> Assign agent
                </button>

                <button
                  className="text-xs py-2 px-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 flex items-center justify-center gap-2"
                  onClick={() => api.updateConversationStatus(conversationId, 'resolved')}
                >
                  <CheckCircle2 size={14} /> Mark resolved
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-gray-400" />
              <span>{data.contact?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone size={14} className="text-gray-400" />
              <span>{data.contact?.phone || ''}</span>
            </div>
            {data.contact?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gray-400" />
                <span>{data.contact.email}</span>
              </div>
            )}
            <div className="pt-2">
              <span className={`text-xs px-2 py-1 rounded ${consentPill(data.contact?.optInStatus)}`}>
                {data.contact?.optInStatus || 'pending'}
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {(data.contact?.tags?.length ? data.contact.tags : ['order_issue', data.status]).map((tag) => (
              <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* AI */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
            <Bot size={12} /> AI Insights
          </h3>
          {data.aiIntent ? (
            <p className="text-xs">
              <span className="font-medium">Intent:</span>{' '}
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{data.aiIntent}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500">No intent detected</p>
          )}
          {data.aiSummary && <p className="text-xs text-gray-600 mt-2">{data.aiSummary}</p>}

          <button
            className="mt-3 w-full text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2"
            onClick={() => insertToComposer('✨ Proposition IA : pouvez-vous préciser votre numéro de commande ?')}
          >
            <Sparkles size={14} /> AI quick reply
          </button>
        </div>

        {/* Commerce KPIs */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Commerce (mock)</h3>

          <div className="grid grid-cols-3 gap-2">
            <MiniKpi icon={<Wallet size={14} className="text-gray-400" />} label="CLV" value={`${MOCK_COMMERCE.kpis.clv} TND`} />
            <MiniKpi icon={<Package size={14} className="text-gray-400" />} label="Orders" value={`${MOCK_COMMERCE.kpis.orders}`} />
            <MiniKpi icon={<ShoppingCart size={14} className="text-gray-400" />} label="AOV" value={`${MOCK_COMMERCE.kpis.aov} TND`} />
          </div>

          {/* Cart */}
          <div className="mt-3 border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Cart</div>
              <span className={pill('', MOCK_COMMERCE.cart.status === 'abandoned' ? 'yellow' : MOCK_COMMERCE.cart.status === 'active' ? 'green' : 'gray')}>
                {MOCK_COMMERCE.cart.status}
              </span>
            </div>
            <div className="text-sm font-semibold mt-1">{MOCK_COMMERCE.cart.total} TND</div>
            <div className="text-xs text-gray-500">Updated: {MOCK_COMMERCE.cart.updatedAt}</div>

            <div className="mt-2 space-y-1">
              {MOCK_COMMERCE.cart.items.map((it) => (
                <div key={it.name} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700 truncate">{it.name}</span>
                  <span className="text-gray-500">{it.price} TND</span>
                </div>
              ))}
            </div>

            <button
              className="mt-3 w-full text-xs py-2 px-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              onClick={() =>
                insertToComposer(
                  `Bonjour 👋\n\nOn a remarqué que votre panier (${MOCK_COMMERCE.cart.total} TND) est toujours en attente.\nSouhaitez-vous que je vous aide à finaliser la commande ?`
                )
              }
            >
              Send cart reminder
            </button>
          </div>
        </div>

        {/* Recent orders */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent orders</h3>
          <div className="space-y-2">
            {MOCK_COMMERCE.orders.map((o) => (
              <div key={o.id} className="border border-gray-100 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{o.id}</div>
                  <div className="text-sm font-semibold">{o.amount} TND</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="text-xs text-gray-500">{o.when}</div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${orderStatusPill(o.status)}`}>{o.status}</span>
                </div>

                <div className="mt-2 space-y-1">
                  {o.items.map((it) => (
                    <div key={it.name} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate">{it.name}</span>
                      <span className="text-gray-500">{it.price} TND</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    className="text-xs py-1.5 px-2 rounded-md border border-gray-200 hover:bg-gray-50"
                    onClick={() => insertToComposer(`Pouvez-vous confirmer votre commande ${o.id} ?`)}
                  >
                    View
                  </button>
                  <button
                    className="text-xs py-1.5 px-2 rounded-md border border-gray-200 hover:bg-gray-50"
                    onClick={() => insertToComposer(`Je peux vous proposer une offre liée à votre commande ${o.id}. Ça vous dit ?`)}
                  >
                    Send promo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cross-sell */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cross-sell</h3>
          <div className="space-y-2">
            {MOCK_COMMERCE.crossSell.map((p) => (
              <div key={p.id} className="border border-gray-100 rounded-lg p-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-sm font-semibold">{p.price} TND</div>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{p.note}</div>

                <button
                  className="mt-2 w-full text-xs py-2 px-3 bg-whatsapp-green text-white rounded-lg hover:bg-whatsapp-dark transition-colors"
                  onClick={() =>
                    insertToComposer(
                      `Bonjour 👋\n\n✨ ${p.name} — ${p.price} TND\n${p.note}\n\nSouhaitez-vous que je vous l’ajoute ?`
                    )
                  }
                >
                  Insert offer in composer
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Internal note */}
        <div className="border border-gray-200 rounded-xl p-3 bg-white">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Internal note</h3>
          <textarea
            placeholder="Write a private note for the team..."
            className="w-full min-h-[90px] resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
          <button className="w-full mt-2 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
            Save note
          </button>
        </div>
      </div>
    </aside>
  );
}

function MiniKpi({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-2">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[11px] text-gray-500">{label}</div>
      </div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </div>
  );
}