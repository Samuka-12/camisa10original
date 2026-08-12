/**
 * Vercel Serverless Function: api/ironpay/webhook
 *
 * Recebe postbacks da IronPay. Purchase só é enviado à Meta quando um Pix está
 * confirmado; criação de cobrança, checkout iniciado e status pendente não
 * geram conversão. O event_id é estável por transação para idempotência e
 * deduplicação no Meta em caso de reenvio do webhook.
 */

import {
  getIronpayStatus,
  getIronpayTransactionId,
  isPaidStatus,
  normalizeIronpayPayload,
  sendPurchaseToMeta,
} from '../_meta-purchase.js';
import { supabaseConfigured, supabaseRequest } from '../_supabase.js';

const LOG = '[ironpay/webhook]';
const xtrackyToken = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl = 'https://api.xtracky.com/api/integrations/api';

function resolvePublicOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || 'camisa10original.vercel.app')
    .split(',')[0]
    .trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return `${proto}://${host}`;
}

const supabaseHeaders = () => ({
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
});

function inlineAttribution(payload) {
  const metadata = payload?.metadata || {};
  const tracking = payload?.tracking || {};
  return {
    metaEventId: payload?.meta_event_id || metadata.meta_event_id || '',
    fbp: payload?.fbp || tracking.fbp || metadata.fbp || '',
    fbc: payload?.fbc || tracking.fbc || metadata.fbc || '',
  };
}

async function getPersistedAttribution(transactionId) {
  if (!supabaseConfigured() || !transactionId) return { metaEventId: '', fbp: '', fbc: '' };

  try {
    const checkoutResponse = await supabaseRequest(
      `/rest/v1/checkouts?order_id=eq.${encodeURIComponent(transactionId)}&select=meta_event_id,fbp,fbc&limit=1`,
      { headers: supabaseHeaders() },
    );
    if (checkoutResponse.ok) {
      const records = await checkoutResponse.json();
      if (records[0]) {
        return {
          metaEventId: records[0].meta_event_id || '',
          fbp: records[0].fbp || '',
          fbc: records[0].fbc || '',
        };
      }
    }

    const mappingResponse = await supabaseRequest(
      `/rest/v1/meta_events?event_name=eq.Purchase_id_mapping&custom_data->>transaction_id=eq.${encodeURIComponent(transactionId)}&select=custom_data&order=created_at.desc&limit=1`,
      { headers: supabaseHeaders() },
    );
    if (mappingResponse.ok) {
      const records = await mappingResponse.json();
      const context = records[0]?.custom_data || {};
      return {
        metaEventId: context.meta_event_id || context.event_id || '',
        fbp: context.fbp || '',
        fbc: context.fbc || '',
      };
    }
  } catch (error) {
    console.error(`${LOG} Falha ao buscar contexto Meta:`, error.message);
  }

  return { metaEventId: '', fbp: '', fbc: '' };
}

async function purchaseWasAccepted(eventId) {
  if (!supabaseConfigured() || !eventId) return false;
  try {
    const response = await supabaseRequest(
      `/rest/v1/meta_events?event_name=eq.Purchase&custom_data->>event_id=eq.${encodeURIComponent(eventId)}&select=custom_data&limit=1`,
      { headers: supabaseHeaders() },
    );
    if (!response.ok) return false;
    const records = await response.json();
    return Array.isArray(records) && records.length > 0;
  } catch (error) {
    console.error(`${LOG} Falha na checagem de idempotência:`, error.message);
    return false;
  }
}

async function saveAcceptedPurchase(capiEvent, capiResponse) {
  if (!supabaseConfigured() || !capiEvent) return;
  try {
    await supabaseRequest('/rest/v1/meta_events', {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        event_name: 'Purchase',
        event_time: capiEvent.event_time,
        source_url: capiEvent.event_source_url || null,
        fbc: capiEvent.user_data?.fbc || null,
        fbp: capiEvent.user_data?.fbp || null,
        email_hash: capiEvent.user_data?.em || null,
        phone_hash: capiEvent.user_data?.ph || null,
        custom_data: {
          ...(capiEvent.custom_data || {}),
          event_id: capiEvent.event_id,
        },
        capi_response: capiResponse || null,
        action_source: capiEvent.action_source || 'website',
        created_at: new Date().toISOString(),
      }),
    });
  } catch (error) {
    console.error(`${LOG} Falha ao registrar Purchase aceito:`, error.message);
  }
}

function isPixPayment(payload, raw) {
  const method = String(
    payload?.payment_method || payload?.payment_type || payload?.type || raw?.payment_method || raw?.type || '',
  ).toLowerCase();
  return method.includes('pix') || Boolean(payload?.pix || raw?.pix);
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const raw = req.body || {};
    const payload = normalizeIronpayPayload(raw);
    const status = getIronpayStatus(raw, payload);
    const transactionId = getIronpayTransactionId(payload);
    const paid = isPaidStatus(status);
    const pix = isPixPayment(payload, raw);

    console.log(`${LOG} status=${status} paid=${paid} pix=${pix} transaction_id=${transactionId || 'AUSENTE'}`);

    // Mantém o encaminhamento existente de status para xTracky.
    fetch(xtrackyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: xtrackyToken,
        orderId: transactionId || `IRONPAY-${Date.now()}`,
        amount: payload.amount ? Number(payload.amount) / 100 : 0,
        status: paid ? 'paid' : status,
        payment_method: payload.payment_method || payload.type || 'unknown',
        customer: {
          email: payload.customer?.email || '',
          phone: payload.customer?.phone_number || payload.customer?.phone || '',
          document: payload.customer?.document || '',
        },
        raw_payload: payload,
      }),
    }).catch((error) => console.error(`${LOG} Falha xTracky:`, error.message));

    if (!paid || !pix) {
      return res.status(200).json({
        received: true,
        status,
        transaction_id: transactionId || null,
        purchase_sent: false,
        reason: !pix ? 'payment_method_not_pix' : 'payment_not_confirmed',
      });
    }

    if (!transactionId) {
      return res.status(422).json({
        received: true,
        purchase_sent: false,
        reason: 'transaction_id_missing',
      });
    }

    const direct = inlineAttribution(payload);
    const persisted = await getPersistedAttribution(transactionId);
    const eventId = direct.metaEventId || persisted.metaEventId || `Purchase_${transactionId}`;

    if (await purchaseWasAccepted(eventId)) {
      console.log(`${LOG} Purchase já aceito anteriormente: ${eventId}`);
      return res.status(200).json({
        received: true,
        status,
        transaction_id: transactionId,
        purchase_sent: false,
        duplicate: true,
        event_id: eventId,
      });
    }

    const clientIpAddress =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.headers['x-real-ip'] || req.socket?.remoteAddress || '';
    const purchase = await sendPurchaseToMeta(payload, {
      logPrefix: LOG,
      metaEventId: eventId,
      client_ip_address: clientIpAddress,
      client_user_agent: req.headers['user-agent'] || 'Mozilla/5.0',
      fbp: direct.fbp || persisted.fbp,
      fbc: direct.fbc || persisted.fbc,
      eventSourceUrl: `${resolvePublicOrigin(req)}/checkout`,
    });

    if (purchase.ok) {
      await saveAcceptedPurchase(purchase.capiEvent, purchase.response);
      return res.status(200).json({
        received: true,
        status,
        transaction_id: transactionId,
        purchase_sent: true,
        event_id: purchase.event_id,
        value: purchase.value,
        currency: 'BRL',
      });
    }

    // Código não-2xx permite novo postback da IronPay caso a CAPI esteja
    // temporariamente indisponível; o event_id estável evita dupla conversão.
    return res.status(502).json({
      received: true,
      status,
      transaction_id: transactionId,
      purchase_sent: false,
      event_id: purchase.event_id || eventId,
      error: purchase.error || 'Meta CAPI rejected Purchase',
    });
  } catch (error) {
    console.error(`${LOG} Erro fatal:`, error.message, error.stack);
    return res.status(500).json({ error: error.message });
  }
}
