'use client';

import { create } from 'zustand';

/* =========================
   TYPES
========================= */
export interface Conversation {
  id: string;
  contact: { id: string; name: string; phone: string };
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  assignee?: { id: string; name: string };
  aiIntent?: string;
  aiSummary?: string;
}

export interface Message {
  id: string;
  direction: 'in' | 'out';
  type: 'text';
  content: { body: string };
  status: 'sent' | 'delivered' | 'read';
  createdAt: string;
  sender?: { name: string };
}

/* =========================
   MOCK MODE
========================= */
const MOCK_MODE = true;

/* =========================
   MOCK DATA
========================= */
const mockConversations: Conversation[] = [
  {
    id: 'conv_1',
    contact: { id: 'c1', name: 'Amira Ben Salah', phone: '+21622123456' },
    status: 'open',
    lastMessageAt: new Date().toISOString(),
    unreadCount: 2,
    aiIntent: 'order_issue',
    aiSummary: 'Problème avec une commande',
  },
  {
    id: 'conv_2',
    contact: { id: 'c2', name: 'Mehdi Trabelsi', phone: '+21655987111' },
    status: 'closed',
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    unreadCount: 0,
    aiIntent: 'thanks',
    aiSummary: 'Client satisfait',
  },
];

const mockMessages: Record<string, Message[]> = {
  conv_1: [
    {
      id: 'm1',
      direction: 'in',
      type: 'text',
      content: { body: 'Bonjour, j’ai un problème avec ma commande.' },
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      sender: { name: 'Amira' },
    },
    {
      id: 'm2',
      direction: 'out',
      type: 'text',
      content: { body: 'Bonjour Amira 👋 pouvez-vous me donner votre numéro de commande ?' },
      status: 'delivered',
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    },
  ],
  conv_2: [
    {
      id: 'm3',
      direction: 'out',
      type: 'text',
      content: { body: 'Merci pour votre retour 🙏' },
      status: 'read',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
  ],
};

/* =========================
   STORE
========================= */
interface InboxState {
  conversations: Conversation[];
  selectedConversationId: string | null;
  messages: Message[];
  loading: boolean;

  // Draft shared between panels
  composerDraft: string;

  selectConversation: (id: string | null) => void;
  addMessage: (body: string) => void;

  setComposerDraft: (text: string) => void;
  appendComposerDraft: (text: string) => void;
  clearComposerDraft: () => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
  conversations: MOCK_MODE ? mockConversations : [],
  selectedConversationId: null,
  messages: [],
  loading: false,

  composerDraft: '',

  selectConversation: (id) => {
    if (!id) {
      set({ selectedConversationId: null, messages: [], composerDraft: '' });
      return;
    }

    if (MOCK_MODE) {
      set({
        selectedConversationId: id,
        messages: mockMessages[id] || [],
        composerDraft: '',
      });
    }
  },

  addMessage: (body: string) => {
    if (!MOCK_MODE) return;

    const state = get();
    if (!state.selectedConversationId) return;

    const newMessage: Message = {
      id: Math.random().toString(36).slice(2),
      direction: 'out',
      type: 'text',
      content: { body },
      status: 'sent',
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...state.messages, newMessage],
      composerDraft: '',
    });
  },

  setComposerDraft: (text) => set({ composerDraft: text }),
  appendComposerDraft: (text) =>
    set((s) => ({ composerDraft: s.composerDraft ? `${s.composerDraft}\n\n${text}` : text })),
  clearComposerDraft: () => set({ composerDraft: '' }),
}));