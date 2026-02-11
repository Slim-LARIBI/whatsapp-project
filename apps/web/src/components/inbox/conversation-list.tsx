'use client';

import { useMemo, useState } from 'react';
import { useInboxStore, Conversation } from '@/store/inbox-store';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Search, Sparkles } from 'lucide-react';

type StatusFilter = 'all' | 'open' | 'closed';
type ExtraFilter = 'all' | 'unread' | 'ai';

function safeDate(v?: string) {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/**
 * SAFE mock confidence:
 * - Ne modifie pas le store
 * - Stable (basé sur l'id)
 * - Seulement affiché si aiIntent/aiSummary existe
 */
function aiConfidenceFromId(id: string) {
  // simple hash
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  // map [0..1] -> [0.62..0.96]
  const r = (h % 1000) / 1000;
  const score = 0.62 + r * (0.96 - 0.62);
  return Math.round(score * 100) / 100;
}

function confidenceColor(score: number) {
  if (score >= 0.9) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 0.8) return 'text-green-700 bg-green-50 border-green-200';
  if (score >= 0.7) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function confidenceBarColor(score: number) {
  if (score >= 0.9) return 'bg-emerald-500';
  if (score >= 0.8) return 'bg-green-500';
  if (score >= 0.7) return 'bg-amber-500';
  return 'bg-red-500';
}

export function ConversationList() {
  const { conversations, selectedConversationId, selectConversation } = useInboxStore();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [extra, setExtra] = useState<ExtraFilter>('all');

  const unreadTotal = useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.reduce((sum, c: any) => sum + (Number(c?.unreadCount) || 0), 0);
  }, [conversations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const list = (conversations || [])
      .filter((c: Conversation) => {
        // status
        const okStatus = status === 'all' ? true : c.status === status;

        // extra
        const hasAI = Boolean(c.aiIntent || c.aiSummary);
        const okExtra =
          extra === 'all'
            ? true
            : extra === 'unread'
              ? (c.unreadCount || 0) > 0
              : hasAI;

        // search
        const haystack = `${c.contact?.name || ''} ${c.contact?.phone || ''}`.toLowerCase();
        const okSearch = !q || haystack.includes(q);

        return okStatus && okExtra && okSearch;
      })
      .sort((a, b) => {
        const da = safeDate(a.lastMessageAt)?.getTime() ?? 0;
        const db = safeDate(b.lastMessageAt)?.getTime() ?? 0;
        return db - da; // latest first
      });

    return list;
  }, [conversations, search, status, extra]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top: Search */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
        </div>

        {/* Filters */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Chip active={status === 'all'} onClick={() => setStatus('all')}>
            All
          </Chip>
          <Chip active={status === 'open'} onClick={() => setStatus('open')}>
            Open
          </Chip>
          <Chip active={status === 'closed'} onClick={() => setStatus('closed')}>
            Closed
          </Chip>

          <span className="mx-1 h-4 w-px bg-gray-200" />

          <Chip active={extra === 'all'} onClick={() => setExtra('all')}>
            Default
          </Chip>
          <Chip active={extra === 'unread'} onClick={() => setExtra('unread')}>
            Unread {unreadTotal > 0 ? `(${unreadTotal})` : ''}
          </Chip>
          <Chip active={extra === 'ai'} onClick={() => setExtra('ai')}>
            AI only
          </Chip>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filtered.map((convo) => {
          const active = selectedConversationId === convo.id;
          const hasAI = Boolean(convo.aiIntent || convo.aiSummary);

          const score = hasAI ? aiConfidenceFromId(convo.id) : 0;
          const scorePct = hasAI ? Math.round(score * 100) : 0;

          return (
            <button
              key={convo.id}
              onClick={() => selectConversation(convo.id)}
              className={cn(
                'w-full px-4 py-3 flex items-start gap-3 border-b border-gray-100 text-left transition-colors',
                'hover:bg-gray-50',
                active && 'bg-green-50',
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0',
                  active ? 'bg-whatsapp-green text-white' : 'bg-gray-100 text-gray-700',
                )}
              >
                {(convo.contact?.name?.[0] || convo.contact?.phone?.[0] || '?').toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                {/* Row 1: name + time */}
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-sm truncate">
                    {convo.contact?.name || convo.contact?.phone || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {convo.lastMessageAt
                      ? formatDistanceToNow(new Date(convo.lastMessageAt), { addSuffix: true })
                      : ''}
                  </span>
                </div>

                {/* Row 2: preview */}
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500 truncate">
                    {convo.aiSummary ? convo.aiSummary : convo.status}
                  </span>

                  {Number(convo.unreadCount) > 0 && (
                    <span className="bg-whatsapp-green text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                      {convo.unreadCount}
                    </span>
                  )}
                </div>

                {/* Row 3: AI badge + confidence */}
                {hasAI && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border',
                        confidenceColor(score),
                      )}
                      title="AI detected intent + confidence"
                    >
                      <Sparkles size={12} />
                      <span className="font-semibold">AI</span>
                      <span className="opacity-80">•</span>
                      <span className="truncate max-w-[120px]">
                        {convo.aiIntent || 'intent'}
                      </span>
                      <span className="opacity-80">•</span>
                      <span className="font-semibold">{scorePct}%</span>
                    </span>

                    <div className="h-1.5 w-28 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                      <div
                        className={cn('h-full rounded-full', confidenceBarColor(score))}
                        style={{ width: `${scorePct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-6 text-sm text-gray-400 text-center">
            No conversations found.
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
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
        'text-xs px-3 py-1.5 rounded-full border transition-colors',
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}