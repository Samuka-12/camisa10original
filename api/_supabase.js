/**
 * Cliente mínimo server-side do Supabase para rotas privadas.
 *
 * A tabela meta_events possui RLS e aceita auditoria apenas com service_role.
 * Nunca usa a chave pública do navegador para inserir, consultar deduplicação ou
 * gravar respostas da CAPI.
 */

export const SUPABASE_URL = 'https://xnadtzeyynoblrbncltt.supabase.co';

const candidateKeys = [
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  process.env.SUPABASE_SERVICE_KEY,
].filter((value) => typeof value === 'string' && value.trim());

const keys = [...new Set(candidateKeys.map((value) => value.trim()))];

export function supabaseConfigured() {
  return keys.length > 0;
}

export async function supabaseRequest(path, options = {}) {
  if (!supabaseConfigured()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_KEY is required for server-side audit access.');
  }

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
