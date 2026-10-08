/**
 * Configuração central da Meta (Pixel + Conversions API) — Camisa10.
 *
 * META_ACCESS_TOKEN deve existir somente como variável de ambiente da Vercel.
 * Nunca coloque tokens de acesso no repositório ou em valores de fallback.
 */

const FALLBACK_PIXEL_ID = '1631563528565287';

const clean = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
    : '';

export const META_PIXEL_ID = clean(process.env.META_PIXEL_ID) || FALLBACK_PIXEL_ID;
export const META_ACCESS_TOKEN = clean(process.env.META_ACCESS_TOKEN);
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
