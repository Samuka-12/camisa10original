/**
 * Vercel Serverless Function: api/register-manual-sale
 *
 * Registra uma venda confirmada fora do checkout e envia Purchase pela mesma
 * implementação CAPI usada no webhook da IronPay. A confirmação explícita é
 * obrigatória; esta rota não é chamada por criação de Pix ou checkout iniciado.
 */

import { sendPurchaseToMeta } from './_meta-purchase.js';
import { supabaseConfigured, supabaseRequest } from './_supabase.js';

const LOG = '[register-manual-sale]';

function resolvePublicOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || process.env.VERCEL_URL || 'camisa10original.vercel.app')
    .split(',')[0]
    .trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  return `${proto}://${host}`;
}

const headers = () => ({
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
});

async function saveCheckoutToSupabase(data) {
  if (!supabaseConfigured()) return { saved: false, reason: 'supabase_credentials_missing' };
  try {
    const response = await supabaseRequest('/rest/v1/checkouts', {
      method: 'POST',
      headers: headers(),
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
    if (!response.ok) {
      console.error(`${LOG} Supabase save error:`, await response.text());
      return { saved: false, reason: `supabase_http_${response.status}` };
    }
    return { saved: true };
  } catch (error) {
    console.error(`${LOG} Supabase save exception:`, error.message);
    return { saved: false, reason: 'supabase_request_failed' };
  }
}

async function saveMetaPurchase(purchase) {
  if (!supabaseConfigured() || !purchase?.capiEvent) return { saved: false, reason: 'supabase_credentials_missing' };
  try {
    const event = purchase.capiEvent;
    const response = await supabaseRequest('/rest/v1/meta_events', {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=minimal' },
      body: JSON.stringify({
        event_name: 'Purchase',
        event_id: event.event_id,
        event_time: event.event_time,
        source_url: event.event_source_url || null,
        fbc: event.user_data?.fbc || null,
        fbp: event.user_data?.fbp || null,
        email_hash: event.user_data?.em || null,
        phone_hash: event.user_data?.ph || null,
        custom_data: event.custom_data || null,
        capi_response: purchase.response || null,
        action_source: event.action_source || 'website',
        created_at: new Date().toISOString(),
      }),
    });
    return response.ok
      ? { saved: true }
      : { saved: false, reason: `supabase_http_${response.status}` };
  } catch (error) {
    console.error(`${LOG} Meta audit save exception:`, error.message);
    return { saved: false, reason: 'supabase_request_failed' };
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nome, email, telefone, produto, valor, origem, observacao, confirmed } = req.body || {};
  if (!confirmed) {
    return res.status(400).json({ error: 'A venda precisa estar confirmada antes de enviar Purchase à Meta.' });
  }
  if (!nome || !produto || !valor) {
    return res.status(400).json({ error: 'Nome, produto e valor são obrigatórios' });
  }
  if (typeof valor !== 'number' || valor <= 0) {
    return res.status(400).json({ error: 'Valor deve ser um número positivo' });
  }

  try {
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

    const checkoutAudit = await saveCheckoutToSupabase(saleData);
    const purchase = await sendPurchaseToMeta(
      {
        id: orderId,
        status: 'paid',
        payment_method: 'manual_confirmed',
        amount: Math.round(valor * 100),
        customer: { name: saleData.nome, email: saleData.email, phone_number: saleData.telefone },
      },
      {
        logPrefix: LOG,
        metaEventId: `Purchase_${orderId}`,
        client_user_agent: req.headers['user-agent'] || 'Mozilla/5.0',
        eventSourceUrl: `${resolvePublicOrigin(req)}/checkout`,
        customData: {
          content_ids: [saleData.produto],
          content_name: saleData.produto,
          contents: [{ id: saleData.produto, quantity: 1, item_price: valor }],
          num_items: 1,
        },
      },
    );

    if (!purchase.ok) {
      return res.status(502).json({
        success: false,
        order_id: orderId,
        sale: saleData,
        saved_to_supabase: checkoutAudit.saved,
        capi_sent: purchase.sent,
        capi_response: purchase.response || null,
        event_id: purchase.event_id || null,
        error: purchase.error || 'Meta CAPI rejected Purchase.',
      });
    }

    const metaAudit = await saveMetaPurchase(purchase);
    return res.status(200).json({
      success: true,
      order_id: orderId,
      sale: saleData,
      saved_to_supabase: checkoutAudit.saved,
      capi_sent: true,
      capi_response: purchase.response,
      event_id: purchase.event_id,
      meta_audit: metaAudit,
    });
  } catch (error) {
    console.error(`${LOG} Error:`, error.message);
    return res.status(500).json({ error: error.message });
  }
}
