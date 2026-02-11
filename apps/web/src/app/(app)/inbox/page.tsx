'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationView } from '@/components/inbox/conversation-view';
import { ConversationDetail } from '@/components/inbox/conversation-detail';
import { useInboxStore } from '@/store/inbox-store';

/**
 * INBOX STABLE (SAFE)
 * - 3 colonnes FIXES
 * - Seule la zone messages scrolle (ConversationView gère déjà sticky header/composer)
 * - Ne casse pas templates drawer / AI reply
 */

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

    // auto-select first conversation if none selected
    if (!selectedConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }

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

    // push template into composer
    setComposerDraft('');
    appendComposerDraft(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, templateText]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* LEFT: conversations */}
      <aside className="w-[380px] shrink-0 border-r border-gray-200 bg-white overflow-hidden">
        <div className="h-full overflow-y-auto">
          <ConversationList />
        </div>
      </aside>

      {/* CENTER: chat */}
      <main className="flex-1 min-w-0 bg-white overflow-hidden">
        <div className="h-full flex flex-col overflow-hidden">
          {selectedConversationId ? (
            <ConversationView conversationId={selectedConversationId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation
            </div>
          )}
        </div>
      </main>

      {/* RIGHT: details */}
      <aside className="w-[380px] shrink-0 border-l border-gray-200 bg-white overflow-hidden">
        <div className="h-full overflow-y-auto">
          {selectedConversationId ? (
            <ConversationDetail conversationId={selectedConversationId} />
          ) : (
            <div className="p-4 text-sm text-gray-400">
              No conversation selected
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}