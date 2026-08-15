/**
 * Vercel Serverless Function: api/meta-capi
 *
 * Recebe somente eventos browser-side autorizados e os encaminha à Meta CAPI.
 * O retorno HTTP reflete a aceitação da Meta; falhas não são mais mascaradas
 * como sucesso. Purchase é exclusivo dos fluxos server-side confirmados.
 */

import { META_PIXEL_ID, META_ACCESS_TOKEN, META_CAPI_URL } from './_meta-config.js';
import { supabaseConfigured, supabaseRequest } from './_supabase.js';

const PIXEL_ID = META_PIXEL_ID;
const ACCESS_TOKEN = META_ACCESS_TOKEN;
const CAPI_URL = META_CAPI_URL;
const BROWSER_EVENTS = new Set(['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Contact', 'Lead']);

async function saveEventToSupabase(eventName, payload, capiResponse) {
  if (!supabaseConfigured()) return { saved: false, reason: 'supabase_credentials_missing' };

  try {
    const response = await supabaseRequest('/rest/v1/meta_events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_name: eventName,
        event_time: payload.event_time,
        source_url: payload.event_source_url || null,
        fbc: payload.user_data?.fbc || null,
        fbp: payload.user_data?.fbp || null,
        email_hash: payload.user_data?.em || null,
        phone_hash: payload.user_data?.ph || null,
        custom_data: {
          ...(payload.custom_data || {}),
          event_id: payload.event_id || null,
        },
        capi_response: capiResponse || null,
        action_source: payload.action_source || 'website',
        utm_source: payload.custom_data?.utm_source || null,
        utm_medium: payload.custom_data?.utm_medium || null,
        utm_campaign: payload.custom_data?.utm_campaign || null,
        created_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('[api/meta-capi] Supabase save error:', detail);
      return { saved: false, reason: `supabase_http_${response.status}` };
    }
    return { saved: true };
  } catch (error) {
    console.error('[api/meta-capi] Supabase save exception:', error.message);
    return { saved: false, reason: 'supabase_request_failed' };
  }
}

function parseMetaResponse(rawText) {
  try {
    return JSON.parse(rawText);
  } catch (_) {
    return { raw: rawText };
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const payload = req.body || {};
  const eventName = payload.event_name;
  if (!BROWSER_EVENTS.has(eventName)) {
    return res.status(403).json({ error: 'Only PageView, ViewContent, AddToCart and InitiateCheckout are accepted here.' });
  }
  if (!payload.event_id || typeof payload.event_id !== 'string') {
    return res.status(400).json({ error: 'event_id is required for Pixel/CAPI deduplication.' });
  }
  if (!PIXEL_ID || !ACCESS_TOKEN || !CAPI_URL) {
    return res.status(503).json({ error: 'Meta CAPI environment variables are not configured.' });
  }

  const capiEvent = {
    event_name: eventName,
    event_time: payload.event_time || Math.floor(Date.now() / 1000),
    event_source_url: payload.event_source_url || 'https://camisa10original.com.br',
    action_source: payload.action_source || 'website',
    event_id: payload.event_id,
    user_data: {
      client_user_agent: payload.user_data?.client_user_agent || req.headers['user-agent'] || '',
      client_ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '',
      fbc: payload.user_data?.fbc || '',
      fbp: payload.user_data?.fbp || '',
      em: payload.user_data?.em || '',
      ph: payload.user_data?.ph || '',
      fn: payload.user_data?.fn || '',
      ln: payload.user_data?.ln || '',
    },
    custom_data: payload.custom_data || {},
  };

  Object.keys(capiEvent.user_data).forEach((key) => {
    if (!capiEvent.user_data[key]) delete capiEvent.user_data[key];
  });

  // Test event code for real-time debugging in Events Manager
  if (process.env.META_TEST_EVENT_CODE) {
    capiEvent.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let metaResponse;
  let metaStatus = 0;

  try {
    const response = await fetch(CAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ data: [capiEvent] }),
      signal: controller.signal,
    });
    metaStatus = response.status;
    metaResponse = parseMetaResponse(await response.text());
  } catch (error) {
    const reason = error?.name === 'AbortError' ? 'Meta CAPI request timed out.' : error.message;
    const audit = await saveEventToSupabase(eventName, capiEvent, { request_error: reason });
    console.error(`[api/meta-capi] ${eventName} request failed:`, reason);
    return res.status(502).json({
      ok: false,
      event: eventName,
      event_id: capiEvent.event_id,
      error: reason,
      audit,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  const accepted = metaStatus >= 200 && metaStatus < 300 && !metaResponse?.error;
  const audit = await saveEventToSupabase(eventName, capiEvent, {
    http_status: metaStatus,
    body: metaResponse,
  });

  if (!accepted) {
    const error = metaResponse?.error?.message || `Meta CAPI returned HTTP ${metaStatus}.`;
    console.error(`[api/meta-capi] ${eventName} rejected event_id=${capiEvent.event_id}: ${error}`);
    return res.status(502).json({
      ok: false,
      event: eventName,
      event_id: capiEvent.event_id,
      upstream_status: metaStatus,
      error,
      capi: metaResponse,
      audit,
    });
  }

  console.log(`[api/meta-capi] ${eventName} accepted event_id=${capiEvent.event_id}`);
  return res.status(200).json({
    ok: true,
    event: eventName,
    event_id: capiEvent.event_id,
    capi: metaResponse,
    audit,
  });
}
