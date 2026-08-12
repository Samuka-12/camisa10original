/**
 * Configuração central da Meta (Pixel + Conversions API) — Camisa10.
 *
 * Em produção, META_PIXEL_ID e META_ACCESS_TOKEN devem ser definidos nas
 * variáveis de ambiente da Vercel. Não há valores de fallback no código.
 */

const clean = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
    : '';

export const META_PIXEL_ID = clean(process.env.META_PIXEL_ID);
export const META_ACCESS_TOKEN = clean(process.env.META_ACCESS_TOKEN);
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = META_PIXEL_ID
  ? `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`
  : '';

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
