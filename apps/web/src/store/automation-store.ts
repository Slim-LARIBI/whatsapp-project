'use client';

import { create } from 'zustand';

export type TriggerType =
  | 'message_received'
  | 'cart_abandoned'
  | 'order_paid';

export type ConditionType =
  | 'is_vip'
  | 'cart_total_gt'
  | 'orders_count_gt';

export type ActionType =
  | 'send_template'
  | 'wait'
  | 'assign_agent'
  | 'add_tag';

interface AutomationState {
  trigger: TriggerType | '';
  conditions: { type: ConditionType; value?: number }[];
  actions: { type: ActionType; value?: string | number }[];

  setTrigger: (t: TriggerType) => void;
  addCondition: (c: { type: ConditionType; value?: number }) => void;
  addAction: (a: { type: ActionType; value?: string | number }) => void;
  reset: () => void;
}

export const useAutomationStore = create<AutomationState>((set) => ({
  trigger: '',
  conditions: [],
  actions: [],

  setTrigger: (trigger) => set({ trigger }),
  addCondition: (condition) =>
    set((s) => ({ conditions: [...s.conditions, condition] })),
  addAction: (action) =>
    set((s) => ({ actions: [...s.actions, action] })),
  reset: () => set({ trigger: '', conditions: [], actions: [] }),
}));