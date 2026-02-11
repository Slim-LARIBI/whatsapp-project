'use client';

import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationView } from '@/components/inbox/conversation-view';
import { ConversationDetail } from '@/components/inbox/conversation-detail';
import { useInboxStore } from '@/store/inbox-store';

export default function InboxPage() {
  const { selectedConversationId } = useInboxStore();

  return (
    <div className="flex h-full min-h-0">

      {/* LEFT COLUMN */}
      <div className="w-[340px] min-w-[300px] max-w-[380px] border-r border-gray-200 flex flex-col bg-white">
        <ConversationList />
      </div>

      {/* CENTER COLUMN */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
        {selectedConversationId ? (
          <ConversationView conversationId={selectedConversationId} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Select a conversation
          </div>
        )}
      </div>

      {/* RIGHT COLUMN */}
      {selectedConversationId && (
        <div className="w-[360px] min-w-[320px] border-l border-gray-200 bg-white overflow-y-auto">
          <ConversationDetail conversationId={selectedConversationId} />
        </div>
      )}
    </div>
  );
}