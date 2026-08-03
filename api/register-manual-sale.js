/**
 * Vercel Serverless Function: api/register-manual-sale
 * ─────────────────────────────────────────────────────────────────────────────
 * Registra uma venda manual no Supabase (tabela checkouts) e dispara
 * o evento Purchase na API de Conversões do Meta (CAPI).
 *
 * POST /api/register-manual-sale
 * Body: {
 *   nome: string,
 *   email: string,
 *   telefone: string,
 *   produto: string,
 *   valor: number,
 *   origem: 'checkout' | 'link_externo' | 'manual' | 'whatsapp' | 'instagram' | 'tiktok' | 'facebook',
 *   observacao?: string
 * }
 *
 * O evento Purchase é enviado com:
 *   - Hashing SHA-256 dos dados pessoais
 *   - event_id único para deduplicação
 *   - custom_data com valor, moeda, order_id
 */

const { createHash } = require('crypto');

const PIXEL_ID     = process.env.META_PIXEL_ID     || '2081548536080257';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || '';

const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

/**
 * Hash SHA-256 de uma string (lowercase, trim)
 */
function sha256(value) {
  if (!value) return '';
  const normalized = String(value).toLowerCase().trim();
  return createHash('sha256').update(normalized).digest('hex');
}

async function saveCheckoutToSupabase(data) {
  if (!SUPABASE_KEY) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        nome_completo: data.nome,
        email: data.email,
        telefone: data.telefone,
        produto_nome: data.produto,
        valor_total: data.valor,
        status: 'paid',
        created_at: new Date().toISOString(),
      }),
    });

    if (response.ok) {
      return await response.json();
    }
    console.error('[register-manual-sale] Supabase save error:', await response.text());
    return null;
  } catch (err) {
    console.error('[register-manual-sale] Supabase save exception:', err.message);
    return null;
  }
}

async function sendCapiPurchase(data, orderId) {
  if (!ACCESS_TOKEN) return null;

  const capiEvent = {
    event_name:       'Purchase',
    event_time:       Math.floor(Date.now() / 1000),
    event_source_url: 'https://camisa10original.com.br',
    action_source:    'website',
    event_id:         `ManualPurchase_${orderId}`,
    user_data: {
      em: sha256(data.email),
      ph: sha256((data.telefone || '').replace(/\D/g, '')),
      fn: sha256((data.nome || '').trim().split(' ')[0]),
      ln: sha256((data.nome || '').trim().split(' ').slice(1).join(' ')),
    },
    custom_data: {
      order_id:    orderId,
      value:       data.valor,
      currency:    'BRL',
      content_ids: [orderId],
      num_items:   1,
    },
  };

  // Limpa campos vazios
  Object.keys(capiEvent.user_data).forEach(k => {
    if (!capiEvent.user_data[k]) delete capiEvent.user_data[k];
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [capiEvent] }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const result = await res.json();
    console.log('[register-manual-sale] CAPI Purchase ->', JSON.stringify(result));

    // Salva no Supabase também
    if (SUPABASE_KEY) {
      await fetch(`${SUPABASE_URL}/rest/v1/meta_events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          event_name:    'Purchase',
          event_id:      capiEvent.event_id,
          event_time:    capiEvent.event_time,
          source_url:    capiEvent.event_source_url,
          email_hash:    capiEvent.user_data.em || null,
          phone_hash:    capiEvent.user_data.ph || null,
          custom_data:   capiEvent.custom_data,
          capi_response: result,
          action_source: 'website',
          created_at:    new Date().toISOString(),
        }),
      });
    }

    return result;
  } catch (err) {
    console.error('[register-manual-sale] CAPI error:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { nome, email, telefone, produto, valor, origem, observacao } = body;

  // Validação
  if (!nome || !produto || !valor) {
    return res.status(400).json({ error: 'Nome, produto e valor são obrigatórios' });
  }

  if (typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ error: 'Valor deve ser um número positivo' });
  }

  try {
    // Gera ID único para o pedido
    const orderId = `MANUAL-${Date.now()}-${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

    const saleData = {
      nome,
      email: email || '',
      telefone: telefone || '',
      produto,
      valor,
      origem: origem || 'manual',
      observacao: observacao || '',
    };

    // 1. Salva no Supabase
    const savedCheckout = await saveCheckoutToSupabase(saleData);

    // 2. Envia Purchase para a CAPI do Meta
    const capiResult = await sendCapiPurchase(saleData, orderId);

    return res.status(200).json({
      success: true,
      order_id: orderId,
      sale: saleData,
      saved_to_supabase: !!savedCheckout,
      capi_sent: !!capiResult,
      capi_response: capiResult,
    });
  } catch (error) {
    console.error('[register-manual-sale] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
