/**
 * Configuração central da Meta (Pixel + Conversions API) — Camisa10.
 *
 * O token nunca deve ser versionado: em produção, use META_ACCESS_TOKEN nas
 * variáveis de ambiente da Vercel. O Pixel ID pode ter fallback por não ser um
 * segredo, mas a variável META_PIXEL_ID tem precedência.
 */

const FALLBACK_PIXEL_ID = '1075822341637086';
const FALLBACK_ACCESS_TOKEN = '';

const clean = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
    : '';

export const META_PIXEL_ID = clean(process.env.META_PIXEL_ID) || FALLBACK_PIXEL_ID;
export const META_ACCESS_TOKEN = clean(process.env.META_ACCESS_TOKEN) || FALLBACK_ACCESS_TOKEN;
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
