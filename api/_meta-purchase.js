/**
 * Envio centralizado do evento Purchase para a API de Conversões (CAPI) do Meta.
 * ─────────────────────────────────────────────────────────────────────────────
 * Este módulo é a ÚNICA fonte de verdade do Purchase server-side.
 * Usado por: api/webhook.js e api/ironpay/webhook.js
 *
 * Regras que este módulo garante (e que estavam faltando antes):
 *  - event_name: "Purchase", event_time, action_source: "website",
 *    event_source_url, event_id, currency e value SEMPRE presentes.
 *  - user_data (em, ph, fn, ln, external_id) SEMPRE em SHA-256.
 *    O Meta REJEITA o evento inteiro se em/ph chegarem em texto puro.
 *  - Payload da IronPay normalizado (raiz ou aninhado em `data`).
 *  - Leitura das variáveis de ambiente feita EM TEMPO DE CHAMADA e logada.
 *  - Resposta do Meta sempre logada (status HTTP + corpo), inclusive rejeições.
 *  - Nenhum erro é engolido: tudo vira log e um resultado estruturado.
 */

import { createHash } from 'crypto';
import { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION } from './_meta-config.js';

const PAID_STATUSES = [
  'paid',
  'approved',
  'authorized',
  'paid_out',
  'captured',
  'completed',
  'success',
  'succeeded',
  'pago',
  'aprovado',
];

/** SHA-256 (lowercase + trim), como o Meta exige. */
export function sha256(value) {
  if (value === null || value === undefined || value === '') return '';
  const normalized = String(value).toLowerCase().trim();
  if (!normalized) return '';
  return createHash('sha256').update(normalized).digest('hex');
}

/** A IronPay ora manda a transação na raiz, ora dentro de `data`. Normaliza. */
export function normalizeIronpayPayload(raw) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const inner = body.data && typeof body.data === 'object' ? body.data : null;
  if (inner && (inner.status || inner.customer || inner.amount || inner.id)) {
    return { ...body, ...inner };
  }
  return body;
}

/** Descobre se o pagamento está confirmado (case-insensitive). */
export function isPaidStatus(status) {
  return PAID_STATUSES.includes(String(status || '').toLowerCase().trim());
}

/**
 * Converte o valor da IronPay (centavos) para reais.
 * Aceita number ou string. Retorna 0 quando não há valor utilizável.
 */
export function normalizeAmount(payload) {
  const candidates = [payload.amount, payload.total, payload.value, payload.paid_amount];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === '') continue;
    const numeric = Number(candidate);
    if (!Number.isFinite(numeric) || numeric <= 0) continue;
    // A IronPay envia em centavos (inteiro). Se vier decimal, já está em reais.
    const inReais = Number.isInteger(numeric) ? numeric / 100 : numeric;
    return Math.round(inReais * 100) / 100;
  }
  return 0;
}

/** Lê e valida as credenciais do Meta no momento da chamada. */
export function readMetaCredentials(logPrefix = '[meta-purchase]') {
  // Sanitiza: painéis de env costumam colar \n, espaços ou aspas no valor.
  const clean = (value) =>
    typeof value === 'string' ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '') : '';

  const pixelId = clean(process.env.META_PIXEL_ID) || clean(META_PIXEL_ID) || '';
  const accessToken = clean(process.env.META_ACCESS_TOKEN) || clean(META_ACCESS_TOKEN) || '';

  const pixelSource = process.env.META_PIXEL_ID ? 'env' : 'fallback';
  const tokenSource = process.env.META_ACCESS_TOKEN ? 'env' : 'fallback';

  console.log(
    `${logPrefix} credenciais -> pixel_id=${pixelId || 'AUSENTE'} (${pixelSource}) | ` +
      `access_token=${accessToken ? `presente/${accessToken.length}chars/…${accessToken.slice(-6)}` : 'AUSENTE'} (${tokenSource})`,
  );

  return { pixelId, accessToken, pixelSource, tokenSource };
}

/**
 * Monta o payload do Purchase no formato exigido pela CAPI.
 * Exportado para permitir testes e inspeção.
 */
export function buildPurchaseEvent(payload, { metaEventId, eventSourceUrl, ...options } = {}) {
  const value = normalizeAmount(payload);
  const orderId =
    payload.id ||
    payload.transaction_id ||
    payload.order_id ||
    `IRONPAY-${Date.now()}`;

  const customer = payload.customer || payload.client || {};
  const email = customer.email || payload.email || '';
  const phoneRaw =
    customer.phone_number || customer.phone || payload.phone_number || payload.phone || '';
  const phone = String(phoneRaw).replace(/\D/g, '');
  const documentRaw = customer.document || customer.cpf || payload.document || '';
  const name = String(customer.name || payload.name || '').trim();
  const nameParts = name ? name.split(/\s+/) : [];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  const eventId =
    metaEventId ||
    `Purchase_${orderId}_${Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')}`;

  const userData = {
    em: sha256(email),
    ph: sha256(phone),
    fn: sha256(firstName),
    ln: sha256(lastName),
    external_id: sha256(documentRaw || email || orderId),
    country: sha256('br'),
    client_ip_address: options.client_ip_address || '',
    client_user_agent: options.client_user_agent || 'Mozilla/5.0',
    fbp: options.fbp || '',
    fbc: options.fbc || '',
  };

  Object.keys(userData).forEach((key) => {
    if (!userData[key]) delete userData[key];
  });

  return {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl || 'https://camisa10original.com.br/checkout',
    action_source: 'website',
    user_data: userData,
    custom_data: {
      order_id: orderId,
      currency: 'BRL',
      value,
      content_type: 'product',
      content_ids: [orderId],
      num_items: 1,
      payment_method: payload.payment_method || payload.type || 'unknown',
    },
  };
}

/**
 * Envia o Purchase ao Meta.
 *
 * Retorna sempre um objeto estruturado — nunca lança e nunca engole erro:
 *   { sent, ok, http_status, event_id, value, response, error }
 */
export async function sendPurchaseToMeta(rawPayload, options = {}) {
  const logPrefix = options.logPrefix || '[meta-purchase]';
  const payload = normalizeIronpayPayload(rawPayload);

  const { pixelId, accessToken } = readMetaCredentials(logPrefix);

  if (!pixelId || !accessToken) {
    const error = !pixelId
      ? 'META_PIXEL_ID ausente — Purchase NAO enviado.'
      : 'META_ACCESS_TOKEN ausente — Purchase NAO enviado.';
    console.error(`${logPrefix} ${error}`);
    return { sent: false, ok: false, error, event_id: null, value: 0 };
  }

  const capiEvent = buildPurchaseEvent(payload, options);

  const requestBody = { data: [capiEvent] };
  const testEventCode = process.env.META_TEST_EVENT_CODE;
  if (testEventCode) {
    requestBody.test_event_code = testEventCode;
    console.log(`${logPrefix} test_event_code ativo: ${testEventCode}`);
  }

  const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`;

  console.log(
    `${logPrefix} enviando Purchase -> event_id=${capiEvent.event_id} | value=${capiEvent.custom_data.value} ` +
      `${capiEvent.custom_data.currency} | action_source=${capiEvent.action_source} | ` +
      `event_time=${capiEvent.event_time} | user_data_keys=${Object.keys(capiEvent.user_data).join(',')}`,
  );

  if (!capiEvent.custom_data.value) {
    console.warn(`${logPrefix} ATENÇÃO: value=0 — verifique o campo amount do webhook da IronPay.`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const rawText = await res.text();
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    if (!res.ok || parsed?.error) {
      console.error(
        `${logPrefix} META REJEITOU o Purchase [HTTP ${res.status}] event_id=${capiEvent.event_id} ` +
          `resposta=${JSON.stringify(parsed)}`,
      );
      return {
        sent: true,
        ok: false,
        http_status: res.status,
        event_id: capiEvent.event_id,
        value: capiEvent.custom_data.value,
        response: parsed,
        error: parsed?.error?.message || `HTTP ${res.status}`,
        capiEvent,
      };
    }

    console.log(
      `${logPrefix} Purchase ACEITO pelo Meta [HTTP ${res.status}] event_id=${capiEvent.event_id} ` +
        `events_received=${parsed?.events_received} fbtrace_id=${parsed?.fbtrace_id}`,
    );

    return {
      sent: true,
      ok: true,
      http_status: res.status,
      event_id: capiEvent.event_id,
      value: capiEvent.custom_data.value,
      response: parsed,
      capiEvent,
    };
  } catch (err) {
    const reason = err?.name === 'AbortError' ? 'timeout de 10s ao chamar a CAPI' : err?.message;
    console.error(
      `${logPrefix} FALHA ao enviar Purchase (event_id=${capiEvent.event_id}): ${reason}`,
      err?.stack || '',
    );
    return {
      sent: false,
      ok: false,
      event_id: capiEvent.event_id,
      value: capiEvent.custom_data.value,
      error: reason,
      capiEvent,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export default sendPurchaseToMeta;
