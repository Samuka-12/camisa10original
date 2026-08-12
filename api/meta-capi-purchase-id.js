/**
 * Vercel Serverless Function: api/meta-capi-purchase-id
 *
 * Persiste o contexto de atribuição do checkout para que o webhook da IronPay
 * use o mesmo event_id depois da confirmação real do pagamento. Este endpoint
 * não envia Purchase e não atualiza pedidos sem filtro.
 */

import { supabaseConfigured, supabaseRequest } from './_supabase.js';

const headers = () => ({
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
});

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { transaction_id, meta_event_id, fbp = '', fbc = '' } = req.body || {};
  if (!transaction_id || !meta_event_id) {
    return res.status(400).json({ error: 'transaction_id and meta_event_id are required' });
  }
  if (!supabaseConfigured()) {
    return res.status(503).json({ error: 'SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY is not configured' });
  }

  const transactionId = String(transaction_id);
  const context = {
    transaction_id: transactionId,
    meta_event_id: String(meta_event_id),
    fbp: typeof fbp === 'string' ? fbp : '',
    fbc: typeof fbc === 'string' ? fbc : '',
  };

  try {
    const lookup = await supabaseRequest(
      `/rest/v1/checkouts?order_id=eq.${encodeURIComponent(transactionId)}&select=id`,
      { headers: headers() },
    );

    if (lookup.ok) {
      const records = await lookup.json();
      if (Array.isArray(records) && records.length > 0) {
        const update = await supabaseRequest(
          `/rest/v1/checkouts?id=eq.${encodeURIComponent(records[0].id)}`,
          {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify({
              meta_event_id: context.meta_event_id,
              fbp: context.fbp || null,
              fbc: context.fbc || null,
            }),
          },
        );

        if (update.ok) {
          console.log(`[meta-capi-purchase-id] Contexto salvo para transaction_id=${transactionId}`);
          return res.status(200).json({ success: true, source: 'checkout', ...context });
        }
      }
    }

    // Fallback seguro: o webhook consulta este mapeamento caso não exista uma
    // linha de checkout com order_id preenchido. event_id fica em custom_data
    // porque não é uma coluna da tabela meta_events.
    const fallback = await supabaseRequest('/rest/v1/meta_events', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        event_name: 'Purchase_id_mapping',
        custom_data: { ...context, event_id: context.meta_event_id },
        created_at: new Date().toISOString(),
      }),
    });

    if (!fallback.ok) {
      const detail = await fallback.text();
      throw new Error(`Could not persist Purchase mapping: ${detail}`);
    }

    console.log(`[meta-capi-purchase-id] Mapeamento salvo para transaction_id=${transactionId}`);
    return res.status(200).json({ success: true, source: 'mapping', ...context });
  } catch (error) {
    console.error('[meta-capi-purchase-id] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
