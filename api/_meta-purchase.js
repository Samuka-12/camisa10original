/**
 * Fonte única do evento Purchase server-side.
 *
 * Este módulo é chamado somente pelos webhooks autenticados da IronPay após a
 * confirmação do pagamento. Ele nunca recebe Purchase diretamente do navegador.
 */

import { createHash } from 'crypto';
import { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION } from './_meta-config.js';

const PAID_STATUSES = new Set([
  'paid',
  'approved',
  'paid_out',
  'captured',
  'completed',
  'success',
  'succeeded',
  'pago',
  'aprovado',
]);

export function sha256(value) {
  if (value === null || value === undefined || value === '') return '';
  const normalized = String(value).toLowerCase().trim();
  return normalized ? createHash('sha256').update(normalized).digest('hex') : '';
}

export function normalizeIronpayPayload(raw) {
  const body = raw && typeof raw === 'object' ? raw : {};
  const inner = body.data && typeof body.data === 'object' ? body.data : null;
  return inner && (inner.status || inner.customer || inner.amount || inner.id)
    ? { ...body, ...inner }
    : body;
}

export function isPaidStatus(status) {
  return PAID_STATUSES.has(String(status || '').toLowerCase().trim());
}

export function getIronpayStatus(raw, normalizedPayload = normalizeIronpayPayload(raw)) {
  const eventName = typeof raw?.event === 'string' ? raw.event.split('.').pop() : '';
  const candidates = [
    normalizedPayload.status,
    normalizedPayload.payment_status,
    normalizedPayload.transaction_status,
    normalizedPayload.state,
    eventName,
    raw?.status,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim()) || 'pending';
}

export function getIronpayTransactionId(payload) {
  const candidate =
    payload?.id ||
    payload?.transaction_id ||
    payload?.transaction?.id ||
    payload?.order_id ||
    payload?.reference_id ||
    '';
  return candidate ? String(candidate) : '';
}

export function normalizeAmount(payload) {
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

export function readMetaCredentials(logPrefix = '[meta-purchase]') {
  const clean = (value) =>
    typeof value === 'string'
      ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
      : '';

  const pixelId = clean(process.env.META_PIXEL_ID) || clean(META_PIXEL_ID);
  const accessToken = clean(process.env.META_ACCESS_TOKEN) || clean(META_ACCESS_TOKEN);

  console.log(
    `${logPrefix} credenciais -> pixel_id=${pixelId || 'AUSENTE'} | ` +
      `access_token=${accessToken ? `presente/${accessToken.length}chars/…${accessToken.slice(-6)}` : 'AUSENTE'}`,
  );

  return { pixelId, accessToken };
}

export function buildPurchaseEvent(payload, { metaEventId, eventSourceUrl, ...options } = {}) {
  const orderId = getIronpayTransactionId(payload);
  if (!orderId) throw new Error('transaction_id ausente no webhook da IronPay');

  const value = normalizeAmount(payload);
  const customer = payload.customer || payload.client || {};
  const email = customer.email || payload.email || '';
  const phoneRaw = customer.phone_number || customer.phone || payload.phone_number || payload.phone || '';
  const phone = String(phoneRaw).replace(/\D/g, '');
  const documentRaw = customer.document || customer.cpf || payload.document || '';
  const name = String(customer.name || payload.name || '').trim();
  const nameParts = name ? name.split(/\s+/) : [];

  const eventId = String(metaEventId || `Purchase_${orderId}`);
  const userData = {
    em: sha256(email),
    ph: sha256(phone),
    fn: sha256(nameParts[0] || ''),
    ln: sha256(nameParts.slice(1).join(' ') || ''),
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

  const overrides = options.customData || {};
  const customData = {
    order_id: orderId,
    currency: 'BRL',
    value,
    content_type: 'product',
    content_ids: overrides.content_ids?.length ? overrides.content_ids : [orderId],
    num_items: Number(overrides.num_items) > 0 ? Number(overrides.num_items) : 1,
    payment_method: payload.payment_method || payload.type || 'pix',
  };
  if (overrides.contents) customData.contents = overrides.contents;
  if (overrides.content_name) customData.content_name = overrides.content_name;

  return {
    event_name: 'Purchase',
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    event_source_url: eventSourceUrl || 'https://camisa10original.com.br/checkout',
    action_source: 'website',
    user_data: userData,
    custom_data: customData,
  };
}

export async function sendPurchaseToMeta(rawPayload, options = {}) {
  const logPrefix = options.logPrefix || '[meta-purchase]';
  const payload = normalizeIronpayPayload(rawPayload);
  const { pixelId, accessToken } = readMetaCredentials(logPrefix);

  if (!pixelId || !accessToken) {
    const error = !pixelId ? 'META_PIXEL_ID ausente.' : 'META_ACCESS_TOKEN ausente.';
    console.error(`${logPrefix} Purchase não enviado: ${error}`);
    return { sent: false, ok: false, error, event_id: null, value: 0 };
  }

  let capiEvent;
  try {
    capiEvent = buildPurchaseEvent(payload, options);
  } catch (error) {
    console.error(`${logPrefix} Purchase não enviado: ${error.message}`);
    return { sent: false, ok: false, error: error.message, event_id: null, value: 0 };
  }

  if (!(capiEvent.custom_data.value > 0)) {
    const error = 'Valor confirmado inválido ou ausente no webhook da IronPay.';
    console.error(`${logPrefix} Purchase não enviado: ${error}`);
    return { sent: false, ok: false, error, event_id: capiEvent.event_id, value: 0, capiEvent };
  }

  const requestBody = { data: [capiEvent] };
  if (process.env.META_TEST_EVENT_CODE) requestBody.test_event_code = process.env.META_TEST_EVENT_CODE;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const rawText = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    if (!response.ok || parsed?.error) {
      const error = parsed?.error?.message || `HTTP ${response.status}`;
      console.error(`${logPrefix} Meta rejeitou Purchase event_id=${capiEvent.event_id}: ${error}`);
      return {
        sent: true,
        ok: false,
        http_status: response.status,
        event_id: capiEvent.event_id,
        value: capiEvent.custom_data.value,
        response: parsed,
        error,
        capiEvent,
      };
    }

    console.log(`${logPrefix} Purchase aceito pelo Meta event_id=${capiEvent.event_id}`);
    return {
      sent: true,
      ok: true,
      http_status: response.status,
      event_id: capiEvent.event_id,
      value: capiEvent.custom_data.value,
      response: parsed,
      capiEvent,
    };
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'timeout de 10s ao chamar a CAPI' : error?.message;
    console.error(`${logPrefix} Falha no Purchase event_id=${capiEvent.event_id}: ${reason}`);
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
