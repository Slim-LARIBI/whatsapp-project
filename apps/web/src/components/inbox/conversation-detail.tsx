'use client';

import { useMemo } from 'react';
import { Tag, Bot, User, Phone, ShoppingBag, Sparkles } from 'lucide-react';
import { useInboxStore } from '@/store/inbox-store';

interface ConversationDetailProps {
  conversationId: string;
}

type OrderStatus = 'paid' | 'delivered' | 'shipped';

function StatusPill({ status }: { status: OrderStatus }) {
  const cls =
    status === 'delivered'
      ? 'bg-green-100 text-green-700'
      : status === 'shipped'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-yellow-100 text-yellow-800';

  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${cls}`}>
      {status}
    </span>
  );
}

export function ConversationDetail({ conversationId }: ConversationDetailProps) {
  const { conversations, addMessage } = useInboxStore();

  // MOCK “business” data (plus tard tu vas le brancher API Woo/Presta)
  const convo = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const contact = convo?.contact;

  const customerValue = contact?.name?.toLowerCase().includes('amira') ? 489 : 120;

  const recentOrders =
    contact?.name?.toLowerCase().includes('amira')
      ? [
          { id: '#1234', amount: 89, when: 'Today', status: 'delivered' as OrderStatus },
          { id: '#1201', amount: 140, when: '12 days ago', status: 'paid' as OrderStatus },
          { id: '#1189', amount: 260, when: '1 month ago', status: 'shipped' as OrderStatus },
        ]
      : [{ id: '#1002', amount: 120, when: '10 minutes ago', status: 'paid' as OrderStatus }];

  const recos =
    contact?.name?.toLowerCase().includes('amira')
      ? [
          { name: 'Hydrating Serum', price: 39, note: 'Pairs well with last purchase' },
          { name: 'Gentle Cleanser', price: 29, note: 'Top repeat buy for this segment' },
          { name: 'SPF 50 Sunscreen', price: 45, note: 'Frequently bought together' },
        ]
      : [
          { name: 'Gift Set Mini', price: 25, note: 'Perfect add-on' },
          { name: 'Body Lotion', price: 35, note: 'High conversion upsell' },
          { name: 'Hand Cream', price: 18, note: 'Best seller' },
        ];

  const tags = convo?.aiIntent ? [convo.aiIntent, convo.status] : [convo?.status || 'open'];

  const consent = contact?.name?.toLowerCase().includes('mehdi') ? 'pending' : 'opted_in';

  const aiSummary =
    contact?.name?.toLowerCase().includes('amira')
      ? 'Problème avec une commande'
      : contact?.name?.toLowerCase().includes('mehdi')
        ? 'Client satisfait / fin de conversation'
        : 'Demande générale';

  const aiIntent = convo?.aiIntent || 'general';

  const sendOffer = (p: { name: string; price: number }) => {
    // IMPORTANT: on ajoute un message visible dans le chat (au lieu d’un alert)
    addMessage(`✨ Offre pour vous : ${p.name} — ${p.price} TND.\nSouhaitez-vous que je vous l’ajoute à votre prochaine commande ?`);
  };

  return (
    // h-full + overflow-y-auto = scroll OK dans le panneau droit
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* CONTACT */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Contact</div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="font-medium">{contact?.name || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{contact?.phone || '-'}</span>
            </div>
          </div>
        </div>

        {/* CUSTOMER VALUE */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase">Customer value</div>
            <div className="text-xs text-gray-500 mt-1">{recentOrders.length} orders total</div>
          </div>
          <div className="text-lg font-semibold">{customerValue} TND</div>
        </div>

        {/* RECENT ORDERS */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> Recent orders
          </div>

          <div className="space-y-2">
            {recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{o.id}</div>
                  <div className="text-xs text-gray-500">{o.when}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{o.amount} TND</div>
                  <div className="mt-1">
                    <StatusPill status={o.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CROSS SELL */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Cross-sell recommendations
          </div>

          <div className="space-y-3">
            {recos.map((p) => (
              <div key={p.name} className="border border-gray-100 rounded-2xl p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.note}</div>
                  </div>
                  <div className="text-sm font-semibold">{p.price} TND</div>
                </div>
                <button
                  onClick={() => sendOffer(p)}
                  className="mt-3 w-full py-2 rounded-xl bg-whatsapp-green text-white text-sm font-medium hover:bg-whatsapp-dark transition-colors"
                >
                  Send offer on WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* TAGS + CONSENT + AI */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.filter(Boolean).map((t) => (
                <span key={t} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Consent</div>
            <span
              className={[
                'text-xs px-2 py-1 rounded-full',
                consent === 'opted_in'
                  ? 'bg-green-100 text-green-700'
                  : consent === 'opted_out'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-800',
              ].join(' ')}
            >
              {consent}
            </span>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <Bot className="w-4 h-4" /> AI insights
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Intent:</span>{' '}
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                {aiIntent}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-2">{aiSummary}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
