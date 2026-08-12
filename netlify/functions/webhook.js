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

const PIXEL_ID     = process.env.META_PIXEL_ID     || '1075822341637086';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD';
const SUPABASE_URL = process.env.SUPABASE_URL      || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const CAPI_URL     = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;

const LOG = '[webhook]';
const EVENT_SOURCE_URL = 'https://camisa10original.com.br/checkout';

const { createHash } = require('crypto');

const PAID_STATUSES = ['paid','approved','authorized','paid_out','captured','completed','success','succeeded','pago','aprovado'];

function sha256(value) {
  if (value === null || value === undefined || value === '') return '';
  const normalized = String(value).toLowerCase().trim();
  if (!normalized) return '';
  return createHash('sha256').update(normalized).digest('hex');
}

function isPaidStatus(status) {
  return PAID_STATUSES.includes(String(status || '').toLowerCase().trim());
}

function normalizeIronpayPayload(raw) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const inner = body.data && typeof body.data === 'object' ? body.data : null;
  if (inner && (inner.status || inner.customer || inner.amount || inner.id)) {
    return Object.assign({}, body, inner);
  }
  return body;
}

function normalizeAmount(payload) {
  const candidates = [payload.amount, payload.total, payload.value, payload.paid_amount];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') continue;
    const numeric = Number(candidate);
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    const inReais = Number.isInteger(numeric) ? numeric / 100 : numeric;
    return Math.round(inReais * 100) / 100;
  }
  return 0;
}

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
 * Envia o evento Purchase para a CAPI do Meta.
 * user_data SEMPRE em SHA-256 (o Meta rejeita o evento com PII em texto puro).
 * A resposta do Meta é sempre logada, inclusive rejeicoes.
 */
async function sendCapiPurchase(rawPayload, isPaid, metaEventId, options) {
  options = options || {};
  if (!isPaid) return { sent: false, ok: false, skipped: true };

  const pixelId = process.env.META_PIXEL_ID || PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN || ACCESS_TOKEN;

  console.log(`${LOG} credenciais -> pixel_id=${pixelId || 'AUSENTE'} | access_token=${accessToken ? 'presente/' + accessToken.length + 'chars/…' + accessToken.slice(-6) : 'AUSENTE'}`);

  if (!pixelId || !accessToken) {
    const error = !pixelId ? 'META_PIXEL_ID ausente — Purchase NAO enviado.' : 'META_ACCESS_TOKEN ausente — Purchase NAO enviado.';
    console.error(`${LOG} ${error}`);
    return { sent: false, ok: false, error };
  }

  const payload = normalizeIronpayPayload(rawPayload);
  const value = normalizeAmount(payload);
  const orderId = payload.id || payload.transaction_id || payload.order_id || 'IRONPAY-' + Date.now();
  const customer = payload.customer || payload.client || {};
  const email = customer.email || '';
  const phone = String(customer.phone_number || customer.phone || '').replace(/\D/g, '');
  const name = String(customer.name || '').trim();
  const nameParts = name ? name.split(/\s+/) : [];

  const eventId = metaEventId || ('Purchase_' + orderId + '_' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'));
  if (metaEventId) {
    console.log(`${LOG} Purchase deduplicacao ativa — event_id: ${eventId}`);
  } else {
    console.warn(`${LOG} meta_event_id nao recebido — event_id server-side: ${eventId}`);
  }

  const userData = {
    em: sha256(email),
    ph: sha256(phone),
    fn: sha256(nameParts[0] || ''),
    ln: sha256(nameParts.slice(1).join(' ')),
    external_id: sha256(customer.document || email || orderId),
    country: sha256('br'),
    client_ip_address: options.client_ip_address || '',
    client_user_agent: options.client_user_agent || 'Mozilla/5.0',
    fbp: options.fbp || '',
    fbc: options.fbc || '',
  };
  Object.keys(userData).forEach(function (k) { if (!userData[k]) delete userData[k]; });

  const capiEvent = {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: EVENT_SOURCE_URL,
    action_source: 'website',
    user_data: userData,
    custom_data: {
      order_id: orderId,
      currency: 'BRL',
      value: value,
      content_type: 'product',
      content_ids: [orderId],
      num_items: 1,
      payment_method: payload.payment_method || payload.type || 'unknown',
    },
  };

  const requestBody = { data: [capiEvent] };
  if (process.env.META_TEST_EVENT_CODE) {
    requestBody.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  if (!value) {
    console.warn(`${LOG} ATENCAO: value=0 — verifique o campo amount do webhook da IronPay.`);
  }

  console.log(`${LOG} enviando Purchase -> event_id=${eventId} | value=${value} BRL | action_source=website | event_time=${capiEvent.event_time}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(function () { controller.abort(); }, 10000);

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { parsed = { raw: text }; }

    await saveEventToSupabase('Purchase', capiEvent, parsed);

    if (!res.ok || (parsed && parsed.error)) {
      console.error(`${LOG} META REJEITOU o Purchase [HTTP ${res.status}] event_id=${eventId} resposta=${JSON.stringify(parsed)}`);
      return { sent: true, ok: false, http_status: res.status, event_id: eventId, response: parsed, error: (parsed.error && parsed.error.message) || ('HTTP ' + res.status) };
    }

    console.log(`${LOG} Purchase ACEITO pelo Meta [HTTP ${res.status}] event_id=${eventId} events_received=${parsed.events_received} fbtrace_id=${parsed.fbtrace_id}`);
    return { sent: true, ok: true, http_status: res.status, event_id: eventId, response: parsed };
  } catch (err) {
    const reason = err && err.name === 'AbortError' ? 'timeout de 10s ao chamar a CAPI' : (err && err.message);
    console.error(`${LOG} FALHA ao enviar Purchase (event_id=${eventId}): ${reason}`, (err && err.stack) || '');
    return { sent: false, ok: false, event_id: eventId, error: reason };
  } finally {
    clearTimeout(timeoutId);
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
    const isPaid = isPaidStatus(statusOriginal);

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

    let purchaseResult = { sent: false, ok: false, skipped: true };
    // 2. Meta CAPI Purchase (server-side) com deduplicação via event_id
    if (isPaid) {
      purchaseResult = await sendCapiPurchase(payload, isPaid, metaEventId, {
        client_ip_address: (event.headers && (event.headers['x-forwarded-for'] || event.headers['x-nf-client-connection-ip']) || '').split(',')[0].trim(),
        client_user_agent: (event.headers && event.headers['user-agent']) || 'Mozilla/5.0',
      });
      if (!purchaseResult.ok) {
        console.error(`${LOG} Purchase NAO contabilizado pelo Meta:`, purchaseResult.error || 'motivo desconhecido');
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, forwarded_to_xtracky: true, meta_capi_purchase: purchaseResult.ok === true, meta_capi_event_id: purchaseResult.event_id || null, meta_capi_error: purchaseResult.ok ? null : (purchaseResult.error || null) }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
