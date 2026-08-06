/**
 * Vercel Serverless Function: api/webhook
 *
 * Rota legada usada pela IronPay quando o postback aponta para /api/webhook.
 * Compartilha exatamente a mesma lógica de Purchase de api/ironpay/webhook
 * (via api/_meta-purchase.js), para que PIX e cartão nunca divirjam.
 */

import { sendPurchaseToMeta, normalizeIronpayPayload, isPaidStatus } from './_meta-purchase.js';

const LOG = '[api/webhook]';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const xtrackyToken = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl = 'https://api.xtracky.com/api/integrations/api';

async function saveEventToSupabase(eventName, capiEvent, capiResponse) {
  if (!SUPABASE_KEY || !capiEvent) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/meta_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_name: eventName,
        event_id: capiEvent.event_id || null,
        event_time: capiEvent.event_time,
        source_url: capiEvent.event_source_url || null,
        email_hash: capiEvent.user_data?.em || null,
        phone_hash: capiEvent.user_data?.ph || null,
        custom_data: capiEvent.custom_data || null,
        capi_response: capiResponse || null,
        action_source: capiEvent.action_source || 'website',
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`${LOG} Supabase save error:`, err.message);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  console.log(`${LOG} ROTA EXECUTADA em ${new Date().toISOString()}`);

  try {
    const raw = req.body || {};
    const payload = normalizeIronpayPayload(raw);
    console.log(`${LOG} Payload recebido:`, JSON.stringify(raw));

    const statusOriginal = payload.status || raw.status || raw.event || 'pending';
    const isPaid = isPaidStatus(statusOriginal) || isPaidStatus(raw.event?.split('.').pop());
    const transactionId = payload.id || payload.transaction_id;
    const metaEventId = payload.meta_event_id || payload.metadata?.meta_event_id || null;

    // 1. xTracky (inalterado)
    const xtrackyPayload = {
      token: xtrackyToken,
      orderId: transactionId || 'IRONPAY-' + Date.now(),
      amount: payload.amount ? payload.amount / 100 : 0,
      status: isPaid ? 'paid' : statusOriginal || 'pending',
      customer: {
        email: payload.customer?.email || '',
        phone: payload.customer?.phone_number || payload.customer?.phone || '',
        document: payload.customer?.document || '',
      },
      raw_payload: payload,
    };

    fetch(xtrackyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xtrackyPayload),
    }).catch((err) => console.error(`${LOG} Erro xTracky:`, err.message));

    // 2. Meta CAPI Purchase
    let purchase = { sent: false, ok: false, skipped: true };
    if (isPaid) {
      purchase = await sendPurchaseToMeta(payload, {
        logPrefix: LOG,
        metaEventId,
        client_ip_address:
          req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || '',
        client_user_agent: req.headers['user-agent'] || 'Mozilla/5.0',
      });

      if (purchase.capiEvent) {
        await saveEventToSupabase('Purchase', purchase.capiEvent, purchase.response || { error: purchase.error });
      }

      if (!purchase.ok) {
        console.error(`${LOG} Purchase NÃO contabilizado pelo Meta:`, purchase.error || 'motivo desconhecido');
      }
    } else {
      console.log(`${LOG} Pagamento não confirmado (${statusOriginal}) — Purchase não enviado.`);
    }

    return res.status(200).json({
      received: true,
      status: statusOriginal,
      is_paid: isPaid,
      meta_capi_purchase: purchase.ok === true,
      meta_capi_event_id: purchase.event_id || null,
      meta_capi_error: purchase.ok ? null : purchase.error || null,
    });
  } catch (error) {
    console.error(`${LOG} Erro fatal:`, error.message, error.stack);
    return res.status(500).json({ error: error.message });
  }
}
