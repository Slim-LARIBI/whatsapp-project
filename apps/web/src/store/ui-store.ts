'use client';

import { create } from 'zustand';

type UiState = {
  inboxFocusMode: boolean;
  setInboxFocusMode: (v: boolean) => void;
  toggleInboxFocusMode: () => void;
};

const KEY = 'wa.ui.inboxFocusMode';

export const useUiStore = create<UiState>((set, get) => ({
  inboxFocusMode: false,

  setInboxFocusMode: (v) => {
    try {
      localStorage.setItem(KEY, v ? '1' : '0');
    } catch {}
    set({ inboxFocusMode: v });
  },

  toggleInboxFocusMode: () => {
    const next = !get().inboxFocusMode;
    try {
      localStorage.setItem(KEY, next ? '1' : '0');
    } catch {}
    set({ inboxFocusMode: next });
  },
}));

// Restore from localStorage (safe)
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === '1') useUiStore.setState({ inboxFocusMode: true });
  } catch {}
}