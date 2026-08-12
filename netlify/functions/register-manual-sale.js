/**
 * Netlify Function: register-manual-sale
 * ─────────────────────────────────────────────────────────────────────────────
 * Registra uma venda confirmada fora do checkout e envia Purchase para a API de
 * Conversões do Meta (CAPI) e salva no Supabase.
 */

const { createHash } = require('crypto');

const PIXEL_ID     = process.env.META_PIXEL_ID     || '1075822341637086';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD';
const SUPABASE_URL = process.env.SUPABASE_URL      || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const CAPI_URL = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;
const LOG = '[register-manual-sale]';

function sha256(value) {
  if (value === null || value === undefined || value === '') return '';
  const normalized = String(value).toLowerCase().trim();
  if (!normalized) return '';
  return createHash('sha256').update(normalized).digest('hex');
}

async function saveCheckoutToSupabase(data) {
  if (!SUPABASE_KEY) return { saved: false, reason: 'supabase_key_missing' };
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        nome_completo: data.nome,
        email: data.email || null,
        telefone: data.telefone || null,
        produto_nome: data.produto,
        valor_total: data.valor,
        status: 'paid',
        created_at: new Date().toISOString(),
      }),
    });
    return { saved: res.ok };
  } catch (error) {
    console.error(`${LOG} Supabase save checkout error:`, error.message);
    return { saved: false, error: error.message };
  }
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
        event_id:      capiEvent.event_id    || null,
        event_time:    capiEvent.event_time,
        source_url:    capiEvent.event_source_url || null,
        email_hash:    capiEvent.user_data?.em || null,
        phone_hash:    capiEvent.user_data?.ph || null,
        custom_data:   capiEvent.custom_data      || null,
        capi_response: capiResponse               || null,
        action_source: 'website',
        created_at:    new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`${LOG} Supabase save event error:`, err.message);
  }
}

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
    return { statusCode: 405, headers: corsHeaders, body: 'Method not allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { nome, email, telefone, produto, valor, origem, confirmed } = body;

    if (!confirmed) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'A venda precisa estar confirmada.' }) };
    }
    if (!nome || !produto || !valor) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: 'Nome, produto e valor sao obrigatorios' }) };
    }

    const valorNum = Number(valor);
    const orderId = `MANUAL-${Date.now()}-${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
    const eventId = `Purchase_${orderId}`;

    // 1. Salvar no Supabase
    const checkoutAudit = await saveCheckoutToSupabase({ nome, email, telefone, produto, valor: valorNum });

    // 2. Disparar CAPI Purchase
    const nameParts = String(nome).trim().split(/\s+/);
    const cleanPhone = String(telefone || '').replace(/\D/g, '');

    const userData = {
      em: sha256(email),
      ph: sha256(cleanPhone),
      fn: sha256(nameParts[0] || ''),
      ln: sha256(nameParts.slice(1).join(' ')),
      external_id: sha256(email || orderId),
      country: sha256('br'),
      client_ip_address: (event.headers && (event.headers['x-forwarded-for'] || event.headers['x-nf-client-connection-ip']) || '').split(',')[0].trim() || '127.0.0.1',
      client_user_agent: (event.headers && event.headers['user-agent']) || 'Mozilla/5.0',
    };
    Object.keys(userData).forEach(k => { if (!userData[k]) delete userData[k]; });

    const capiEvent = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: 'https://camisa10original.com.br/checkout',
      action_source: 'website',
      user_data: userData,
      custom_data: {
        order_id: orderId,
        currency: 'BRL',
        value: valorNum,
        content_type: 'product',
        content_ids: [produto],
        num_items: 1,
        payment_method: origem || 'manual',
      },
    };

    const requestBody = { data: [capiEvent] };
    if (process.env.META_TEST_EVENT_CODE) {
      requestBody.test_event_code = process.env.META_TEST_EVENT_CODE;
    }

    let capiResponse = null;
    let capiSent = false;
    let capiOk = false;
    let errorMsg = null;

    if (ACCESS_TOKEN) {
      try {
        const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        capiResponse = await res.json();
        capiSent = true;
        if (res.ok && !capiResponse.error) {
          capiOk = true;
          console.log(`${LOG} Purchase aceito pelo Meta event_id=${eventId}`);
        } else {
          errorMsg = capiResponse.error?.message || `HTTP ${res.status}`;
          console.error(`${LOG} Meta rejeitou Purchase event_id=${eventId}: ${errorMsg}`);
        }
      } catch (err) {
        errorMsg = err.message;
        console.error(`${LOG} Falha ao enviar Purchase para Meta: ${err.message}`);
      }
    } else {
      errorMsg = 'ACCESS_TOKEN ausente.';
    }

    await saveEventToSupabase('Purchase', capiEvent, capiResponse);

    return {
      statusCode: capiOk ? 200 : 502,
      headers: corsHeaders,
      body: JSON.stringify({
        success: capiOk,
        order_id: orderId,
        saved_to_supabase: checkoutAudit.saved,
        capi_sent: capiSent,
        capi_response: capiResponse,
        event_id: eventId,
        error: errorMsg,
      }),
    };
  } catch (error) {
    console.error(`${LOG} General error:`, error.message);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
