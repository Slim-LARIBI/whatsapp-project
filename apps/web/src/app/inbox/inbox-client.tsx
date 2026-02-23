'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationView } from '@/components/inbox/conversation-view';
import { ConversationDetail } from '@/components/inbox/conversation-detail';
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

export default function InboxClient() {
  const params = useSearchParams();
  const tpl = params.get('tpl');

  const templateText = useMemo(() => {
    if (!tpl) return null;
    return TEMPLATE_LIBRARY[tpl] ?? null;
  }, [tpl]);

  // TODO: si tu veux réellement injecter templateText quelque part,
  // il faut le brancher dans un store / un composant qui accepte cette valeur.
  void templateText;

  const { selectedConversationId } = useInboxStore();

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">
      <div className="w-[360px] border-r">
        <ConversationList />
      </div>

      <div className="flex-1">
        {selectedConversationId ? (
          <ConversationDetail conversationId={selectedConversationId} />
        ) : (
         <div className="p-6 text-sm text-gray-500">Sélectionnez une conversation</div>
        )}
      </div>
    </div>
  );
}
