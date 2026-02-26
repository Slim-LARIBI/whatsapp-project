import { NextResponse } from 'next/server';

const WOO_BASE_URL = process.env.WOO_BASE_URL; // ex: https://tonsite.com
const WOO_CONSUMER_KEY = process.env.WOO_CONSUMER_KEY;
const WOO_CONSUMER_SECRET = process.env.WOO_CONSUMER_SECRET;

function normalizePhone(p: string) {
  // garde chiffres + +
  return (p || '').trim().replace(/[^\d+]/g, '');
}

function basicAuthHeader(key: string, secret: string) {
  const token = Buffer.from(`${key}:${secret}`).toString('base64');
  return `Basic ${token}`;
}

async function wooFetch(path: string) {
  if (!WOO_BASE_URL || !WOO_CONSUMER_KEY || !WOO_CONSUMER_SECRET) {
    throw new Error('Missing Woo env vars (WOO_BASE_URL / WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET)');
  }

  const url = `${WOO_BASE_URL.replace(/\/$/, '')}/wp-json/wc/v3${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: basicAuthHeader(WOO_CONSUMER_KEY, WOO_CONSUMER_SECRET),
      'Content-Type': 'application/json',
    },
    // important pour next build cache
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Woo API error ${res.status}: ${txt}`);
  }

  return res.json();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phoneRaw = searchParams.get('phone') || '';
    const phone = normalizePhone(phoneRaw);

    if (!phone) {
      return NextResponse.json({ ok: false, error: 'Missing phone' }, { status: 400 });
    }

    // 1) chercher client par search (pas parfait mais ok MVP)
    // Woo: /customers?search=... ne filtre pas strictement billing.phone
    // MVP: on récupère une page et on match sur billing.phone.
    const customers = await wooFetch(`/customers?per_page=100&search=${encodeURIComponent(phone)}`);

    const matched =
      (customers || []).find((c: any) => normalizePhone(c?.billing?.phone) === phone) ||
      (customers || []).find((c: any) => normalizePhone(c?.shipping?.phone) === phone);

    if (!matched) {
      return NextResponse.json({
        ok: true,
        found: false,
        phone,
      });
    }

    const customerId = matched.id;

    // 2) dernière commande du client
    const orders = await wooFetch(
      `/orders?customer=${customerId}&per_page=1&orderby=date&order=desc`,
    );

    const last = orders?.[0];

    const payload = {
      ok: true,
      found: true,
      customer: {
        id: matched.id,
        first_name: matched.first_name || matched?.billing?.first_name || '',
        last_name: matched.last_name || matched?.billing?.last_name || '',
        phone: matched?.billing?.phone || matched?.shipping?.phone || phone,
        email: matched.email || matched?.billing?.email || '',
      },
      last_order: last
        ? {
            id: last.id,
            status: last.status,
            total: last.total,
            currency: last.currency,
            date_created: last.date_created,
            payment_method: last.payment_method_title,
            shipping_total: last.shipping_total,
            line_items: (last.line_items || []).map((li: any) => ({
              product_id: li.product_id,
              name: li.name,
              quantity: li.quantity,
              total: li.total,
              price: li.price,
              sku: li.sku,
            })),
          }
        : null,
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}