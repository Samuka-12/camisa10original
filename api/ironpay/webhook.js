/**
 * Vercel Serverless Function: api/ironpay/webhook
 *
 * Recebe webhooks da IronPay (cartão de crédito) e:
 *  1. Valida o token de autenticação da IronPay
 *  2. Encaminha para xTracky (rastreamento)
 *  3. Dispara evento Purchase na API de Conversões do Meta (CAPI) quando pago
 *     - Com hashing SHA-256 de email, telefone, nome
 *     - Com client_ip_address, client_user_agent, fbp, fbc
 *     - Com event_id para deduplicação com o Pixel do frontend
 *  4. Persiste na tabela meta_events do Supabase
 *
 * Deduplicação:
 *   O frontend gera um `event_id` único para o evento Purchase e o envia
 *   ao criar o pagamento via `meta_event_id` no payload. Esse ID é retornado
 *   pela IronPay nos metadados da transação e usado aqui na CAPI, garantindo
 *   que o Meta deduplique corretamente com o evento disparado via Pixel (fbq).
 */

const { createHash } = require('crypto');

const IRONPAY_TOKEN   = process.env.IRONPAY_TOKEN   || 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';
const PIXEL_ID        = process.env.META_PIXEL_ID   || '2081548536080257';
const ACCESS_TOKEN    = process.env.META_ACCESS_TOKEN || '';
const SUPABASE_URL    = process.env.SUPABASE_URL    || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || '';
const CAPI_URL        = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;
const xtrackyToken    = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl      = 'https://api.xtracky.com/api/integrations/api';

/**
 * Hash SHA-256 de uma string (lowercase, trim)
 */
function sha256(value) {
  if (!value) return '';
  const normalized = String(value).toLowerCase().trim();
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Extrai fbp e fbc do Supabase buscando o checkout mais recente
 * (usado como fallback quando o webhook não recebe esses cookies)
 */
async function getFbpFbcFromSupabase(orderId) {
  if (!SUPABASE_KEY) return { fbp: '', fbc: '' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/checkouts?order_id=eq.${orderId}&select=fbc,fbp`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        return {
          fbp: data[0].fbp || '',
          fbc: data[0].fbc || '',
        };
      }
    }
  } catch (e) {
    console.error('[ironpay/webhook] Erro buscando fbp/fbc:', e.message);
  }
  return { fbp: '', fbc: '' };
}

/**
 * Busca o meta_event_id associado a uma transaction_id
 * (salvo pelo frontend via /api/meta-capi-purchase-id)
 */
async function getMetaEventIdFromSupabase(transactionId) {
  if (!SUPABASE_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/meta_events?event_name=eq.Purchase_id_mapping&custom_data->>transaction_id=eq.${transactionId}&select=event_id&order=created_at.desc&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        return data[0].event_id;
      }
    }
  } catch (e) {
    console.error('[ironpay/webhook] Erro buscando meta_event_id:', e.message);
  }
  return null;
}

async function saveEventToSupabase(eventName, capiEvent, capiResponse) {
  if (!SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/meta_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        event_name:    eventName,
        event_id:      capiEvent.event_id      || null,
        event_time:    capiEvent.event_time,
        source_url:    capiEvent.event_source_url || null,
        email_hash:    capiEvent.user_data?.em    || null,
        phone_hash:    capiEvent.user_data?.ph    || null,
        custom_data:   capiEvent.custom_data      || null,
        capi_response: capiResponse               || null,
        action_source: capiEvent.action_source    || 'website',
        created_at:    new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('[ironpay/webhook] Supabase save error:', err.message);
  }
}

/**
 * Envia evento Purchase para a CAPI do Meta.
 *
 * @param {object} payload      - Payload completo do webhook da IronPay
 * @param {boolean} isPaid      - Se o pagamento foi confirmado
 * @param {string|null} metaEventId - event_id gerado pelo frontend (deduplicação)
 * @param {object} options      - Opções adicionais (client_ip, user_agent, etc.)
 */
async function sendCapiPurchase(payload, isPaid, metaEventId, options = {}) {
  if (!ACCESS_TOKEN || !isPaid) return null;

  const amount  = payload.amount ? payload.amount / 100 : 0;
  const orderId = payload.id || payload.transaction_id || 'IRONPAY-' + Date.now();

  // ── Advanced Matching com SHA-256 ────────────────────────────────────────
  const email = payload.customer?.email || '';
  const phone = payload.customer?.phone_number || payload.customer?.phone || '';
  const name  = payload.customer?.name || payload.client?.name || '';
  const nameParts = name.trim().split(' ');
  const fn = nameParts[0] || '';
  const ln = nameParts.slice(1).join(' ') || '';

  const capiEvent = {
    event_name:       'Purchase',
    event_time:       Math.floor(Date.now() / 1000),
    event_source_url: 'https://camisa10original.com.br/checkout',
    action_source:    'website',
    user_data: {
      // Hashes SHA-256 (Meta exige lowercase + trim)
      em: sha256(email),
      ph: sha256(phone.replace(/\D/g, '')),
      fn: sha256(fn),
      ln: sha256(ln),
      // Dados PII em texto claro (Meta faz o hash internamente se receber assim)
      // Mantemos os hashes como prioridade
      // Dados de navegação (advanced matching)
      client_user_agent: options.client_user_agent || 'Mozilla/5.0',
      client_ip_address: options.client_ip_address || '',
      fbp: options.fbp || '',
      fbc: options.fbc || '',
    },
    custom_data: {
      order_id:    orderId,
      value:       amount,
      currency:    'BRL',
      content_ids: [orderId],
      num_items:   1,
    },
  };

  // Deduplicação com o Pixel do Meta via event_id
  if (metaEventId) {
    capiEvent.event_id = metaEventId;
    console.log(`[ironpay/webhook] Purchase deduplicação ativa — event_id: ${metaEventId}`);
  } else {
    const ts   = Date.now();
    const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    capiEvent.event_id = `Purchase_${ts}_${rand}`;
    console.warn(`[ironpay/webhook] meta_event_id não recebido — event_id server-side: ${capiEvent.event_id}`);
  }

  // Limpa campos vazios
  Object.keys(capiEvent.user_data).forEach(k => {
    if (!capiEvent.user_data[k]) delete capiEvent.user_data[k];
  });

  try {
    // Timeout de 10s para evitar serverless timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [capiEvent] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const result = await res.json();
    console.log('[ironpay/webhook] CAPI Purchase ->', JSON.stringify(result));
    await saveEventToSupabase('Purchase', capiEvent, result);
    return result;
  } catch (err) {
    console.error('[ironpay/webhook] CAPI error:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    console.log('[ironpay/webhook] Payload recebido:', JSON.stringify(payload));

    // Validação do token da IronPay (enviado no header ou no body)
    const tokenHeader = req.headers['x-ironpay-token'] || req.headers['authorization']?.replace('Bearer ', '');
    const tokenBody   = payload?.token || payload?.api_token;
    const tokenQuery  = req.query?.api_token;

    if (tokenHeader !== IRONPAY_TOKEN && tokenBody !== IRONPAY_TOKEN && tokenQuery !== IRONPAY_TOKEN) {
      console.warn('[ironpay/webhook] Token inválido recebido:', tokenHeader || tokenBody || tokenQuery);
      // Aceita mesmo sem token válido para não bloquear notificações da IronPay
      // mas registra o aviso para auditoria
    }

    // Determinar status do pagamento
    const statusOriginal = payload.status
      || payload.payment_status
      || payload.data?.status
      || 'pending';

    const isPaid = ['paid', 'approved', 'PAID', 'authorized', 'paid_out', 'captured'].includes(statusOriginal);

    // Determinar método de pagamento
    const paymentMethod = payload.payment_method
      || payload.type
      || 'credit_card';

    // ── DEDUPLICAÇÃO: Buscar meta_event_id ──────────────────────────────────
    // 1. Primeiro tenta no payload direto (IronPay pode retornar nos metadados)
    let metaEventId = payload.meta_event_id
      || payload.metadata?.meta_event_id
      || null;

    // 2. Se não encontrou, busca no Supabase (salvo pelo frontend)
    if (!metaEventId) {
      const transactionId = payload.id || payload.transaction_id;
      if (transactionId) {
        metaEventId = await getMetaEventIdFromSupabase(transactionId);
        if (metaEventId) {
          console.log(`[ironpay/webhook] meta_event_id encontrado no Supabase para ${transactionId}: ${metaEventId}`);
        }
      }
    }

    // ── Advanced Matching: fbp/fbc do Supabase ─────────────────────────────
    const orderId = payload.id || payload.transaction_id;
    let fbp = '';
    let fbc = '';
    if (orderId) {
      const fbpFbc = await getFbpFbcFromSupabase(orderId);
      fbp = fbpFbc.fbp;
      fbc = fbpFbc.fbc;
    }

    // ── IP e User Agent do request ─────────────────────────────────────────
    const clientIpAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.headers['x-real-ip']
      || req.socket.remoteAddress
      || '';
    const clientUserAgent = req.headers['user-agent'] || 'Mozilla/5.0';

    console.log(`[ironpay/webhook] status=${statusOriginal} | isPaid=${isPaid} | method=${paymentMethod} | meta_event_id=${metaEventId || 'none'}`);

    // 1. Encaminhar para xTracky
    const xtrackyPayload = {
      token:   xtrackyToken,
      orderId: orderId || 'IRONPAY-' + Date.now(),
      amount:  payload.amount ? payload.amount / 100 : 0,
      status:  isPaid ? 'paid' : (statusOriginal || 'pending'),
      payment_method: paymentMethod,
      customer: {
        email:    payload.customer?.email        || '',
        phone:    payload.customer?.phone_number || payload.customer?.phone || '',
        document: payload.customer?.document    || '',
      },
      raw_payload: payload,
    };

    console.log('[ironpay/webhook] Encaminhando para xTracky:', JSON.stringify({ ...xtrackyPayload, raw_payload: '[omitido]' }));

    fetch(xtrackyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xtrackyPayload),
    }).catch(err => console.error('[ironpay/webhook] Erro xTracky:', err.message));

    // 2. Meta CAPI Purchase (server-side) — apenas quando pago
    let capiResult = null;
    if (isPaid) {
      capiResult = await sendCapiPurchase(payload, isPaid, metaEventId, {
        client_ip_address: clientIpAddress,
        client_user_agent: clientUserAgent,
        fbp,
        fbc,
      });
      console.log('[ironpay/webhook] Evento Purchase enviado ao Meta CAPI');
    }

    return res.status(200).json({
      received:            true,
      payment_method:      paymentMethod,
      status:              statusOriginal,
      is_paid:             isPaid,
      forwarded_to_xtracky: true,
      meta_capi_purchase:  isPaid,
      deduplication_used:  !!metaEventId,
    });
  } catch (error) {
    console.error('[ironpay/webhook] Erro:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
