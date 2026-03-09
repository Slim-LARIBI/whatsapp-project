'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationView } from '@/components/inbox/conversation-view';
import { ConversationDetail } from '@/components/inbox/conversation-detail';
import { useInboxStore } from '@/store/inbox-store';

const TEMPLATE_LIBRARY: Record<string, string> = {
  order_confirmation:
    "Bonjour {{first_name}} 👋\n\n✅ Votre commande #{{order_id}} est confirmée.\nMontant : {{amount}} {{currency}}\n\nSouhaitez-vous recevoir le statut de livraison ?",
  shipping_update:
    "Bonjour {{first_name}} 👋\n\n🚚 Votre commande #{{order_id}} est en cours de livraison.\nTransporteur : {{carrier}}\nSuivi : {{tracking_url}}\n\nPuis-je vous aider avec autre chose ?",
  cross_sell_skincare:
    "Hello {{first_name}} ✨\n\nOn vous recommande : {{product_name}} ({{price}})\n👉 {{url}}\n\nSouhaitez-vous que je vous propose d'autres best-sellers ?",
  promo_10:
    "Bonjour {{first_name}} 🎁\n\n-10% avec le code {{code}} (jusqu’au {{ends_at}})\n👉 {{url}}\n\nVoulez-vous des recommandations adaptées à votre besoin ?",
  support_followup:
    "Bonjour {{first_name}} 👋\n\nJe reviens vers vous pour confirmer que tout est bon.\nAvez-vous besoin d’aide sur autre chose ?",
};

export default function InboxClient() {
  const params = useSearchParams();
  const tpl = params.get('tpl');

  const {
    conversations,
    selectedConversationId,
    selectConversation,
    setComposerDraft,
    appendComposerDraft,
    bootstrap,
  } = useInboxStore();

    useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const selectedConversation = useMemo(() => {
    if (!selectedConversationId) return undefined;
    return conversations.find((c) => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const templateText = useMemo(() => {
    if (!tpl) return '';
    return TEMPLATE_LIBRARY[tpl] || '';
  }, [tpl]);

  // Empêche de ré-injecter le même template en boucle
  const appliedKeyRef = useRef<string>('');

  useEffect(() => {
    if (!tpl || !templateText) return;

    // 1) Toujours sélectionner une conversation d'abord (sinon le draft se fait écraser)
    if (!selectedConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
      return; // on revient au prochain render avec un selectedConversationId
    }

    // 2) Si pas de conversation sélectionnée, rien à faire
    if (!selectedConversationId) return;

    // 3) Bloquer la ré-injection si déjà appliquée pour (tpl + conversationId)
    const key = `${selectedConversationId}__${tpl}`;
    if (appliedKeyRef.current === key) return;
    appliedKeyRef.current = key;

    // DEMO DATA SAFE (aucun problème TypeScript)
    const firstName =
      selectedConversation?.contact?.name?.split(' ')[0] ?? 'Client';

    const orderId = '1234';
    const amount = '89';
    const currency = 'TND';
    const carrier = 'Aramex';
    const trackingUrl = 'https://tracking.example/1234';
    const productName = 'Hydrating Serum';
    const price = '39 TND';
    const url = 'https://shop.example/product';
    const code = 'SAVE10';
    const endsAt = '2026-02-28';

    const filled = templateText
      .replaceAll('{{first_name}}', firstName)
      .replaceAll('{{order_id}}', orderId)
      .replaceAll('{{amount}}', amount)
      .replaceAll('{{currency}}', currency)
      .replaceAll('{{carrier}}', carrier)
      .replaceAll('{{tracking_url}}', trackingUrl)
      .replaceAll('{{product_name}}', productName)
      .replaceAll('{{price}}', price)
      .replaceAll('{{url}}', url)
      .replaceAll('{{code}}', code)
      .replaceAll('{{ends_at}}', endsAt);

    // 4) Injection finale (nettoie + ajoute)
    setComposerDraft('');
    // petit "tick" pour passer après les updates UI (MVP robuste)
    queueMicrotask(() => appendComposerDraft(filled));
  }, [
    tpl,
    templateText,
    conversations,
    selectedConversationId,
    selectedConversation,
    selectConversation,
    setComposerDraft,
    appendComposerDraft,
  ]);

  return (
    <>
      <div className="w-96 border-r border-gray-200 flex flex-col">
        <ConversationList />
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <ConversationView conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Select a conversation
          </div>
        )}
      </div>

      {selectedConversationId && (
        <div className="w-96 border-l border-gray-200">
          <ConversationDetail conversationId={selectedConversationId} />
        </div>
      )}
    </>
  );
}