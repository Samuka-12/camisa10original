/**
 * Netlify Function: meta-capi
 * ─────────────────────────────────────────────────────────────────────────────
 * Recebe eventos do frontend e os envia para a API de Conversões do Meta (CAPI).
 * Também persiste cada evento na tabela `meta_events` do Supabase para
 * análise estratégica de funil (entrada via Meta Ads → site → WhatsApp X1).
 *
 * Deduplicação:
 *   O campo `event_id` recebido do frontend é repassado integralmente à CAPI.
 *   O Meta usa esse ID para deduplicar eventos recebidos via Pixel (browser) e
 *   via CAPI (server-side), evitando dupla contagem nas campanhas.
 *
 * Variáveis de ambiente necessárias no Netlify:
 *   META_PIXEL_ID         = 1590849999312410
 *   META_ACCESS_TOKEN     = EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD
 *   SUPABASE_URL          = https://kffjkhyhhjpkwzfrcvzh.supabase.co
 *   SUPABASE_SERVICE_KEY  = (chave service_role do Supabase — maior privilégio)
 */

const PIXEL_ID     = process.env.META_PIXEL_ID     || '1590849999312410';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL      || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Persiste o evento na tabela meta_events do Supabase */
async function saveEventToSupabase(eventName, payload, capiResponse) {
  if (!SUPABASE_KEY) return; // sem chave service, pula silenciosamente
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
    console.error('[meta-capi] Supabase save error:', err.message);
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (_) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const eventName = payload.event_name;
  if (!eventName) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'event_name required' }) };
  }

  // Monta o evento no formato exigido pela CAPI do Meta
  // O campo `event_id` é propagado do frontend para garantir deduplicação
  // com o evento disparado via fbq (Pixel browser) com o mesmo ID
  const capiEvent = {
    event_name:        eventName,
    event_time:        payload.event_time        || Math.floor(Date.now() / 1000),
    event_source_url:  payload.event_source_url  || '',
    action_source:     payload.action_source     || 'website',
    user_data: {
      client_user_agent: payload.user_data?.client_user_agent || event.headers['user-agent'] || '',
      client_ip_address: event.headers['x-forwarded-for']?.split(',')[0]?.trim()
                         || event.headers['x-real-ip']
                         || '',
      fbc: payload.user_data?.fbc || '',
      fbp: payload.user_data?.fbp || '',
      em:  payload.user_data?.em  || '',
      ph:  payload.user_data?.ph  || '',
      fn:  payload.user_data?.fn  || '',
      ln:  payload.user_data?.ln  || '',
    },
    custom_data: payload.custom_data || {},
  };

  // Inclui event_id apenas se fornecido pelo frontend (campo obrigatório para deduplicação)
  if (payload.event_id) {
    capiEvent.event_id = payload.event_id;
  }

  // Remove campos vazios do user_data para não poluir o payload
  Object.keys(capiEvent.user_data).forEach(k => {
    if (!capiEvent.user_data[k]) delete capiEvent.user_data[k];
  });

  let capiResult = null;

  // Envia para a API de Conversões do Meta
  if (ACCESS_TOKEN) {
    try {
      const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [capiEvent],
          test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
        }),
      });
      capiResult = await res.json();
      console.log(`[meta-capi] ${eventName} (event_id: ${capiEvent.event_id || 'n/a'}) →`, JSON.stringify(capiResult));
    } catch (err) {
      console.error('[meta-capi] CAPI send error:', err.message);
    }
  } else {
    console.warn('[meta-capi] META_ACCESS_TOKEN não configurado — evento não enviado ao Meta.');
  }

  // Persiste no Supabase (banco de dados do site)
  await saveEventToSupabase(eventName, { ...capiEvent, event_id: payload.event_id }, capiResult);

  return {
    statusCode: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true, event: eventName, event_id: capiEvent.event_id || null, capi: capiResult }),
  };
};
