/**
 * Vercel Serverless Function: api/save-config
 * Salva a configuração da loja no Supabase usando service_role key,
 * contornando o RLS da tabela produtos.
 * 
 * POST /api/save-config
 * Body: { config: StoreConfig }
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_KEY not configured in Vercel env vars' });
  }

  try {
    const { config } = req.body;
    if (!config) {
      return res.status(400).json({ error: 'Missing config in request body' });
    }

    const configJson = typeof config === 'string' ? config : JSON.stringify(config);

    // Upsert usando service_role key — contorna RLS completamente
    const response = await fetch(`${SUPABASE_URL}/rest/v1/produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        id: CONFIG_UUID,
        nome: 'store_config',
        preco: 0,
        description: configJson,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase save-config error:', errText);
      return res.status(500).json({ error: errText });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('save-config exception:', err);
    return res.status(500).json({ error: String(err) });
  }
}
