'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConversationDetail } from '@/components/inbox/conversation-detail';
import { useInboxStore } from '@/store/inbox-store';
import { cn } from '@/lib/utils';

import ResizablePanels from '@/components/ux/resizable-panels';
import ConversationListPro from '@/components/inbox/conversation-list-pro';
import ConversationViewPro from '@/components/inbox/conversation-view-pro';
import CustomerCommercePanel from '@/components/ecommerce/customer-commerce-panel';

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

type RightTab = 'profile' | 'commerce';

export default function InboxPage() {
  const params = useSearchParams();
  const tpl = params.get('tpl');
  const deepId = params.get('id');

  const {
    conversations,
    selectedConversationId,
    selectConversation,
    setComposerDraft,
    appendComposerDraft,
  } = useInboxStore();

  const [rightTab, setRightTab] = useState<RightTab>('profile');

  const templateText = useMemo(() => {
    if (!tpl) return '';
    return TEMPLATE_LIBRARY[tpl] || '';
  }, [tpl]);

  // Deep link: /inbox?id=conv_1
  useEffect(() => {
    if (!deepId || !Array.isArray(conversations) || conversations.length === 0) return;
    const exists = conversations.find((c: any) => c.id === deepId);
    if (exists && selectedConversationId !== deepId) selectConversation(deepId);
  }, [deepId, conversations, selectedConversationId, selectConversation]);

  // Template injection into composer
  useEffect(() => {
    if (!tpl || !templateText) return;

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

    setComposerDraft('');
    appendComposerDraft(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tpl, templateText]);

  const RightPanel = (
    <div className="h-full">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="p-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Context</div>
          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-100 border text-gray-700">UX v2</span>
        </div>
        <div className="px-3 pb-3 flex gap-2">
          <button
            onClick={() => setRightTab('profile')}
            className={cn(
              'text-xs px-3 py-2 rounded-xl border transition',
              rightTab === 'profile'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
            )}
          >
            Profile
          </button>
          <button
            onClick={() => setRightTab('commerce')}
            className={cn(
              'text-xs px-3 py-2 rounded-xl border transition',
              rightTab === 'commerce'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
            )}
          >
            Commerce
          </button>
        </div>
      </div>

      <div className="p-0">
        {rightTab === 'profile' ? (
          selectedConversationId ? (
            <ConversationDetail conversationId={selectedConversationId} />
          ) : (
            <div className="p-4 text-sm text-gray-500">Select a conversation to view profile.</div>
          )
        ) : (
          <CustomerCommercePanel />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <ResizablePanels
        leftWidth="w-96"
        left={<ConversationListPro />}
        center={
          selectedConversationId ? (
            <ConversationViewPro conversationId={selectedConversationId} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a conversation
            </div>
          )
        }
        right={RightPanel}
      />
    </div>
  );
}