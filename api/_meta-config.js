/**
 * Configuração central da Meta (Pixel + Conversions API) — Camisa10.
 *
 * Em produção, META_PIXEL_ID e META_ACCESS_TOKEN devem ser definidos nas
 * variáveis de ambiente da Vercel. Não há valores de fallback no código.
 */

const FALLBACK_PIXEL_ID = '1075822341637086';
const FALLBACK_ACCESS_TOKEN = 'EAGLXg6ZBWf4IBSELWxmYxwCp0SpbUXIBzqLbG3LRqtog1lhCnZBfFCiNGXILFLLKZAsr9ocgfjKFHBGE3kZAJLZBwKoQl3Qx9ZC72svOEFZBd3AIyuALWNxuCCZBAwBkRcatDUUOqEGB3bJOGPY50QvR5lJOjr1GZCWxaSHExedPcjM6tLcdmGP0HtPRNUQQljHn4qIVIM97ZCTZCKxn75BYkAuj2sr2H3Ewi8eQPrG';

const clean = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^["']|["']$/g, '').replace(/[\r\n\s]/g, '')
    : '';

export const META_PIXEL_ID = clean(process.env.META_PIXEL_ID) || FALLBACK_PIXEL_ID;
export const META_ACCESS_TOKEN = clean(process.env.META_ACCESS_TOKEN) || FALLBACK_ACCESS_TOKEN;
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
