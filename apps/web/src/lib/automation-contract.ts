// apps/web/src/lib/automation-contract.ts

export type TriggerKey =
  | 'order_paid'
  | 'shipping_update'
  | 'cart_abandoned'
  | 'manual_segment';

export type ConditionKey =
  | 'is_vip'
  | 'cart_total_gt'
  | 'order_total_gt'
  | 'country_eq'
  | 'consent_eq'
  | 'tag_contains'
  | 'customer_value_gt';

export type ActionKey =
  | 'send_template'
  | 'send_offer'
  | 'wait'
  | 'add_tag'
  | 'ai_reply';

export type ConsentStatus = 'opted_in' | 'opted_out' | 'pending';

export type AutomationStatus = 'draft' | 'active' | 'paused';

export interface AutomationCondition {
  key: ConditionKey;
  op: 'eq' | 'gt' | 'contains';
  value: string | number | boolean;
}

export interface ActionSendTemplate {
  key: 'send_template';
  templateId: string;
}

export interface ActionSendOffer {
  key: 'send_offer';
  offerId: string;
  discountPct?: number;
}

export interface ActionWait {
  key: 'wait';
  minutes: number;
}

export interface ActionAddTag {
  key: 'add_tag';
  tag: string;
}

export interface ActionAiReply {
  key: 'ai_reply';
  tone?: 'friendly' | 'pro' | 'short';
}

export type AutomationAction =
  | ActionSendTemplate
  | ActionSendOffer
  | ActionWait
  | ActionAddTag
  | ActionAiReply;

export interface AutomationV1 {
  version: 1;
  id: string;
  name: string;
  status: AutomationStatus;
  trigger: TriggerKey;

  /**
   * If empty -> always run
   */
  conditions: AutomationCondition[];

  /**
   * Executed in order
   */
  actions: AutomationAction[];

  createdAt: string;
  updatedAt: string;
}

/**
 * Helpers (mock catalog) — you can replace with API later
 */
export interface TemplateDef {
  id: string;
  name: string;
  category: 'Abandoned cart' | 'Order' | 'Shipping' | 'Promo' | 'Support';
  language: 'FR' | 'EN';
}

export interface OfferDef {
  id: string;
  name: string;
  priceTND: number;
  discountPct?: number;
}

export const MOCK_TEMPLATES: TemplateDef[] = [
  { id: 'tpl_ab_cart_reminder', name: 'Abandoned cart - reminder', category: 'Abandoned cart', language: 'FR' },
  { id: 'tpl_ab_cart_offer', name: 'Abandoned cart - offer -10%', category: 'Abandoned cart', language: 'FR' },
  { id: 'tpl_order_confirmation', name: 'Order confirmation', category: 'Order', language: 'FR' },
  { id: 'tpl_shipping_update', name: 'Shipping update', category: 'Shipping', language: 'FR' },
  { id: 'tpl_promo_flash', name: 'Promo flash', category: 'Promo', language: 'FR' },
  { id: 'tpl_support_generic', name: 'Support generic', category: 'Support', language: 'FR' },
];

export const MOCK_OFFERS: OfferDef[] = [
  { id: 'offer_spf50', name: 'SPF 50 Sunscreen', priceTND: 45, discountPct: 10 },
  { id: 'offer_serum', name: 'Hydrating Serum', priceTND: 39 },
  { id: 'offer_cleanser', name: 'Gentle Cleanser', priceTND: 29 },
];

/**
 * Factory
 */
export function createEmptyAutomation(overrides?: Partial<AutomationV1>): AutomationV1 {
  const now = new Date().toISOString();
  return {
    version: 1,
    id: overrides?.id ?? `auto_${Math.random().toString(36).slice(2, 10)}`,
    name: overrides?.name ?? 'New automation',
    status: overrides?.status ?? 'draft',
    trigger: overrides?.trigger ?? 'cart_abandoned',
    conditions: overrides?.conditions ?? [],
    actions: overrides?.actions ?? [],
    createdAt: overrides?.createdAt ?? now,
    updatedAt: overrides?.updatedAt ?? now,
  };
}