'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationView } from '@/components/inbox/conversation-view';
import { useInboxStore } from '@/store/inbox-store';

const TEMPLATE_LIBRARY: Record<string, string> = {
  order_confirmation:
    "Bonjour {{first_name}} 👋\n\n✅ Votre commande #{{order_id}} est confirmée.\nMontant : {{amount}} {{currency}}\n\nMerci pour votre confiance 🙏",
  shipping_update:
    "Bonjour {{first_name}} 👋\n\n🚚 Votre commande #{{order_id}} est en cours de livraison.\nTransporteur : {{carrier}}\nSuivi : {{tracking_url}}",
  cross_sell_skincare:
    "Hello {{first_name}} ✨\n\nOn vous recommande : {{product_name}} ({{price}})\n👉 {{url}}\n\nSouhaitez-vous que je vous l’ajoute à votre prochaine commande ?",
  promo_10:
    "Bonjour {{first_name}} 🎁\n\n-10% avec le code {{code}} (jusqu’au {{ends_at}})\n👉 {{url}}\n\nVoulez-vous des recommandations selon votre dernière commande ?",
  support_followup:
    "Bonjour {{first_name}} 👋\n\nJe reviens vers vous pour confirmer que tout est bon.\nAvez-vous besoin d’aide sur autre chose ?",
};

export default function InboxPage() {
  const params = useSearchParams();
  const tpl = params.get('tpl');

  const {
    conversations,
    selectedConversationId,
    selectConversation,
    setComposerDraft,
    appendComposerDraft,
  } = useInboxStore();

  const templateText = useMemo(() => {
    if (!tpl) return '';
    return TEMPLATE_LIBRARY[tpl] || '';
  }, [tpl]);

  useEffect(() => {
    if (!tpl || !templateText) return;

    // 1) auto-select first conversation if none selected
    if (!selectedConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }

    // 2) put template into composer (append to keep agent's draft if any)
    const filled = templateText
      .replaceAll('{{first_name}}', 'Amira')
      .replaceAll('{{order_id}}', '1234')
      .replaceAll('{{amount}}', '89')
      .replaceAll('{{currency}}', 'TND')
      .replaceAll('{{carrier}}', 'Aramex')
      .replaceAll('{{tracking_url}}', 'https://tracking.example/1234')
      .replaceAll('{{product_name}}', 'Hydrating Serum')
      .replaceAll('{{price}}', '39 TND')
      .replaceAll('{{url}}', 'https://shop.example/product')
      .replaceAll('{{code}}', 'SAVE10')
      .replaceAll('{{ends_at}}', '2026-02-28');

    setComposerDraft('');
    appendComposerDraft(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, templateText]);

  return (
    // IMPORTANT: lock the inbox area in a horizontal flex row and prevent page scroll jumps
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* LEFT: list (scrolls inside) */}
      <aside className="w-[380px] shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <ConversationList />
      </aside>

      {/* CENTER: conversation view (scrolls inside) */}
      <section className="flex-1 min-w-0 min-h-0 bg-white">
        <div className="h-full min-h-0 overflow-y-auto">
          {selectedConversationId ? (
            <ConversationView conversationId={selectedConversationId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a conversation
            </div>
          )}
        </div>
      </section>
    </div>
  );
}