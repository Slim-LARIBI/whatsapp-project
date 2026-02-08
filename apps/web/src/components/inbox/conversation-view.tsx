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
  Tag,
  ShoppingBag,
  X,
  Copy,
  Check as CheckIcon,
} from 'lucide-react';

type Template = {
  id: string;
  title: string;
  category: 'Order' | 'Shipping' | 'Cross-sell' | 'Promo' | 'Support';
  body: string;
  tags: string[];
};

const TEMPLATES: Template[] = [
  {
    id: 't1',
    title: 'Order confirmation',
    category: 'Order',
    tags: ['order', 'payment'],
    body:
      '✅ Confirmation : votre commande {{order_id}} est bien enregistrée.\nMontant : {{amount}} TND.\nMerci 🙏',
  },
  {
    id: 't2',
    title: 'Shipping update',
    category: 'Shipping',
    tags: ['shipping', 'tracking'],
    body:
      '🚚 Expédition : votre commande {{order_id}} est en route.\nTransporteur : {{carrier}}.\nSuivi : {{tracking_url}}',
  },
  {
    id: 't3',
    title: 'Cross-sell skincare',
    category: 'Cross-sell',
    tags: ['upsell', 'recommendation'],
    body:
      '✨ Petite reco pour vous : {{product_name}} ({{price}} TND).\nSouhaitez-vous que je vous envoie le lien ?',
  },
  {
    id: 't4',
    title: 'Promo -10%',
    category: 'Promo',
    tags: ['promo', 'discount'],
    body:
      '🎁 Offre spéciale : -10% avec le code {{code}} (valable jusqu’au {{date}}).\nVoulez-vous que je vous propose une sélection ?',
  },
  {
    id: 't5',
    title: 'Support - ask order id',
    category: 'Support',
    tags: ['support', 'order_issue'],
    body:
      'Bonjour 👋 pouvez-vous me partager votre numéro de commande s’il vous plaît ?',
  },
];

interface ConversationViewProps {
  conversationId: string;
}

export function ConversationView({ conversationId }: ConversationViewProps) {
  const { messages, conversations, selectedConversationId, selectConversation, addMessage } =
    useInboxStore();

  const convo = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const [input, setInput] = useState('');

  // UI state
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure conversation selected (store loads mock messages on selectConversation)
  useEffect(() => {
    if (selectedConversationId !== conversationId) selectConversation(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message (mock)
  const handleSend = () => {
    if (!input.trim()) return;
    addMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastInbound = useMemo(() => {
    // store message direction = 'in' | 'out'
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].direction === 'in') return messages[i];
    }
    return null;
  }, [messages]);

  const aiSuggestions = useMemo(() => {
    const base = lastInbound?.content?.body || '';
    // super simple heuristics (mock)
    if (base.toLowerCase().includes('commande')) {
      return [
        'Bonjour 👋 merci pour votre message. Pouvez-vous me partager votre numéro de commande s’il vous plaît ?',
        'Je suis là pour vous aider 🙂. Envoyez-moi votre numéro de commande et je vérifie tout de suite.',
        'D’accord ✅. Quel est votre numéro de commande ?',
      ];
    }
    return [
      'Merci pour votre message 🙏. Pouvez-vous préciser votre besoin ?',
      'Je vous écoute 🙂. Donnez-moi plus de détails pour que je vous aide rapidement.',
      'Bien reçu ✅. Quel est l’objectif exact ?',
    ];
  }, [lastInbound]);

  const onCopyTemplate = async (t: Template) => {
    await navigator.clipboard.writeText(t.body);
    setCopiedTemplateId(t.id);
    setTimeout(() => setCopiedTemplateId(null), 900);
  };

  const onInsertTemplate = (t: Template) => {
    // insert directly in input (UX “pro”)
    setInput(t.body);
    setTemplatesOpen(false);
  };

  const onUseAi = (text: string) => {
    setInput(text);
    setAiOpen(false);
  };

  const onAddTag = () => {
    // mock action
    alert('Mock: add tag to conversation (soon: select + save)');
  };

  const onViewOrder = () => {
    // mock “order card” inserted in chat
    addMessage('🧾 Récap commande: #1234 — 89 TND\nStatut: Delivered ✅');
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 px-4 flex items-center justify-between bg-white flex-shrink-0">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{convo?.contact?.name || 'Conversation'}</div>
          <div className="text-xs text-gray-500 truncate">{convo?.contact?.phone}</div>
        </div>

        <div className="flex items-center gap-2">
          {convo?.status && (
            <span
              className={cn(
                'text-xs px-2 py-1 rounded-full border',
                convo.status === 'open'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              )}
            >
              {convo.status}
            </span>
          )}
          {convo?.aiIntent && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {convo.aiIntent}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm',
              msg.direction === 'in'
                ? 'bg-white border border-gray-200 mr-auto'
                : 'bg-whatsapp-light ml-auto border border-green-100'
            )}
          >
            <p className="whitespace-pre-wrap">{msg.content?.body}</p>

            <div className="flex items-center justify-end gap-1 mt-2">
              <span className="text-[10px] text-gray-400">
                {format(new Date(msg.createdAt), 'HH:mm')}
              </span>
              {msg.direction === 'out' && <StatusIcon status={msg.status} />}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Action Bar */}
      <div className="border-t border-gray-200 bg-white px-3 py-2 flex items-center gap-2 flex-wrap flex-shrink-0">
        <ActionButton icon={FileText} label="Templates" onClick={() => setTemplatesOpen(true)} />
        <ActionButton icon={Sparkles} label="AI reply" onClick={() => setAiOpen(true)} />
        <ActionButton icon={Tag} label="Add tag" onClick={onAddTag} />
        <ActionButton icon={ShoppingBag} label="View order" onClick={onViewOrder} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter new line)"
            rows={1}
            className="flex-1 resize-none border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-whatsapp-green"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 bg-whatsapp-green text-white rounded-2xl hover:bg-whatsapp-dark disabled:opacity-50 transition-colors"
            title="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>

      {/* Templates Drawer */}
      {templatesOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setTemplatesOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[420px] bg-white border-l border-gray-200 shadow-xl flex flex-col">
            <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Templates</div>
                <div className="text-xs text-gray-500">Click “Insert” to fill the message</div>
              </div>
              <button
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
                onClick={() => setTemplatesOpen(false)}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {TEMPLATES.map((t) => (
                <div key={t.id} className="border border-gray-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{t.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                          {t.category}
                        </span>
                        {t.tags.slice(0, 2).map((x) => (
                          <span
                            key={x}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            {x}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onCopyTemplate(t)}
                      className="h-9 px-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs flex items-center gap-2"
                      title="Copy"
                    >
                      {copiedTemplateId === t.id ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      Copy
                    </button>
                  </div>

                  <div className="mt-3 text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-2xl p-3">
                    {t.body}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onInsertTemplate(t)}
                      className="h-9 px-4 rounded-xl bg-whatsapp-green text-white text-sm font-medium hover:bg-whatsapp-dark transition-colors"
                    >
                      Insert
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
              Next: variables editor + saved templates per brand + approval workflow ✅
            </div>
          </div>
        </div>
      )}

      {/* AI Reply Modal */}
      {aiOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20" onClick={() => setAiOpen(false)} />
          <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[720px] max-w-[92vw] bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="h-14 px-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">AI reply (mock)</div>
                <div className="text-xs text-gray-500">Pick one suggestion to fill the message</div>
              </div>
              <button
                className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center"
                onClick={() => setAiOpen(false)}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {aiSuggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onUseAi(s)}
                  className="w-full text-left border border-gray-200 rounded-2xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-sm whitespace-pre-wrap">{s}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    Click to use
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
              Next: tone selector (pro/friendly/short) + auto-fill variables (order_id, amount, carrier).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-10 px-3 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm flex items-center gap-2"
    >
      <Icon className="w-4 h-4 text-gray-700" />
      <span>{label}</span>
    </button>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'pending':
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
