/**
 * Configuração central da Meta (Pixel + Conversions API) — Camisa10.
 *
 * Em produção, META_PIXEL_ID e META_ACCESS_TOKEN devem ser definidos nas
 * variáveis de ambiente da Vercel. Não há valores de fallback no código.
 */

const FALLBACK_PIXEL_ID = '1849061053135385';
const FALLBACK_ACCESS_TOKEN = 'EAAShZBao6WZCUBSvisOPGbh3AAJX6uUKMHikodDrgvyaCsXKaF6NV7FfTJBIVE8Xe8piNU3TZBYVilhbtgoZAmcG9rWixu7iezeswXDDciZB8JLOFWaoO3e0JkvWICS5BafczhmedvVlW4rHShY8q637XUQgb2hfJZCJwQ8vwgPFxwUAwh03LWMIUZA0VGfrwZDZD';

const clean = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
    : '';

export const META_PIXEL_ID = clean(process.env.META_PIXEL_ID) || FALLBACK_PIXEL_ID;
export const META_ACCESS_TOKEN = clean(process.env.META_ACCESS_TOKEN) || FALLBACK_ACCESS_TOKEN;
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
