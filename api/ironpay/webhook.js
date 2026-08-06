/**
 * Vercel Serverless Function: api/ironpay/webhook
 *
 * Recebe webhooks da IronPay (PIX e cartão) e:
 *  1. Registra a execução da rota (log de entrada sempre)
 *  2. Encaminha para xTracky (rastreamento)
 *  3. Dispara o Purchase na API de Conversões do Meta quando o pagamento é
 *     confirmado — via api/_meta-purchase.js (fonte única do Purchase)
 *  4. Persiste o evento e a RESPOSTA do Meta na tabela meta_events do Supabase
 *
 * Somente o fluxo do Purchase foi alterado; xTracky e demais eventos seguem
 * exatamente como estavam.
 */

import {
  sendPurchaseToMeta,
  normalizeIronpayPayload,
  isPaidStatus,
} from '../_meta-purchase.js';

const LOG = '[ironpay/webhook]';

const IRONPAY_TOKEN = process.env.IRONPAY_TOKEN || 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const xtrackyToken = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl = 'https://api.xtracky.com/api/integrations/api';

async function getFbpFbcFromSupabase(orderId) {
  if (!SUPABASE_KEY || !orderId) return { fbp: '', fbc: '' };
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/checkouts?order_id=eq.${orderId}&select=fbc,fbp`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) return { fbp: data[0].fbp || '', fbc: data[0].fbc || '' };
    }
  } catch (e) {
    console.error(`${LOG} Erro buscando fbp/fbc:`, e.message);
  }
  return { fbp: '', fbc: '' };
}

async function getMetaEventIdFromSupabase(transactionId) {
  if (!SUPABASE_KEY || !transactionId) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/meta_events?event_name=eq.Purchase_id_mapping&custom_data->>transaction_id=eq.${transactionId}&select=event_id&order=created_at.desc&limit=1`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) return data[0].event_id;
    }
  } catch (e) {
    console.error(`${LOG} Erro buscando meta_event_id:`, e.message);
  }
  return null;
}

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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Prova de execução da rota — aparece nos logs da Vercel a cada chamada.
  console.log(`${LOG} ROTA EXECUTADA em ${new Date().toISOString()} | method=${req.method}`);

  try {
    const raw = req.body || {};
    const payload = normalizeIronpayPayload(raw);

    console.log(`${LOG} Payload recebido:`, JSON.stringify(raw));

    const tokenHeader =
      req.headers['x-ironpay-token'] || req.headers['authorization']?.replace('Bearer ', '');
    const tokenBody = payload?.token || payload?.api_token;
    const tokenQuery = req.query?.api_token;

    if (tokenHeader !== IRONPAY_TOKEN && tokenBody !== IRONPAY_TOKEN && tokenQuery !== IRONPAY_TOKEN) {
      console.warn(`${LOG} Token não reconhecido — prosseguindo para não bloquear notificações.`);
    }

    const statusOriginal =
      payload.status || payload.payment_status || raw.status || raw.event || 'pending';
    const isPaid = isPaidStatus(statusOriginal) || isPaidStatus(raw.event?.split('.').pop());
    const paymentMethod = payload.payment_method || payload.type || 'unknown';

    // ── Deduplicação: event_id gerado pelo frontend ────────────────────────
    const transactionId = payload.id || payload.transaction_id;
    let metaEventId = payload.meta_event_id || payload.metadata?.meta_event_id || null;
    if (!metaEventId) {
      metaEventId = await getMetaEventIdFromSupabase(transactionId);
      if (metaEventId) {
        console.log(`${LOG} meta_event_id do Supabase para ${transactionId}: ${metaEventId}`);
      } else {
        console.warn(`${LOG} meta_event_id não encontrado — será gerado server-side.`);
      }
    }

    const { fbp, fbc } = await getFbpFbcFromSupabase(transactionId);

    const clientIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      '';
    const clientUserAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    console.log(
      `${LOG} status=${statusOriginal} | isPaid=${isPaid} | method=${paymentMethod} | meta_event_id=${metaEventId || 'none'}`,
    );

    // 1. xTracky (inalterado)
    const xtrackyPayload = {
      token: xtrackyToken,
      orderId: transactionId || 'IRONPAY-' + Date.now(),
      amount: payload.amount ? payload.amount / 100 : 0,
      status: isPaid ? 'paid' : statusOriginal || 'pending',
      payment_method: paymentMethod,
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

    // 2. Meta CAPI Purchase — só quando pago
    let purchase = { sent: false, ok: false, skipped: true };
    if (isPaid) {
      purchase = await sendPurchaseToMeta(payload, {
        logPrefix: LOG,
        metaEventId,
        client_ip_address: clientIpAddress,
        client_user_agent: clientUserAgent,
        fbp,
        fbc,
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
      payment_method: paymentMethod,
      status: statusOriginal,
      is_paid: isPaid,
      forwarded_to_xtracky: true,
      // Agora reflete o resultado REAL do envio, não apenas "estava pago".
      meta_capi_purchase: purchase.ok === true,
      meta_capi_event_id: purchase.event_id || null,
      meta_capi_value: purchase.value ?? null,
      meta_capi_error: purchase.ok ? null : purchase.error || null,
      deduplication_used: !!metaEventId,
    });
  } catch (error) {
    console.error(`${LOG} Erro fatal:`, error.message, error.stack);
    return res.status(500).json({ error: error.message });
  }
}
