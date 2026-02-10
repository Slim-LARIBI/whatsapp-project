"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ShoppingBag, CreditCard, Package, Flame, Tag, TrendingUp } from "lucide-react";

export default function CustomerCommercePanel() {
  const lastOrder = {
    id: "1234",
    total: 89,
    currency: "TND",
    status: "Delivered",
    date: "2026-02-09",
    items: [
      { name: "Hydrating Serum", qty: 1, price: 39 },
      { name: "SPF 50 Sunscreen", qty: 1, price: 50 },
    ],
  };

  const clv = { totalSpent: 420, orders: 7, aov: 60, segment: "VIP" };

  const abandonedCart = {
    updatedAt: "Today",
    items: [
      { name: "Cleansing Gel", qty: 1, price: 25 },
      { name: "Moisturizer", qty: 1, price: 34 },
    ],
    total: 59,
    currency: "TND",
  };

  const suggestions = [
    { title: "Cross-sell", badge: "Best match", desc: "Add: Travel-size kit (-10%)", icon: TrendingUp },
    { title: "Upsell", badge: "High intent", desc: "Upgrade to bundle (save 12%)", icon: Flame },
    { title: "Promo", badge: "Active", desc: "Code SAVE10 until 2026-02-28", icon: Tag },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">Commerce</div>
          <div className="text-xs text-gray-500 truncate">Mock panel · API-ready</div>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
          Mock
        </span>
      </div>

      <Card title="Customer value" icon={CreditCard}>
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Total spent" value={`${clv.totalSpent} TND`} />
          <Stat label="Orders" value={`${clv.orders}`} />
          <Stat label="AOV" value={`${clv.aov} TND`} />
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Segment: <span className="font-medium">{clv.segment}</span>
        </div>
      </Card>

      <Card title={`Last order #${lastOrder.id}`} icon={ShoppingBag}>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{lastOrder.date}</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 border text-gray-700">{lastOrder.status}</span>
        </div>

        <div className="mt-3 space-y-2">
          {lastOrder.items.map((it) => (
            <div key={it.name} className="flex items-center justify-between text-sm">
              <div className="truncate">
                <span className="font-medium">{it.qty}×</span> {it.name}
              </div>
              <div className="text-gray-700">{it.price} TND</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-sm font-semibold">{lastOrder.total} {lastOrder.currency}</div>
        </div>
      </Card>

      <Card title="Abandoned cart" icon={Package}>
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Updated: {abandonedCart.updatedAt}</span>
          <span className="px-2 py-0.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-800">Hot</span>
        </div>

        <div className="mt-3 space-y-2">
          {abandonedCart.items.map((it) => (
            <div key={it.name} className="flex items-center justify-between text-sm">
              <div className="truncate">
                <span className="font-medium">{it.qty}×</span> {it.name}
              </div>
              <div className="text-gray-700">{it.price} TND</div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <div className="text-xs text-gray-500">Total</div>
          <div className="text-sm font-semibold">{abandonedCart.total} {abandonedCart.currency}</div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className="rounded-lg border px-3 py-2 text-xs hover:bg-gray-50">
            Send reminder (mock)
          </button>
          <button className="rounded-lg bg-green-600 text-white px-3 py-2 text-xs hover:bg-green-700">
            Offer discount (mock)
          </button>
        </div>
      </Card>

      <Card title="Suggestions" icon={Flame}>
        <div className="space-y-2">
          {suggestions.map((s) => {
            const I = s.icon;
            return (
              <div key={s.title} className="flex gap-3 rounded-xl border p-3 hover:bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                  <I size={18} className="text-gray-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{s.title}</div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border text-gray-700">{s.badge}</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-0.5">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-4 py-3 border-b flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center">
          <Icon size={16} className="text-gray-700" />
        </div>
        <div className="text-sm font-semibold">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("rounded-xl border bg-gray-50 px-3 py-2")}>
      <div className="text-[11px] text-gray-500">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}