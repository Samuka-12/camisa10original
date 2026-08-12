/**
 * Netlify Function: /api/save-config
 * Salva a configuração da loja no Supabase usando service_role key (contorna RLS).
 */
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
    }
    if (!SUPABASE_KEY) {
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: 'SUPABASE_SERVICE_KEY not configured' }) };
    }

    try {
        const { config } = JSON.parse(event.body || '{}');
        if (!config) {
            return { statusCode: 400, headers: HEADERS, body: JSON.stringify({ error: 'Missing config' }) };
        }
        const configJson = typeof config === 'string' ? config : JSON.stringify(config);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                Prefer: 'resolution=merge-duplicates,return=minimal',
            },
            body: JSON.stringify({ id: CONFIG_UUID, nome: 'store_config', preco: 0, description: configJson }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('save-config supabase error:', response.status, errText);
            return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: errText }) };
        }

        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ success: true }) };
    } catch (err) {
        console.error('save-config exception:', err);
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: String(err) }) };
    }
};
