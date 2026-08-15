/**
 * Configuração central da Meta (Pixel + Conversions API) — Camisa10.
 *
 * Em produção, META_PIXEL_ID e META_ACCESS_TOKEN devem ser definidos nas
 * variáveis de ambiente da Vercel. Não há valores de fallback no código.
 */

const FALLBACK_PIXEL_ID = '1600126648494401';
const FALLBACK_ACCESS_TOKEN = 'EAAiRPJx6S6oBSKhnPn5cAokZCqZBlNGLRrL3NZAzy9N6TYwanvhiAJsMhtRrm4pgZBqQSFpSJRHlSoBucbSP8G9yvxYQqdHkQ7LrGuNfbZARDKmWLLbgdxBG1ysOEypCqgUXjTFPAqCZAko2gkCtPndsDyCcHvVA1LmMyRC1N5ssi5t01WXAKpf1tVkH91WwZDZD';

const clean = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
    : '';

export const META_PIXEL_ID = clean(process.env.META_PIXEL_ID) || FALLBACK_PIXEL_ID;
export const META_ACCESS_TOKEN = clean(process.env.META_ACCESS_TOKEN) || FALLBACK_ACCESS_TOKEN;
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
