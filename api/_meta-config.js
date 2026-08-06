/**
 * Configuração central do Meta (Pixel + Conversions API) — Camisa10
 * ─────────────────────────────────────────────────────────────────────────────
 * Um único lugar para o Pixel ID e o Access Token usados por todas as
 * serverless functions (api/meta-capi, api/webhook, api/ironpay/webhook,
 * api/register-manual-sale).
 *
 * ORDEM DE PRECEDÊNCIA:
 *   1. process.env.META_PIXEL_ID     / process.env.META_ACCESS_TOKEN  (Vercel)
 *   2. constantes de fallback abaixo
 *
 * ⚠️  ATENÇÃO DE SEGURANÇA
 *   O fallback existe para o site funcionar mesmo sem variável de ambiente.
 *   Como este repositório é público, o ideal é definir META_ACCESS_TOKEN nas
 *   Environment Variables da Vercel e deixar FALLBACK_ACCESS_TOKEN vazio.
 */

const FALLBACK_PIXEL_ID = '2081548536080257';
const FALLBACK_ACCESS_TOKEN =
  'EAAPBlif7QZBgBSOOSZAssYWoPE1Xq0JKvJapdb30r87ZCZB7vwjac4qaIRGoMj9DZCxLx43jD4aOmpDBygS2BUiuR2mrcqCQh2jjuFB2yexhdVDxGB2dCkOMe0FGKJD4k3xPnlwZCI47DFpF0QOT0ZCzqbvTTCZBBQZB7iE2ZBtwM3z7aZBPfcTsZBYvOMOeENGlvQZDZD';

export const META_PIXEL_ID = process.env.META_PIXEL_ID || FALLBACK_PIXEL_ID;
export const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || FALLBACK_ACCESS_TOKEN;
export const META_GRAPH_VERSION = 'v21.0';
export const META_CAPI_URL = `https://graph.facebook.com/${META_GRAPH_VERSION}/${META_PIXEL_ID}/events`;

export default { META_PIXEL_ID, META_ACCESS_TOKEN, META_GRAPH_VERSION, META_CAPI_URL };
