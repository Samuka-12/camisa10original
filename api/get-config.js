/**
 * Vercel Serverless Function: api/get-config
 * Lê a configuração da loja no Supabase usando service_role key,
 * contornando o RLS da tabela produtos.
 * 
 * GET /api/get-config
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!SUPABASE_KEY) {
    // Sem service key, retorna null (usar default)
    return res.status(200).json({ config: null, source: 'no_service_key' });
  }

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/produtos?id=eq.${CONFIG_UUID}&select=description&limit=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Supabase get-config error:', errText);
      return res.status(500).json({ error: errText });
    }

    const data = await response.json();
    if (data && data.length > 0 && data[0].description) {
      try {
        const parsed = JSON.parse(data[0].description);
        return res.status(200).json({ config: parsed, source: 'supabase' });
      } catch (parseErr) {
        return res.status(200).json({ config: null, source: 'parse_error' });
      }
    }

    return res.status(200).json({ config: null, source: 'not_found' });
  } catch (err) {
    console.error('get-config exception:', err);
    return res.status(500).json({ error: String(err) });
  }
}
