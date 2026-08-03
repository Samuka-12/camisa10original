/**
 * Vercel Serverless Function: api/meta-capi-purchase-id
 * ─────────────────────────────────────────────────────────────────────────────
 * Salva o meta_event_id associado a uma transaction_id no Supabase.
 * O webhook da IronPay usa esse registro para enviar o mesmo event_id
 * na CAPI (deduplicação com o evento Pixel fbq).
 *
 * POST /api/meta-capi-purchase-id
 * Body: { transaction_id: string, meta_event_id: string }
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || '';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transaction_id, meta_event_id } = req.body || {};

  if (!transaction_id || !meta_event_id) {
    return res.status(400).json({ error: 'transaction_id and meta_event_id are required' });
  }

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured' });
  }

  try {
    // Atualiza o checkout com o meta_event_id
    const response = await fetch(`${SUPABASE_URL}/rest/v1/checkouts`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        meta_event_id: meta_event_id,
      }),
    });

    // A IronPay transaction_id é usado como identificador
    // Tentamos encontrar pelo campo order_id (se existir) ou criamos um registro
    // Primeiro, tenta atualizar por status
    const findRes = await fetch(`${SUPABASE_URL}/rest/v1/checkouts?order_id=eq.${transaction_id}&select=id`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (findRes.ok) {
      const records = await findRes.json();
      if (records.length > 0) {
        // Atualiza o registro encontrado
        await fetch(`${SUPABASE_URL}/rest/v1/checkouts?id=eq.${records[0].id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ meta_event_id }),
        });
        console.log(`[meta-capi-purchase-id] Salvo meta_event_id=${meta_event_id} para order_id=${transaction_id}`);
      } else {
        // Se não encontrou, salva na tabela meta_event_ids como fallback
        await fetch(`${SUPABASE_URL}/rest/v1/meta_events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            event_name: 'Purchase_id_mapping',
            event_id: meta_event_id,
            custom_data: { transaction_id, meta_event_id },
            created_at: new Date().toISOString(),
          }),
        });
        console.log(`[meta-capi-purchase-id] Salvo como fallback: transaction_id=${transaction_id}, meta_event_id=${meta_event_id}`);
      }
    }

    return res.status(200).json({ success: true, meta_event_id });
  } catch (err) {
    console.error('[meta-capi-purchase-id] Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
