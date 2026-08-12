/**
 * Vercel Serverless Function: api/register-manual-sale
 *
 * Mantém o registro administrativo de vendas manuais no Supabase. Por regra de
 * rastreamento, esta rota não envia Purchase à Meta: a única fonte de Purchase
 * é o webhook da IronPay após confirmação efetiva do pagamento.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || '';

async function saveCheckoutToSupabase(data) {
  if (!SUPABASE_KEY) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=representation',
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

    if (response.ok) return await response.json();
    console.error('[register-manual-sale] Supabase save error:', await response.text());
    return null;
  } catch (error) {
    console.error('[register-manual-sale] Supabase save exception:', error.message);
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { nome, email, telefone, produto, valor, origem, observacao } = req.body || {};
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

    const savedCheckout = await saveCheckoutToSupabase(saleData);
    return res.status(200).json({
      success: true,
      order_id: orderId,
      sale: saleData,
      saved_to_supabase: !!savedCheckout,
      capi_sent: false,
      capi_response: null,
      meta_reason: 'Purchase is emitted only by the confirmed IronPay webhook.',
    });
  } catch (error) {
    console.error('[register-manual-sale] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
