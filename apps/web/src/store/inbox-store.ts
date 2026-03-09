'use client';

import { create } from 'zustand';
import { api } from '@/lib/api';

/* =========================
   TYPES
========================= */
export interface Conversation {
  id: string;
  contact?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    tags?: string[];
    optInStatus?: 'opted_in' | 'opted_out' | 'pending';
  };
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  assignee?: { id: string; name: string };
  aiIntent?: string;
  aiSummary?: string;
  segments?: string[];
}

export interface Message {
  id: string;
  direction: 'in' | 'out' | 'inbound' | 'outbound';
  type: 'text';
  content: { body?: string; text?: string };
  status: 'queued' | 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  createdAt: string;
  sender?: { name: string };
}

interface InboxState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  loading: boolean;
  loadingMessages: boolean;
  usingMock: boolean;

  composerDraft: string;

  bootstrap: () => Promise<void>;
  refreshConversations: () => Promise<void>;
  selectConversation: (id: string | null) => Promise<void>;
  sendMessage: (body: string) => Promise<void>;

  setComposerDraft: (text: string) => void;
  appendComposerDraft: (text: string) => void;
  clearComposerDraft: () => void;
}

function normalizeConversation(raw: any): Conversation {
  return {
    id: raw.id,
    contact: raw.contact
      ? {
          id: raw.contact.id,
          name: raw.contact.name || raw.contact.phone || 'Unknown',
          phone: raw.contact.phone || '',
          email: raw.contact.email,
          tags: raw.contact.tags || [],
          optInStatus: raw.contact.optInStatus || 'pending',
        }
      : undefined,
    status: raw.status || 'open',
    lastMessageAt: raw.lastMessageAt || raw.updatedAt || raw.createdAt || new Date().toISOString(),
    unreadCount: raw.unreadCount || 0,
    assignee: raw.assignee
      ? {
          id: raw.assignee.id,
          name: raw.assignee.name || raw.assignee.email || 'Agent',
        }
      : undefined,
    aiIntent: raw.aiIntent,
    aiSummary: raw.aiSummary,
    segments: raw.segments || [],
  };
}

function normalizeMessage(raw: any): Message {
  return {
    id: raw.id,
    direction: raw.direction,
    type: raw.type || 'text',
    content: raw.content || { body: '' },
    status: raw.status || 'sent',
    createdAt: raw.createdAt || new Date().toISOString(),
    sender: raw.sender,
  };
}

export const useInboxStore = create<InboxState>((set, get) => ({
  conversations: [],
  selectedConversationId: null,
  messages: [],
  loading: false,
  loadingMessages: false,
  usingMock: false,

  composerDraft: '',

  bootstrap: async () => {
    await get().refreshConversations();
  },

  refreshConversations: async () => {
    set({ loading: true, usingMock: false });

    try {
      const res = await api.getConversations();
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const conversations = rows.map(normalizeConversation);

      set((state) => {
        const selectedConversationId =
          state.selectedConversationId && conversations.some((c) => c.id === state.selectedConversationId)
            ? state.selectedConversationId
            : conversations[0]?.id || null;

        return {
          conversations,
          selectedConversationId,
          loading: false,
          usingMock: false,
        };
      });

      const selectedId = get().selectedConversationId;
      if (selectedId) {
        await get().selectConversation(selectedId);
      } else {
        set({ messages: [] });
      }
    } catch (error) {
      console.error('refreshConversations failed', error);
      set({
        conversations: [],
        selectedConversationId: null,
        messages: [],
        loading: false,
        usingMock: true,
      });
    }
  },

  selectConversation: async (id) => {
    if (!id) {
      set({ selectedConversationId: null, messages: [], composerDraft: '' });
      return;
    }

    set({
      selectedConversationId: id,
      loadingMessages: true,
      composerDraft: '',
    });

    try {
      const res = await api.getConversationMessages(id);
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const messages = rows.map(normalizeMessage);

      set({
        messages,
        loadingMessages: false,
      });
    } catch (error) {
      console.error('selectConversation / getConversationMessages failed', error);
      set({
        messages: [],
        loadingMessages: false,
      });
    }
  },

  sendMessage: async (body: string) => {
    const state = get();
    const conversationId = state.selectedConversationId;
    if (!conversationId || !body.trim()) return;

    const optimisticMessage: Message = {
      id: `tmp_${Date.now()}`,
      direction: 'outbound',
      type: 'text',
      content: { body },
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...state.messages, optimisticMessage],
      composerDraft: '',
    });

    try {
      await api.sendConversationMessage(conversationId, { body });

      // recharge les messages réels + conversations
      await get().selectConversation(conversationId);
      await get().refreshConversations();
    } catch (error) {
      console.error('sendMessage failed', error);

      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === optimisticMessage.id ? { ...m, status: 'failed' } : m,
        ),
      }));
    }
  },

  setComposerDraft: (text) => set({ composerDraft: text }),

  appendComposerDraft: (text) =>
    set((s) => ({
      composerDraft: s.composerDraft ? `${s.composerDraft}\n\n${text}` : text,
    })),

  clearComposerDraft: () => set({ composerDraft: '' }),
}));