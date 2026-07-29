/**
 * Vercel Serverless Function: api/meta-capi
 * ─────────────────────────────────────────────────────────────────────────────
 * Recebe eventos do frontend e os envia para a API de Conversões do Meta (CAPI).
 * Também persiste cada evento na tabela `meta_events` do Supabase.
 */

const PIXEL_ID     = process.env.META_PIXEL_ID     || '2081548536080257';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD';
const SUPABASE_URL = process.env.SUPABASE_URL      || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

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

  const capiEvent = {
    event_name:        eventName,
    event_time:        payload.event_time        || Math.floor(Date.now() / 1000),
    event_source_url:  payload.event_source_url  || '',
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

  // Limpa campos vazios
  Object.keys(capiEvent.user_data).forEach(k => {
    if (!capiEvent.user_data[k]) delete capiEvent.user_data[k];
  });

  let capiResult = null;

  if (ACCESS_TOKEN) {
    try {
      const fbRes = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: [capiEvent],
          test_event_code: 'TEST93083', // Código de teste solicitado pelo usuário
        }),
      });
      capiResult = await fbRes.json();
      console.log(`[api/meta-capi] ${eventName} ->`, JSON.stringify(capiResult));
    } catch (err) {
      console.error('[api/meta-capi] CAPI error:', err.message);
    }
  }

  await saveEventToSupabase(eventName, capiEvent, capiResult);

  return res.status(200).json({ ok: true, event: eventName, capi: capiResult });
}
