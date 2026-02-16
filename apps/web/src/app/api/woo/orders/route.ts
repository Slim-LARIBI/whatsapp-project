import { NextResponse } from "next/server";

export const runtime = "nodejs"; // important (évite edge)

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

// GET /api/woo/orders?phone=+21622123456&limit=5
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phone = (url.searchParams.get("phone") || "").trim();
    const limit = Math.min(Number(url.searchParams.get("limit") || 5), 20);

    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "Missing phone param" },
        { status: 400 }
      );
    }

    const baseUrl = getEnv("WOOCOMMERCE_BASE_URL").replace(/\/$/, "");
    const ck = getEnv("WOOCOMMERCE_CONSUMER_KEY");
    const cs = getEnv("WOOCOMMERCE_CONSUMER_SECRET");

    // Woo v3 orders endpoint
    const endpoint = `${baseUrl}/wp-json/wc/v3/orders`;

    // ✅ QUICK WIN: search par téléphone (marche sur beaucoup de sites)
    // Sinon on basculera en A2 (endpoint custom WP)
    const params = new URLSearchParams({
      per_page: String(limit),
      orderby: "date",
      order: "desc",
      search: phone,
    });

    const auth = Buffer.from(`${ck}:${cs}`).toString("base64");

    const r = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const raw = await r.text();
    if (!r.ok) {
      return NextResponse.json(
        { ok: false, error: `Woo error ${r.status}`, details: raw },
        { status: 502 }
      );
    }

    const data = JSON.parse(raw);

    // Normalisation légère pour ton UI
    const orders = Array.isArray(data)
      ? data.map((o: any) => ({
          id: o.id,
          number: o.number,
          status: o.status,
          currency: o.currency,
          total: o.total,
          date_created: o.date_created,
          payment_method_title: o.payment_method_title,
          billing: {
            first_name: o.billing?.first_name,
            last_name: o.billing?.last_name,
            phone: o.billing?.phone,
            email: o.billing?.email,
          },
          line_items: (o.line_items || []).slice(0, 5).map((li: any) => ({
            id: li.id,
            name: li.name,
            quantity: li.quantity,
            total: li.total,
          })),
        }))
      : [];

    return NextResponse.json({ ok: true, phone, orders });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}