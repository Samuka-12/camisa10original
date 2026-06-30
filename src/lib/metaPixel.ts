/**
 * Meta Pixel + Conversions API (CAPI) — Camisa10
 * Pixel ID: 4980340808962720
 *
 * Este módulo centraliza todos os eventos do Meta Pixel (browser) e
 * prepara os payloads para a API de Conversões (server-side via Netlify Function).
 *
 * Estratégia de rastreamento:
 *  - PageView       → toda troca de rota (Index, Categoria, Produto)
 *  - ViewContent    → página de produto visualizada
 *  - AddToCart      → produto adicionado ao carrinho
 *  - InitiateCheckout → entrada na página de checkout
 *  - Purchase       → pagamento confirmado (Pix pago / Cartão aprovado)
 *  - Contact        → clique no botão WhatsApp (X1)
 *  - Lead           → cadastro / registro de usuário
 */

export const META_PIXEL_ID = '4980340808962720';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MetaEventData {
  event_name: string;
  event_time?: number;
  event_source_url?: string;
  user_data?: {
    em?: string;   // email (hash SHA-256)
    ph?: string;   // phone (hash SHA-256)
    fn?: string;   // first name (hash SHA-256)
    ln?: string;   // last name (hash SHA-256)
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;  // fbclid cookie
    fbp?: string;  // _fbp cookie
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_name?: string;
    content_type?: string;
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    num_items?: number;
    order_id?: string;
    [key: string]: unknown;
  };
  action_source?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Lê o cookie _fbp gerado pelo Pixel do Meta */
export function getFbp(): string {
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match ? match[1] : '';
}

/** Lê / persiste o fbc a partir do parâmetro fbclid na URL */
export function getFbc(): string {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    try { localStorage.setItem('_fbc', fbc); } catch (_) { /* noop */ }
    return fbc;
  }
  try { return localStorage.getItem('_fbc') || ''; } catch (_) { return ''; }
}

/** Hash SHA-256 simples para dados do usuário (PII) */
export async function sha256(value: string): Promise<string> {
  if (!value) return '';
  const clean = value.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Client-side (fbq) ────────────────────────────────────────────────────────

/** Dispara evento via fbq (browser Pixel) */
export function fbqTrack(eventName: string, params?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, params || {});
    }
  } catch (err) {
    console.warn('[MetaPixel] fbq error:', err);
  }
}

/** Dispara evento customizado via fbq */
export function fbqTrackCustom(eventName: string, params?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, params || {});
    }
  } catch (err) {
    console.warn('[MetaPixel] fbq custom error:', err);
  }
}

// ─── Server-side (CAPI via Netlify Function) ──────────────────────────────────

/**
 * Envia evento para a API de Conversões do Meta via Netlify Function.
 * A função server-side adiciona o access_token e faz o POST para
 * https://graph.facebook.com/v19.0/{pixel_id}/events
 */
export async function sendCapiEvent(payload: MetaEventData): Promise<void> {
  try {
    const body = {
      ...payload,
      event_time: payload.event_time || Math.floor(Date.now() / 1000),
      event_source_url: payload.event_source_url || window.location.href,
      action_source: payload.action_source || 'website',
      user_data: {
        ...payload.user_data,
        fbc: payload.user_data?.fbc || getFbc(),
        fbp: payload.user_data?.fbp || getFbp(),
        client_user_agent: navigator.userAgent,
      },
    };

    await fetch('/.netlify/functions/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.warn('[MetaPixel] CAPI error:', err);
  }
}

// ─── Eventos de alto nível ────────────────────────────────────────────────────

/** PageView — dispara em toda troca de rota */
export async function trackPageView(userData?: MetaEventData['user_data']): Promise<void> {
  fbqTrack('PageView');
  await sendCapiEvent({ event_name: 'PageView', user_data: userData });
}

/** ViewContent — produto visualizado */
export async function trackViewContent(opts: {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  const params = {
    content_ids: [opts.productId],
    content_name: opts.productName,
    content_type: 'product',
    value: opts.price,
    currency: opts.currency || 'BRL',
  };
  fbqTrack('ViewContent', params);
  await sendCapiEvent({
    event_name: 'ViewContent',
    user_data: opts.userData,
    custom_data: params,
  });
}

/** AddToCart — produto adicionado ao carrinho */
export async function trackAddToCart(opts: {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
  currency?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  const params = {
    content_ids: [opts.productId],
    content_name: opts.productName,
    content_type: 'product',
    value: opts.price * (opts.quantity || 1),
    currency: opts.currency || 'BRL',
    contents: [{ id: opts.productId, quantity: opts.quantity || 1, item_price: opts.price }],
  };
  fbqTrack('AddToCart', params);
  await sendCapiEvent({
    event_name: 'AddToCart',
    user_data: opts.userData,
    custom_data: params,
  });
}

/** InitiateCheckout — entrada no checkout */
export async function trackInitiateCheckout(opts: {
  value: number;
  numItems: number;
  contentIds: string[];
  currency?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  const params = {
    value: opts.value,
    num_items: opts.numItems,
    content_ids: opts.contentIds,
    currency: opts.currency || 'BRL',
  };
  fbqTrack('InitiateCheckout', params);
  await sendCapiEvent({
    event_name: 'InitiateCheckout',
    user_data: opts.userData,
    custom_data: params,
  });
}

/** Purchase — compra confirmada */
export async function trackPurchase(opts: {
  orderId: string;
  value: number;
  contentIds: string[];
  numItems: number;
  currency?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  const params = {
    order_id: opts.orderId,
    value: opts.value,
    num_items: opts.numItems,
    content_ids: opts.contentIds,
    currency: opts.currency || 'BRL',
  };
  fbqTrack('Purchase', params);
  await sendCapiEvent({
    event_name: 'Purchase',
    user_data: opts.userData,
    custom_data: params,
  });
}

/** Contact — clique no botão WhatsApp (X1) */
export async function trackWhatsAppContact(opts?: {
  source?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  fbqTrack('Contact', { source: opts?.source || 'whatsapp_x1' });
  await sendCapiEvent({
    event_name: 'Contact',
    user_data: opts?.userData,
    custom_data: { source: opts?.source || 'whatsapp_x1' },
  });
}

/** Lead — cadastro de usuário */
export async function trackLead(opts?: {
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  fbqTrack('Lead');
  await sendCapiEvent({
    event_name: 'Lead',
    user_data: opts?.userData,
  });
}
