'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useInboxStore } from '@/store/inbox-store';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Send,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  Sparkles,
  X,
  Search,
} from 'lucide-react';

/* =========================
   Mock variables UI only
========================= */
const MOCK_VARS: Record<string, string> = {
  first_name: 'Client',
  cart_total: '159',
  coupon_code: 'VIP10',
  order_id: '1234',
  order_total: '89',
  carrier: 'Aramex',
  tracking_url: 'https://tracking.example.com/ARX-123',
};

type Template = {
  id: string;
  title: string;
  category: 'abandoned_cart' | 'order' | 'shipping' | 'promo' | 'support';
  lang: 'FR' | 'EN';
  tags: string[];
  body: string;
};

const TEMPLATES: Template[] = [
  {
    id: 't1',
    title: 'Panier abandonné — Rappel doux',
    category: 'abandoned_cart',
    lang: 'FR',
    tags: ['relance', 'panier', 'crc'],
    body:
      `Bonjour {{first_name}} 👋\n\n` +
      `On a remarqué que votre panier est toujours en attente 🛒\n` +
      `Souhaitez-vous que je vous aide à finaliser votre commande ?\n\n` +
      `👉 Votre panier : {{cart_total}} TND`,
  },
  {
    id: 't2',
    title: 'Panier abandonné — Offre -10%',
    category: 'abandoned_cart',
    lang: 'FR',
    tags: ['promo', 'panier', 'coupon'],
    body:
      `Hello {{first_name}} 😊\n\n` +
      `Votre panier vous attend 🛒\n` +
      `Pour vous aider à finaliser, je peux vous proposer -10% aujourd’hui.\n\n` +
      `✅ Total panier : {{cart_total}} TND\n` +
      `🎁 Code : {{coupon_code}}`,
  },
  {
    id: 't3',
    title: 'Commande confirmée',
    category: 'order',
    lang: 'FR',
    tags: ['order', 'confirmation'],
    body:
      `Merci {{first_name}} 🙏\n\n` +
      `✅ Votre commande #{{order_id}} est confirmée.\n` +
      `Montant : {{order_total}} TND\n\n` +
      `Je reste dispo si besoin.`,
  },
  {
    id: 't4',
    title: 'Expédition en cours (tracking)',
    category: 'shipping',
    lang: 'FR',
    tags: ['shipping', 'tracking'],
    body:
      `Bonjour {{first_name}} 👋\n\n` +
      `🚚 Votre commande #{{order_id}} est en cours d’expédition ({{carrier}}).\n` +
      `🔗 Suivi : {{tracking_url}}`,
  },
  {
    id: 't5',
    title: 'Support — Demande numéro de commande',
    category: 'support',
    lang: 'FR',
    tags: ['support'],
    body: `Bonjour {{first_name}} 👋 Pouvez-vous me donner votre numéro de commande ?`,
  },
];

function fillVars(body: string, vars: Record<string, string>) {
  return body.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_m, key) => vars[key] ?? `{{${key}}}`);
}

function getCategoryLabel(c: Template['category']) {
  switch (c) {
    case 'abandoned_cart':
      return 'Abandoned cart';
    case 'order':
      return 'Order';
    case 'shipping':
      return 'Shipping';
    case 'promo':
      return 'Promo';
    case 'support':
      return 'Support';
  }
}

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const conversations = useInboxStore((s) => s.conversations);
  const messages = useInboxStore((s) => s.messages);
  const composerDraft = useInboxStore((s) => s.composerDraft);
  const setComposerDraft = useInboxStore((s) => s.setComposerDraft);
  const sendMessage = useInboxStore((s) => s.sendMessage);
  const loadingMessages = useInboxStore((s) => s.loadingMessages);

  const convo = useMemo(() => {
    return conversations.find((c) => c.id === conversationId);
  }, [conversations, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [sending, setSending] = useState(false);

  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    autoResize();
  }, [composerDraft]);

  const [tplOpen, setTplOpen] = useState(false);
  const [tplSearch, setTplSearch] = useState('');
  const [tplCategory, setTplCategory] = useState<'all' | Template['category']>('all');

  const filteredTemplates = useMemo(() => {
    const q = tplSearch.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      const okCat = tplCategory === 'all' ? true : t.category === tplCategory;
      const okQ =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.tags.some((x) => x.toLowerCase().includes(q)) ||
        t.body.toLowerCase().includes(q);
      return okCat && okQ;
    });
  }, [tplSearch, tplCategory]);

  const onInsertTemplate = (t: Template) => {
    const vars = {
      ...MOCK_VARS,
      first_name: convo?.contact?.name?.split(' ')?.[0] || MOCK_VARS.first_name,
    };
    const filled = fillVars(t.body, vars);
    setComposerDraft(composerDraft?.trim() ? `${composerDraft}\n\n${filled}` : filled);
    setTplOpen(false);
  };

  const handleSend = async () => {
    const body = composerDraft.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      await sendMessage(body);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div className="h-14 shrink-0 border-b border-gray-200 px-4 flex items-center justify-between bg-white">
        <div className="min-w-0">
          <div className="font-medium text-sm truncate">{convo?.contact?.name || 'Conversation'}</div>
          <div className="text-xs text-gray-400">{convo?.contact?.phone || ''}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTplOpen(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText size={14} />
            Templates
          </button>

          <button
            onClick={() => {
              const suggestion =
                `Bonjour ${convo?.contact?.name?.split(' ')?.[0] || '👋'}, ` +
                `je m’en occupe. Pouvez-vous me partager votre numéro de commande ?`;
              setComposerDraft(composerDraft?.trim() ? `${composerDraft}\n\n${suggestion}` : suggestion);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <Sparkles size={14} />
            AI reply
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {loadingMessages ? (
          <div className="text-sm text-gray-400">Loading messages...</div>
        ) : (
          (messages || []).map((msg: any) => {
            const dir = msg.direction;
            const inbound = dir === 'in' || dir === 'inbound';
            const outbound = dir === 'out' || dir === 'outbound';

            const body = msg.content?.body || msg.content?.text || '';

            return (
              <div
                key={msg.id}
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
                  inbound ? 'bg-white border border-gray-200 mr-auto' : '',
                  outbound ? 'bg-whatsapp-light ml-auto' : '',
                )}
              >
                {body && <p className="whitespace-pre-wrap">{body}</p>}

                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-gray-400">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                  </span>
                  {outbound && <StatusIcon status={msg.status} />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white">
        <div className="px-3 pt-3 pb-2 flex gap-2 flex-wrap">
          <button
            onClick={() => setTplOpen(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2"
          >
            <FileText size={14} /> Templates
          </button>
          <button
            onClick={() => setComposerDraft(composerDraft?.trim() ? `${composerDraft} [Tag]` : '[Tag]')}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Add tag
          </button>
          <button
            onClick={() => {
              const line = `Order #${MOCK_VARS.order_id} — ${MOCK_VARS.order_total} TND`;
              setComposerDraft(composerDraft?.trim() ? `${composerDraft}\n${line}` : line);
            }}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            View order
          </button>
        </div>

        <div className="p-3 pt-2">
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={composerDraft}
              onChange={(e) => setComposerDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter new line)"
              rows={1}
              className="flex-1 resize-none overflow-hidden border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
            />

            <button
              onClick={handleSend}
              disabled={!composerDraft.trim() || sending}
              className="p-3 bg-whatsapp-green text-white rounded-xl hover:bg-whatsapp-dark disabled:opacity-50 transition-colors"
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {tplOpen && (
        <div className="absolute inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setTplOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-xl flex flex-col">
            <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
              <div className="font-semibold text-sm">Templates</div>
              <button onClick={() => setTplOpen(false)} className="p-2 rounded-lg hover:bg-gray-50">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b border-gray-200 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  value={tplSearch}
                  onChange={(e) => setTplSearch(e.target.value)}
                  placeholder="Search template, tag, keyword..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Chip active={tplCategory === 'all'} onClick={() => setTplCategory('all')}>
                  All
                </Chip>
                {(['abandoned_cart', 'order', 'shipping', 'support', 'promo'] as const).map((c) => (
                  <Chip key={c} active={tplCategory === c} onClick={() => setTplCategory(c)}>
                    {getCategoryLabel(c)}
                  </Chip>
                ))}
              </div>

              <div className="text-xs text-gray-400">
                Click “Insert” → ça remplit le champ message (tu peux éditer avant d’envoyer).
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
              {filteredTemplates.map((t) => {
                const preview = fillVars(t.body, {
                  ...MOCK_VARS,
                  first_name: convo?.contact?.name?.split(' ')?.[0] || MOCK_VARS.first_name,
                });

                return (
                  <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{t.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {getCategoryLabel(t.category)}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {t.lang}
                          </span>
                          {t.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => onInsertTemplate(t)}
                        className="px-3 py-1.5 text-xs rounded-lg bg-whatsapp-green text-white hover:bg-whatsapp-dark"
                      >
                        Insert
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border border-gray-200 p-2 bg-white">
                        <div className="text-[10px] text-gray-400 mb-1">Raw</div>
                        <pre className="text-xs whitespace-pre-wrap font-sans text-gray-800">
                          {t.body}
                        </pre>
                      </div>
                      <div className="rounded-lg border border-green-200 p-2 bg-green-50">
                        <div className="text-[10px] text-green-700 mb-1">Preview (filled)</div>
                        <pre className="text-xs whitespace-pre-wrap font-sans text-gray-900">
                          {preview}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredTemplates.length === 0 && (
                <div className="text-sm text-gray-400 text-center py-10">No templates found.</div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="text-xs text-gray-500">
                Variables mock: <code className="px-1 py-0.5 bg-gray-100 rounded">first_name</code>,{' '}
                <code className="px-1 py-0.5 bg-gray-100 rounded">cart_total</code>,{' '}
                <code className="px-1 py-0.5 bg-gray-100 rounded">coupon_code</code>,{' '}
                <code className="px-1 py-0.5 bg-gray-100 rounded">order_id</code>, etc.
              </div>
            </div>
          </div>
        </div>
      )}
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
        'px-3 py-1.5 text-xs rounded-full border transition-colors',
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
    case 'queued':
      return <Clock size={12} className="text-gray-400" />;
    case 'sent':
      return <Check size={12} className="text-gray-400" />;
    case 'delivered':
      return <CheckCheck size={12} className="text-gray-400" />;
    case 'read':
      return <CheckCheck size={12} className="text-blue-500" />;
    case 'failed':
      return <AlertCircle size={12} className="text-red-500" />;
    default:
      return null;
  }
}