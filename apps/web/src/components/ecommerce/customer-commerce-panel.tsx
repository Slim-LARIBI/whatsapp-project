"use client";

import { useEffect, useMemo, useState } from "react";
import { useInboxStore } from "@/store/inbox-store";
import { ShoppingBag, CreditCard, Truck, AlertTriangle } from "lucide-react";

type WooOrder = {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  date_created: string;
  payment_method_title?: string;
  billing?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
  };
  line_items: { id: number; name: string; quantity: number; total: string }[];
};

function money(total: string, currency: string) {
  const n = Number(total || 0);
  if (Number.isNaN(n)) return `${total} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

export default function CustomerCommercePanel() {
  const selectedConversationId = useInboxStore((s: any) => s.selectedConversationId);
  const conversations = useInboxStore((s: any) => s.conversations);

  const convo = useMemo(() => {
    return (conversations || []).find((c: any) => c.id === selectedConversationId);
  }, [conversations, selectedConversationId]);

  const phone = convo?.contact?.phone || "";
  const name = convo?.contact?.name || "Customer";

  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<WooOrder[]>([]);
  const [error, setError] = useState<string>("");

  // ✅ Mock fallback (si Woo ne renvoie rien)
  const mockOrders: WooOrder[] = [
    {
      id: 1001,
      number: "1234",
      status: "completed",
      currency: "TND",
      total: "89",
      date_created: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      payment_method_title: "Card",
      billing: { first_name: "Amira", phone },
      line_items: [
        { id: 1, name: "Shampoo", quantity: 1, total: "25" },
        { id: 2, name: "Serum", quantity: 1, total: "64" },
      ],
    },
  ];

  useEffect(() => {
    if (!phone) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = await fetch(`/api/woo/orders?phone=${encodeURIComponent(phone)}&limit=5`, {
          cache: "no-store",
        });
        const j = await r.json();

        if (cancelled) return;

        if (!r.ok || !j?.ok) {
          // On garde un mode safe : pas de crash, juste fallback mock
          setError("Woo backend indisponible → fallback mock.");
          setOrders(mockOrders);
          return;
        }

        const list: WooOrder[] = Array.isArray(j.orders) ? j.orders : [];
        // si Woo renvoie 0, fallback mock (le temps d’avoir A2)
        setOrders(list.length ? list : mockOrders);
      } catch (e: any) {
        if (cancelled) return;
        setError("Fetch Woo failed → fallback mock.");
        setOrders(mockOrders);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Commerce</div>
          <div className="text-xs text-gray-500">
            {name} · <span className="font-mono">{phone || "No phone"}</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">{loading ? "Loading..." : ""}</div>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 flex items-start gap-2">
          <AlertTriangle size={14} className="mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ShoppingBag size={16} />
          Recent orders
        </div>

        <div className="mt-3 space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Order #{o.number}</div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  {o.status}
                </span>
              </div>

              <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <CreditCard size={12} /> {o.payment_method_title || "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Truck size={12} /> {new Date(o.date_created).toLocaleDateString()}
                </span>
                <span className="font-semibold">{money(o.total, o.currency)}</span>
              </div>

              {o.line_items?.length ? (
                <div className="mt-2 text-xs text-gray-700">
                  <div className="font-medium mb-1">Items</div>
                  <ul className="space-y-1">
                    {o.line_items.map((li) => (
                      <li key={li.id} className="flex items-center justify-between">
                        <span className="truncate">{li.name} × {li.quantity}</span>
                        <span className="text-gray-600">{li.total}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        <div className="text-sm font-medium">CLV (mock)</div>
        <div className="mt-1 text-xs text-gray-600">
          Orders: <b>{orders.length}</b> · Estimated CLV: <b>420 TND</b> · Segment: <b>Warm</b>
        </div>
      </div>
    </div>
  );
}