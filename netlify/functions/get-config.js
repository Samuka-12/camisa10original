/**
 * Netlify Function: /api/get-config
 * Lê a configuração da loja no Supabase usando service_role key (contorna RLS).
 */
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const CONFIG_UUID = '00000000-0000-0000-0000-000000000000';

const HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
};

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: HEADERS, body: '' };
    if (!SUPABASE_KEY) {
        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ config: null, source: 'no_service_key' }) };
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/produtos?id=eq.${CONFIG_UUID}&select=description&limit=1`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                },
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            console.error('get-config supabase error:', response.status, errText);
            return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: errText }) };
        }

        const data = await response.json();
        if (Array.isArray(data) && data.length > 0 && data[0].description) {
            try {
                return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ config: JSON.parse(data[0].description), source: 'supabase' }) };
            } catch (_) {
                return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ config: null, source: 'parse_error' }) };
            }
        }

        return { statusCode: 200, headers: HEADERS, body: JSON.stringify({ config: null, source: 'not_found' }) };
    } catch (err) {
        console.error('get-config exception:', err);
        return { statusCode: 500, headers: HEADERS, body: JSON.stringify({ error: String(err) }) };
    }
};
