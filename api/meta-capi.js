/**
 * Vercel Serverless Function: api/meta-capi
 * ─────────────────────────────────────────────────────────────────────────────
 * Recebe eventos do frontend e os envia para a API de Conversões do Meta (CAPI).
 * Também persiste cada evento na tabela `meta_events` do Supabase.
 *
 * Producao: Eventos enviados DIRETAMENTE ao Meta (sem test_event_code).
 * Para testar, use /api/meta-capi/test — essa rota é que envia test_event_code.
 */

import { META_PIXEL_ID, META_ACCESS_TOKEN, META_CAPI_URL } from './_meta-config.js';
const PIXEL_ID     = META_PIXEL_ID;
const ACCESS_TOKEN = META_ACCESS_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const CAPI_URL     = META_CAPI_URL;

async function saveEventToSupabase(eventName, payload, capiResponse) {
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
        event_id:      payload.event_id      || null,
        event_time:    payload.event_time,
        source_url:    payload.event_source_url || null,
        fbc:           payload.user_data?.fbc   || null,
        fbp:           payload.user_data?.fbp   || null,
        email_hash:    payload.user_data?.em    || null,
        phone_hash:    payload.user_data?.ph    || null,
        custom_data:   payload.custom_data      || null,
        capi_response: capiResponse             || null,
        action_source: payload.action_source    || 'website',
        utm_source:    payload.custom_data?.utm_source    || null,
        utm_medium:    payload.custom_data?.utm_medium    || null,
        utm_campaign:  payload.custom_data?.utm_campaign  || null,
        created_at:    new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('[api/meta-capi] Supabase save error:', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body || {};
  const eventName = payload.event_name;

  if (!eventName) {
    return res.status(400).json({ error: 'event_name required' });
  }

  // Purchase deve vir exclusivamente da confirmação de pagamento recebida da
  // IronPay em /api/ironpay/webhook. Assim, Pix gerado ou checkout iniciado
  // jamais é contabilizado como venda pela CAPI.
  if (eventName === 'Purchase') {
    return res.status(403).json({
      error: 'Purchase must be sent by the IronPay payment-confirmation webhook.',
    });
  }

  const capiEvent = {
    event_name:        eventName,
    event_time:        payload.event_time        || Math.floor(Date.now() / 1000),
    event_source_url:  payload.event_source_url  || 'https://camisa10original.com.br',
    action_source:     payload.action_source     || 'website',
    user_data: {
      client_user_agent: payload.user_data?.client_user_agent || req.headers['user-agent'] || '',
      client_ip_address: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '',
      fbc: payload.user_data?.fbc || '',
      fbp: payload.user_data?.fbp || '',
      em:  payload.user_data?.em  || '',
      ph:  payload.user_data?.ph  || '',
      fn:  payload.user_data?.fn  || '',
      ln:  payload.user_data?.ln  || '',
    },
    custom_data: payload.custom_data || {},
  };

  // Usa event_id do frontend se disponível (deduplicação)
  if (payload.event_id) {
    capiEvent.event_id = payload.event_id;
  }

  // Limpa campos vazios
  Object.keys(capiEvent.user_data).forEach(k => {
    if (!capiEvent.user_data[k]) delete capiEvent.user_data[k];
  });

  let capiResult = null;

  if (ACCESS_TOKEN) {
    try {
      // Timeout de 10s para evitar serverless timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const fbRes = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [capiEvent],
          // test_event_code NÃO incluído aqui — eventos vão para produção
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      capiResult = await fbRes.json();
      console.log(`[api/meta-capi] ${eventName} (event_id: ${capiEvent.event_id || 'none'}) ->`, JSON.stringify(capiResult));
    } catch (err) {
      console.error('[api/meta-capi] CAPI error:', err.message);
    }
  }

  await saveEventToSupabase(eventName, capiEvent, capiResult);

  return res.status(200).json({ ok: true, event: eventName, capi: capiResult });
}
