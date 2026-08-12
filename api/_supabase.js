/**
 * Cliente mínimo server-side do Supabase.
 *
 * A chave pública abaixo é a mesma usada pelo cliente do painel e não é um
 * segredo. A chave de serviço configurada na Vercel tem prioridade; o fallback
 * só é usado quando uma variável configurada responde 401.
 */

// Mantém o mesmo projeto Supabase usado pelo cliente público e pelo painel.
export const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';
const PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuYWR0emV5eW5vYmxyYm5jbHR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NjUxNjksImV4cCI6MjEwMTI0MTE2OX0.rRFwNQn_AjcY48QmaDczfww0ND3R5MC0_6UzumAJhzM';

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
