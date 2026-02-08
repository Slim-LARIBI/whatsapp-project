'use client';

import { useMemo, useState } from 'react';
import { useInboxStore } from '@/store/inbox-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Search, Flame, Clock3, CheckCircle2 } from 'lucide-react';

type Tab = 'open' | 'closed' | 'needs_reply';
type Sort = 'latest' | 'unread';

function hoursSince(iso?: string) {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

export function ConversationList() {
  const { conversations, selectedConversationId, selectConversation } = useInboxStore();

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('open');
  const [sort, setSort] = useState<Sort>('latest');

  const list = useMemo(() => {
    const q = search.trim().toLowerCase();

    let items = conversations.filter((c) => {
      const name = c.contact?.name?.toLowerCase() || '';
      const phone = c.contact?.phone || '';

      const matchSearch = !q || name.includes(q) || phone.includes(search.trim());

      const needsReply = c.status === 'open' && (c.unreadCount ?? 0) > 0;

      const matchTab =
        tab === 'open'
          ? c.status === 'open'
          : tab === 'closed'
          ? c.status !== 'open'
          : needsReply;

      return matchSearch && matchTab;
    });

    items = items.sort((a, b) => {
      if (sort === 'unread') {
        const au = a.unreadCount ?? 0;
        const bu = b.unreadCount ?? 0;
        if (bu !== au) return bu - au;
      }
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bt - at;
    });

    return items;
  }, [conversations, search, tab, sort]);

  // quick counts
  const counts = useMemo(() => {
    const open = conversations.filter((c) => c.status === 'open').length;
    const closed = conversations.filter((c) => c.status !== 'open').length;
    const needs = conversations.filter((c) => c.status === 'open' && (c.unreadCount ?? 0) > 0).length;
    return { open, closed, needs };
  }, [conversations]);

  return (
    <>
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>

        {/* Tabs */}
        <div className="mt-3 flex items-center gap-2">
          <TabBtn active={tab === 'open'} onClick={() => setTab('open')} label="Open" count={counts.open} />
          <TabBtn active={tab === 'needs_reply'} onClick={() => setTab('needs_reply')} label="Needs reply" count={counts.needs} />
          <TabBtn active={tab === 'closed'} onClick={() => setTab('closed')} label="Closed" count={counts.closed} />
        </div>

        {/* Sort */}
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-500">Sort</div>
          <div className="flex gap-2">
            <Pill active={sort === 'latest'} onClick={() => setSort('latest')} label="Latest" />
            <Pill active={sort === 'unread'} onClick={() => setSort('unread')} label="Unread" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-white">
        {list.map((convo) => {
          const isActive = selectedConversationId === convo.id;

          const initials = (convo.contact?.name?.[0] || convo.contact?.phone?.[0] || '?').toUpperCase();
          const lastAt = convo.lastMessageAt ? new Date(convo.lastMessageAt) : null;

          // Mock preview (later we’ll read from last message)
          const preview =
            convo.aiSummary ||
            (convo.aiIntent === 'order_issue'
              ? 'Customer reported an issue with an order…'
              : convo.aiIntent === 'thanks'
              ? 'Customer thanked your support…'
              : 'Conversation preview…');

          const h = hoursSince(convo.lastMessageAt);
          const windowLeft = Math.max(0, 24 - h);
          const windowRisk = convo.status === 'open' && windowLeft <= 4; // last 4 hours in 24h window

          return (
            <button
              key={convo.id}
              onClick={() => selectConversation(convo.id)}
              className={cn(
                'w-full px-4 py-3 flex items-start gap-3 border-b border-gray-100 text-left transition-colors',
                isActive ? 'bg-green-50' : 'hover:bg-gray-50',
              )}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-whatsapp-green text-white flex items-center justify-center font-semibold flex-shrink-0">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {convo.contact?.name || convo.contact?.phone}
                    </div>

                    {/* Meta line */}
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                      {convo.aiIntent ? (
                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px]">
                          {convo.aiIntent}
                        </span>
                      ) : null}

                      <span className={cn('text-[11px]', convo.status === 'open' ? 'text-green-700' : 'text-gray-500')}>
                        {convo.status}
                      </span>

                      {/* 24h window pill */}
                      {convo.status === 'open' && (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border',
                            windowRisk
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-gray-50 text-gray-600 border-gray-200',
                          )}
                          title="WhatsApp 24h customer care window (mock)"
                        >
                          <Clock3 size={11} />
                          {windowLeft.toFixed(0)}h
                        </span>
                      )}

                      {/* Priority (mock) */}
                      {windowRisk && (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-orange-50 text-orange-700 border border-orange-200">
                          <Flame size={11} />
                          urgent
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {lastAt ? formatDistanceToNow(lastAt, { addSuffix: true }) : ''}
                    </span>
                    {(convo.unreadCount ?? 0) > 0 ? (
                      <span className="bg-whatsapp-green text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {convo.unreadCount}
                      </span>
                    ) : (
                      <span className="text-gray-300" title="No unread">
                        <CheckCircle2 size={14} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="mt-2 text-xs text-gray-500 truncate">{preview}</div>
              </div>
            </button>
          );
        })}

        {list.length === 0 && (
          <div className="p-6 text-sm text-gray-400">No conversations found</div>
        )}
      </div>
    </>
  );
}

function TabBtn({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition',
        active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
      )}
    >
      <span>{label}</span>
      <span className={cn('text-xs px-2 py-0.5 rounded-full', active ? 'bg-white/20' : 'bg-gray-100')}>
        {count}
      </span>
    </button>
  );
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'text-xs px-3 py-1.5 rounded-full border transition',
        active ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
      )}
    >
      {label}
    </button>
  );
}