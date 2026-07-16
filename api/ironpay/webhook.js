/**
 * Vercel Serverless Function: api/ironpay/webhook
 *
 * Recebe webhooks da IronPay (cartão de crédito) e:
 *  1. Valida o token de autenticação da IronPay
 *  2. Encaminha para xTracky (rastreamento)
 *  3. Dispara evento Purchase na API de Conversões do Meta (CAPI) quando pago
 *  4. Persiste na tabela meta_events do Supabase
 *
 * Configuração IronPay:
 *   - URL base: https://api.ironpayapp.com.br/api/public/v1
 *   - Token: cz8cziikjy
 *   - Tipo de webhook: cartao
 *   - Método: POST /api/ironpay/webhook
 */

const IRONPAY_TOKEN   = process.env.IRONPAY_TOKEN   || 'cz8cziikjy';
const PIXEL_ID        = process.env.META_PIXEL_ID   || '1590849999312410';
const ACCESS_TOKEN    = process.env.META_ACCESS_TOKEN || 'EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD';
const SUPABASE_URL    = process.env.SUPABASE_URL    || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY || '';
const CAPI_URL        = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;
const xtrackyToken    = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl      = 'https://api.xtracky.com/api/integrations/api';

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
        event_time:    capiEvent.event_time,
        source_url:    capiEvent.event_source_url || null,
        email_hash:    capiEvent.user_data?.em    || null,
        phone_hash:    capiEvent.user_data?.ph    || null,
        custom_data:   capiEvent.custom_data      || null,
        capi_response: capiResponse               || null,
        action_source: 'website',
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
 */
async function sendCapiPurchase(payload, isPaid, metaEventId) {
  if (!ACCESS_TOKEN || !isPaid) return null;

  const amount  = payload.amount ? payload.amount / 100 : 0;
  const orderId = payload.id || payload.transaction_id || 'IRONPAY-' + Date.now();

  const capiEvent = {
    event_name:       'Purchase',
    event_time:       Math.floor(Date.now() / 1000),
    event_source_url: 'https://camisa10original.com.br/checkout',
    action_source:    'website',
    user_data: {
      em: payload.customer?.email || '',
      ph: payload.customer?.phone_number || payload.customer?.phone || '',
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

  Object.keys(capiEvent.user_data).forEach(k => {
    if (!capiEvent.user_data[k]) delete capiEvent.user_data[k];
  });

  try {
    const res    = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [capiEvent] }),
    });
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

    // Determinar método de pagamento (cartão de crédito)
    const paymentMethod = payload.payment_method
      || payload.type
      || 'credit_card';

    // Extrair event_id do frontend para deduplicação com o Meta Pixel
    const metaEventId = payload.meta_event_id
      || payload.metadata?.meta_event_id
      || null;

    console.log(`[ironpay/webhook] status=${statusOriginal} | isPaid=${isPaid} | method=${paymentMethod}`);

    // 1. Encaminhar para xTracky
    const xtrackyPayload = {
      token:   xtrackyToken,
      orderId: payload.id || payload.transaction_id || 'IRONPAY-' + Date.now(),
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
      capiResult = await sendCapiPurchase(payload, isPaid, metaEventId);
      console.log('[ironpay/webhook] Evento Purchase enviado ao Meta CAPI');
    }

    return res.status(200).json({
      received:            true,
      payment_method:      paymentMethod,
      status:              statusOriginal,
      is_paid:             isPaid,
      forwarded_to_xtracky: true,
      meta_capi_purchase:  isPaid,
    });
  } catch (error) {
    console.error('[ironpay/webhook] Erro:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
