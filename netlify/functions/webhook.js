/**
 * Netlify Function: webhook
 * Recebe webhooks da IronPay e:
 *  1. Encaminha para xTracky (rastreamento existente)
 *  2. Dispara Purchase na API de Conversões do Meta (CAPI) quando pago
 *  3. Persiste na tabela meta_events do Supabase
 *
 * Deduplicação:
 *   O frontend gera um `event_id` único para o evento Purchase e o envia
 *   ao criar o pagamento via `meta_event_id` no payload. Esse ID é retornado
 *   pela IronPay nos metadados da transação e usado aqui na CAPI, garantindo
 *   que o Meta deduplique corretamente com o evento disparado via Pixel (fbq).
 *
 *   Fluxo de deduplicação para Purchase:
 *     1. Frontend gera purchaseEventId = generateEventId('Purchase')
 *     2. Frontend envia purchaseEventId ao criar pagamento (meta_event_id)
 *     3. Frontend dispara fbq('track', 'Purchase', params, { eventID: purchaseEventId })
 *     4. IronPay confirma pagamento → webhook recebe meta_event_id
 *     5. Webhook envia CAPI Purchase com event_id = meta_event_id
 *     6. Meta deduplica: Pixel + CAPI com mesmo event_id = 1 evento contabilizado
 */

const PIXEL_ID     = process.env.META_PIXEL_ID     || '1590849999312410';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL      || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const CAPI_URL     = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

const xtrackyToken = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl   = 'https://api.xtracky.com/api/integrations/api';

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
        event_id:      capiEvent.event_id    || null,
        event_time:    capiEvent.event_time,
        source_url:    capiEvent.event_source_url || null,
        email_hash:    capiEvent.user_data && capiEvent.user_data.em ? capiEvent.user_data.em : null,
        phone_hash:    capiEvent.user_data && capiEvent.user_data.ph ? capiEvent.user_data.ph : null,
        custom_data:   capiEvent.custom_data      || null,
        capi_response: capiResponse               || null,
        action_source: 'website',
        created_at:    new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('[webhook] Supabase save error:', err.message);
  }
}

/**
 * Envia evento Purchase para a CAPI do Meta.
 *
 * @param {object} payload  - Payload completo do webhook da IronPay
 * @param {boolean} isPaid  - Se o pagamento foi confirmado
 * @param {string|null} metaEventId - event_id gerado pelo frontend (para deduplicação)
 */
async function sendCapiPurchase(payload, isPaid, metaEventId) {
  if (!ACCESS_TOKEN || !isPaid) return null;
  const amount  = payload.amount ? payload.amount / 100 : 0;
  const orderId = payload.id || payload.transaction_id || 'IRONPAY-' + Date.now();

  const capiEvent = {
    event_name:       'Purchase',
    event_time:       Math.floor(Date.now() / 1000),
    event_source_url: 'https://camisa10original.netlify.app/checkout',
    action_source:    'website',
    user_data: {
      em: (payload.customer && payload.customer.email)        ? payload.customer.email : '',
      ph: (payload.customer && (payload.customer.phone_number || payload.customer.phone)) ? (payload.customer.phone_number || payload.customer.phone) : '',
    },
    custom_data: {
      order_id:    orderId,
      value:       amount,
      currency:    'BRL',
      content_ids: [orderId],
      num_items:   1,
    },
  };

  // Usa o event_id gerado pelo frontend para deduplicação com o Pixel (fbq)
  // Se não disponível, gera um ID server-side (sem deduplicação com o Pixel)
  if (metaEventId) {
    capiEvent.event_id = metaEventId;
    console.log(`[webhook] Purchase deduplicação ativa — event_id: ${metaEventId}`);
  } else {
    // Fallback: gera event_id server-side (sem deduplicação com Pixel)
    const ts   = Date.now();
    const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    capiEvent.event_id = `Purchase_${ts}_${rand}`;
    console.warn(`[webhook] meta_event_id não recebido — usando event_id server-side: ${capiEvent.event_id}`);
  }

  Object.keys(capiEvent.user_data).forEach(k => { if (!capiEvent.user_data[k]) delete capiEvent.user_data[k]; });

  try {
    const res    = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [capiEvent] }),
    });
    const result = await res.json();
    console.log('[webhook] CAPI Purchase ->', JSON.stringify(result));
    await saveEventToSupabase('Purchase', capiEvent, result);
    return result;
  } catch (err) {
    console.error('[webhook] CAPI error:', err.message);
    return null;
  }
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const payload = JSON.parse(event.body);
    console.log('Webhook recebido da IronPay:', payload);
    console.log('[Webhook] Payload completo:', JSON.stringify(payload));
    const statusOriginal = payload.status || (payload.data && payload.data.status) || 'pending';
    const isPaid = ['paid', 'approved', 'PAID', 'authorized', 'paid_out'].includes(statusOriginal);

    // Extrai o event_id gerado pelo frontend (enviado via meta_event_id no payload de criação)
    // A IronPay pode retornar metadados customizados no campo metadata ou diretamente no payload
    const metaEventId = payload.meta_event_id
      || (payload.metadata && payload.metadata.meta_event_id)
      || null;

    // 1. xTracky
    const xtrackyPayload = {
      token:   xtrackyToken,
      orderId: payload.id || payload.transaction_id || 'IRONPAY-' + Date.now(),
      amount:  payload.amount ? payload.amount / 100 : 0,
      status:  isPaid ? 'paid' : (payload.status || 'pending'),
      customer: {
        email:    (payload.customer && payload.customer.email)        || '',
        phone:    (payload.customer && (payload.customer.phone_number || payload.customer.phone)) || '',
        document: (payload.customer && payload.customer.document)     || '',
      },
      raw_payload: payload,
    };
    console.log('Disparando Webhook para xTracky:', xtrackyPayload);
    await fetch(xtrackyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xtrackyPayload),
    }).catch(err => console.error('Erro ao enviar para xTracky:', err.message));

    // 2. Meta CAPI Purchase (server-side) com deduplicação via event_id
    if (isPaid) {
      await sendCapiPurchase(payload, isPaid, metaEventId);
      console.log('[webhook] Evento Purchase enviado ao Meta CAPI');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, forwarded_to_xtracky: true, meta_capi_purchase: isPaid }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
