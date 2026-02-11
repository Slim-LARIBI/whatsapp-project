'use client';

import { useMemo, useState } from 'react';
import { useInboxStore } from '@/store/inbox-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import {
  Search,
  Inbox,
  CircleCheck,
  Flame,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

type Filter = 'all' | 'unread' | 'open' | 'closed';

function getInitial(name?: string, phone?: string) {
  const src = (name?.trim() || phone?.trim() || '?').toUpperCase();
  return src[0] || '?';
}

function safeDate(iso?: string) {
  try {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  } catch {
    return null;
  }
}

function intentLabel(intent?: string) {
  if (!intent) return null;

  // mini mapping (tu peux enrichir)
  const map: Record<string, { label: string; icon?: any }> = {
    order_issue: { label: 'Order', icon: Flame },
    abandoned_cart: { label: 'Cart', icon: Flame },
    thanks: { label: 'Thanks', icon: Sparkles },
    support: { label: 'Support', icon: Inbox },
  };

  return map[intent] || { label: intent, icon: Sparkles };
}

export function ConversationList() {
  const { conversations, selectedConversationId, selectConversation } = useInboxStore();

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const stats = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    const unread = list.reduce((sum: number, c: any) => sum + (Number(c?.unreadCount) || 0), 0);
    const open = list.filter((c: any) => c?.status === 'open').length;
    const closed = list.filter((c: any) => c?.status === 'closed').length;
    return { unread, open, closed, total: list.length };
  }, [conversations]);

  const filtered = useMemo(() => {
    const list = Array.isArray(conversations) ? conversations : [];
    const query = q.trim().toLowerCase();

    return list
      .filter((c: any) => {
        // filter tabs
        if (filter === 'unread' && !(Number(c?.unreadCount) > 0)) return false;
        if (filter === 'open' && c?.status !== 'open') return false;
        if (filter === 'closed' && c?.status !== 'closed') return false;

        // search
        if (!query) return true;
        const name = (c?.contact?.name || '').toLowerCase();
        const phone = (c?.contact?.phone || '').toLowerCase();
        const intent = (c?.aiIntent || '').toLowerCase();
        const summary = (c?.aiSummary || '').toLowerCase();
        return (
          name.includes(query) ||
          phone.includes(query) ||
          intent.includes(query) ||
          summary.includes(query)
        );
      })
      .sort((a: any, b: any) => {
        // newest first
        const da = safeDate(a?.lastMessageAt)?.getTime() || 0;
        const db = safeDate(b?.lastMessageAt)?.getTime() || 0;
        return db - da;
      });
  }, [conversations, q, filter]);

  const activeIndex = useMemo(() => {
    if (!selectedConversationId) return -1;
    return filtered.findIndex((c: any) => c?.id === selectedConversationId);
  }, [filtered, selectedConversationId]);

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        {/* Title + stats */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">Inbox</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {stats.total} conv ·{' '}
              <span className="text-gray-700 font-medium">{stats.unread}</span> unread
            </div>
          </div>

          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn(
              'p-2 rounded-lg border text-gray-700 hover:bg-gray-50',
              showFilters ? 'border-gray-300 bg-gray-50' : 'border-gray-200 bg-white',
            )}
            title="Filters"
            aria-label="Filters"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, phone, intent..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green bg-white"
            />
          </div>
        </div>

        {/* Filters row */}
        {showFilters && (
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                All
              </FilterChip>

              <FilterChip active={filter === 'unread'} onClick={() => setFilter('unread')}>
                Unread
                {stats.unread > 0 && (
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-900 text-white">
                    {stats.unread}
                  </span>
                )}
              </FilterChip>

              <FilterChip active={filter === 'open'} onClick={() => setFilter('open')}>
                Open
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {stats.open}
                </span>
              </FilterChip>

              <FilterChip active={filter === 'closed'} onClick={() => setFilter('closed')}>
                Closed
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {stats.closed}
                </span>
              </FilterChip>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No conversations found.
            {q.trim() ? (
              <div className="mt-1 text-xs text-gray-400">Try another keyword.</div>
            ) : null}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((convo: any, idx: number) => {
              const active = selectedConversationId === convo?.id;

              const name = convo?.contact?.name || convo?.contact?.phone || 'Unknown';
              const phone = convo?.contact?.phone || '';
              const unread = Number(convo?.unreadCount) || 0;

              const d = safeDate(convo?.lastMessageAt);
              const time = d ? formatDistanceToNow(d, { addSuffix: true }) : '';

              const intent = intentLabel(convo?.aiIntent);
              const IntentIcon = intent?.icon;

              const status = (convo?.status || '').toLowerCase();

              return (
                <button
                  key={convo?.id}
                  onClick={() => selectConversation(convo?.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 flex gap-3 transition-colors',
                    active ? 'bg-green-50' : 'hover:bg-gray-50',
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0',
                      active ? 'bg-whatsapp-green text-white' : 'bg-gray-100 text-gray-700',
                    )}
                  >
                    {getInitial(convo?.contact?.name, convo?.contact?.phone)}
                  </div>

                  {/* Middle */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{name}</div>
                        <div className="text-xs text-gray-500 truncate">{phone}</div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-gray-400">{time}</span>
                        {unread > 0 && (
                          <span className="bg-whatsapp-green text-white text-[10px] px-2 py-0.5 rounded-full min-w-[22px] text-center">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Chips */}
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      {/* Status */}
                      <span
                        className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border',
                          status === 'open'
                            ? 'bg-white border-green-200 text-green-700'
                            : status === 'closed'
                            ? 'bg-white border-gray-200 text-gray-600'
                            : 'bg-white border-yellow-200 text-yellow-700',
                        )}
                      >
                        {status || 'unknown'}
                      </span>

                      {/* Intent */}
                      {intent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 inline-flex items-center gap-1">
                          {IntentIcon ? <IntentIcon size={12} /> : null}
                          {intent.label}
                        </span>
                      )}

                      {/* AI Summary preview */}
                      {convo?.aiSummary ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 truncate max-w-[220px]">
                          {convo.aiSummary}
                        </span>
                      ) : null}

                      {/* Active marker (nice touch) */}
                      {active && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 inline-flex items-center gap-1">
                          <CircleCheck size={12} />
                          Active
                        </span>
                      )}
                    </div>

                    {/* Keyboard hint (optional) */}
                    {activeIndex === idx && (
                      <div className="mt-2 text-[11px] text-gray-400">
                        Tip: use Templates / AI reply in the header →
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-2 text-xs rounded-xl border transition-colors inline-flex items-center',
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}