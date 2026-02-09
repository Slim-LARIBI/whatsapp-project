'use client';

import { useMemo, useState } from 'react';
import { useInboxStore } from '@/store/inbox-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNowStrict } from 'date-fns';
import { Search } from 'lucide-react';

type FilterKey = 'all' | 'needs_reply' | 'vip' | 'automations' | 'closed';

// ✅ helper: safe string
function s(v: unknown) {
  return typeof v === 'string' ? v : '';
}

// ✅ mock business signals (front-only)
// Tu pourras remplacer plus tard par Woo/Presta data.
function deriveSignals(convo: any) {
  const name = s(convo?.contact?.name);
  const phone = s(convo?.contact?.phone);
  const aiIntent = s(convo?.aiIntent);
  const status = s(convo?.status);

  // VIP mock: si tag/flag existe ou nom contient "VIP" (fallback)
  const isVip =
    Boolean(convo?.isVip) ||
    (Array.isArray(convo?.tags) && convo.tags.includes('VIP')) ||
    name.toLowerCase().includes('vip');

  // Automation mock: si aiIntent commence par "auto_" ou flag
  const isAutomation =
    Boolean(convo?.isAutomation) ||
    aiIntent.toLowerCase().includes('automation') ||
    aiIntent.toLowerCase().includes('auto_') ||
    aiIntent.toLowerCase().includes('cart_abandoned');

  // Needs reply: unread > 0 OR status open + inbound last msg (fallback)
  const unread = Number(convo?.unreadCount ?? 0);
  const needsReply = unread > 0 || status === 'open';

  // SLA mock: si last msg < 10min -> pas SLA, si > 10min et needsReply => SLA
  const lastAt = convo?.lastMessageAt ? new Date(convo.lastMessageAt) : null;
  const minsAgo =
    lastAt ? Math.floor((Date.now() - lastAt.getTime()) / 60000) : 0;
  const slaCritical = needsReply && minsAgo >= 10;

  // Cart amount mock
  const cartAmountTnd =
    typeof convo?.cartTotal === 'number'
      ? convo.cartTotal
      : aiIntent.toLowerCase().includes('cart') // fallback
      ? 159
      : null;

  // Context line (2 infos max)
  const contextLeft = isAutomation ? 'Automation' : aiIntent ? aiIntent : 'Conversation';
  const contextRight = isVip ? 'VIP' : status ? status : '';
  const context = [contextLeft, contextRight].filter(Boolean).slice(0, 2).join(' · ');

  return {
    name: name || phone || 'Unknown',
    phone,
    isVip,
    isAutomation,
    needsReply,
    slaCritical,
    cartAmountTnd,
    minsAgo,
    context,
  };
}

function statusDotColor(sig: ReturnType<typeof deriveSignals>, convo: any) {
  const status = s(convo?.status);
  if (status === 'closed') return 'bg-gray-300';
  if (sig.isAutomation) return 'bg-orange-400';
  if (sig.needsReply) return 'bg-red-500';
  return 'bg-gray-400';
}

export function ConversationList() {
  const { conversations, selectedConversationId, selectConversation } = useInboxStore();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const withSignals = (conversations as any[]).map((c) => {
      const sig = deriveSignals(c);
      return { c, sig };
    });

    const bySearch = withSignals.filter(({ sig }) => {
      if (!q) return true;
      return sig.name.toLowerCase().includes(q) || sig.phone.includes(search.trim());
    });

    const byFilter = bySearch.filter(({ c, sig }) => {
      const status = s(c?.status);
      if (filter === 'all') return true;
      if (filter === 'needs_reply') return sig.needsReply && status !== 'closed';
      if (filter === 'vip') return sig.isVip && status !== 'closed';
      if (filter === 'automations') return sig.isAutomation && status !== 'closed';
      if (filter === 'closed') return status === 'closed';
      return true;
    });

    // ✅ Smart sort (CRC priority)
    const sorted = byFilter.sort((a, b) => {
      const aClosed = s(a.c?.status) === 'closed';
      const bClosed = s(b.c?.status) === 'closed';

      // closed last
      if (aClosed !== bClosed) return aClosed ? 1 : -1;

      // needs reply first
      if (a.sig.needsReply !== b.sig.needsReply) return a.sig.needsReply ? -1 : 1;

      // SLA critical next
      if (a.sig.slaCritical !== b.sig.slaCritical) return a.sig.slaCritical ? -1 : 1;

      // VIP next
      if (a.sig.isVip !== b.sig.isVip) return a.sig.isVip ? -1 : 1;

      // automation next
      if (a.sig.isAutomation !== b.sig.isAutomation) return a.sig.isAutomation ? -1 : 1;

      // newest lastMessageAt
      const aT = a.c?.lastMessageAt ? new Date(a.c.lastMessageAt).getTime() : 0;
      const bT = b.c?.lastMessageAt ? new Date(b.c.lastMessageAt).getTime() : 0;
      return bT - aT;
    });

    return sorted;
  }, [conversations, search, filter]);

  return (
    <div className="h-full flex flex-col">
      {/* Header (fixed) */}
      <div className="p-3 border-b border-gray-200 bg-white">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <Tab label="All" active={filter === 'all'} onClick={() => setFilter('all')} />
          <Tab label="Needs reply" active={filter === 'needs_reply'} onClick={() => setFilter('needs_reply')} />
          <Tab label="VIP" active={filter === 'vip'} onClick={() => setFilter('vip')} />
          <Tab label="Automations" active={filter === 'automations'} onClick={() => setFilter('automations')} />
          <Tab label="Closed" active={filter === 'closed'} onClick={() => setFilter('closed')} />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {filtered.map(({ c: convo, sig }) => {
          const isSelected = selectedConversationId === convo.id;

          const timeLabel = convo.lastMessageAt
            ? formatDistanceToNowStrict(new Date(convo.lastMessageAt), { addSuffix: true })
            : '';

          return (
            <button
              key={convo.id}
              onClick={() => selectConversation(convo.id)}
              className={cn(
                'w-full text-left px-3 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors',
                isSelected && 'bg-green-50',
              )}
            >
              <div className="flex items-start gap-3">
                {/* Status dot */}
                <span className={cn('mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0', statusDotColor(sig, convo))} />

                {/* Main */}
                <div className="flex-1 min-w-0">
                  {/* Line 1 */}
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-medium text-sm truncate">{sig.name}</div>
                    <div className="text-xs text-gray-400 flex-shrink-0">{timeLabel}</div>
                  </div>

                  {/* Line 2 (context) */}
                  <div className="mt-1 text-xs text-gray-600 truncate">
                    {sig.context}
                  </div>

                  {/* Line 3 (signals) */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {sig.isVip && <Badge tone="gold" label="VIP" />}
                    {sig.cartAmountTnd != null && <Badge tone="blue" label={`🛒 ${sig.cartAmountTnd} TND`} />}
                    {sig.slaCritical && <Badge tone="red" label="SLA" />}
                    {sig.isAutomation && <Badge tone="orange" label="🤖 Auto" />}
                    {Number(convo.unreadCount ?? 0) > 0 && (
                      <span className="ml-auto bg-whatsapp-green text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No conversations.</div>
        )}
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'text-xs px-3 py-1.5 rounded-full border whitespace-nowrap',
        active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50',
      )}
    >
      {label}
    </button>
  );
}

function Badge({ label, tone }: { label: string; tone: 'gold' | 'blue' | 'red' | 'orange' }) {
  const cls =
    tone === 'gold'
      ? 'bg-amber-100 text-amber-800 border-amber-200'
      : tone === 'blue'
      ? 'bg-blue-100 text-blue-700 border-blue-200'
      : tone === 'red'
      ? 'bg-red-100 text-red-700 border-red-200'
      : 'bg-orange-100 text-orange-700 border-orange-200';

  return (
    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border', cls)}>
      {label}
    </span>
  );
}