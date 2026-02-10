"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInboxStore } from "@/store/inbox-store";
import { ConversationView } from "@/components/inbox/conversation-view";

export default function ConversationViewPro({ conversationId }: { conversationId: string }) {
  const { appendComposerDraft } = useInboxStore();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => setTyping(false), 900);
    return () => clearTimeout(t);
  }, [conversationId]);

  const suggestions = useMemo(
    () => [
      "Bonjour 👋 pouvez-vous me partager votre numéro de commande ?",
      "Je vérifie ça tout de suite ✅. Pouvez-vous confirmer votre téléphone ?",
      "Je peux vous proposer une promo / alternative sur un produit similaire 🎁",
    ],
    []
  );

  return (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
      <div className="h-12 shrink-0 px-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="text-sm font-semibold flex items-center gap-2">
          <Sparkles size={16} className="text-green-700" />
          Smart Assistant (mock)
        </div>
        {typing && (
          <div className="text-xs text-gray-500">
            Client is typing<span className="animate-pulse">…</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ConversationView conversationId={conversationId} />
      </div>

      <div className="shrink-0 border-t border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-gray-700 flex items-center gap-2">
            <Wand2 size={14} className="text-gray-600" />
            Suggested replies (mock)
          </div>
          <div className="text-[10px] text-gray-500">Click to insert</div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => appendComposerDraft(s)}
              className={cn("text-xs px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50")}
              title="Insert into composer"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}