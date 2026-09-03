/**
 * Netlify Function: netlify/functions/save-checkout.js
 * Salva e atualiza em tempo real a ficha de checkout no Supabase.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
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
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: errText })
      };
    }

    const data = await response.json();
    const savedRecord = Array.isArray(data) ? data[0] : data;
    const returnId = savedRecord?.id || checkout_id;

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: returnId, record: savedRecord })
    };
  } catch (err) {
    console.error('[save-checkout] Exception:', err);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err) })
    };
  }
};
