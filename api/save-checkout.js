/**
 * Vercel Serverless Function: api/save-checkout
 * Salva e atualiza em tempo real a ficha de checkout no Supabase.
 * 
 * POST /api/save-checkout
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const { checkout_id, ...checkoutData } = body;

    const cleanData = {};
    for (const key of Object.keys(checkoutData)) {
      if (checkoutData[key] !== undefined && checkoutData[key] !== null) {
        cleanData[key] = checkoutData[key];
      }
    }

    let url = `${SUPABASE_URL}/rest/v1/checkouts`;
    let method = 'POST';
    let headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=representation'
    };

    if (checkout_id) {
      url = `${SUPABASE_URL}/rest/v1/checkouts?id=eq.${checkout_id}`;
      method = 'PATCH';
    } else {
      cleanData.created_at = new Date().toISOString();
    }

    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(cleanData)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[save-checkout] Supabase error:', errText);
      return res.status(500).json({ error: errText });
    }

    const data = await response.json();
    const savedRecord = Array.isArray(data) ? data[0] : data;
    const returnId = savedRecord?.id || checkout_id;

    return res.status(200).json({ success: true, id: returnId, record: savedRecord });
  } catch (err) {
    console.error('[save-checkout] Exception:', err);
    return res.status(500).json({ error: String(err) });
  }
}
