/**
 * Cliente mínimo server-side do Supabase.
 *
 * A chave pública abaixo é a mesma usada pelo cliente do painel e não é um
 * segredo. A chave de serviço configurada na Vercel tem prioridade; o fallback
 * só é usado quando uma variável configurada responde 401.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoieG5hZHR6ZXl5bm9ibHJibmNsdHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4NTY2NTE2OSwiZXhwIjoyMTAxMjQxMTY5fQ.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

const candidateKeys = [
  process.env.SUPABASE_SERVICE_KEY,
  process.env.VITE_SUPABASE_SERVICE_KEY,
  process.env.VITE_SUPABASE_ANON_KEY,
  PUBLIC_ANON_KEY,
].filter((value) => typeof value === 'string' && value.trim());

const keys = [...new Set(candidateKeys.map((value) => value.trim()))];

export async function supabaseRequest(path, options = {}) {
  let lastResponse = null;

  for (const key of keys) {
    const headers = new Headers(options.headers || {});
    headers.set('apikey', key);
    headers.set('Authorization', `Bearer ${key}`);

    lastResponse = await fetch(`${SUPABASE_URL}${path}`, { ...options, headers });
    if (lastResponse.status !== 401 || key === keys[keys.length - 1]) return lastResponse;
  }

  return lastResponse;
}

export function supabaseConfigured() {
  return keys.length > 0;
}
