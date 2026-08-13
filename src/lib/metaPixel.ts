/**
 * Meta Pixel + Conversions API (CAPI) — Camisa10.
 *
 * Eventos permitidos: PageView, ViewContent, AddToCart, InitiateCheckout e
 * Purchase. Purchase não é emitido pelo navegador: ele é exclusivo do webhook
 * da IronPay após confirmação efetiva do pagamento.
 */

export const META_PIXEL_ID = '1075822341637086';

export type MetaBrowserEvent = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Contact';

const BROWSER_EVENTS = new Set<MetaBrowserEvent>([
  'PageView',
  'ViewContent',
  'AddToCart',
  'InitiateCheckout',
  'Contact',
]);

export interface MetaEventData {
  event_name: MetaBrowserEvent;
  event_id?: string;
  event_time?: number;
  event_source_url?: string;
  user_data?: {
    em?: string;
    ph?: string;
    fn?: string;
    ln?: string;
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_name?: string;
    content_category?: string;
    content_type?: string;
    contents?: Array<{ id: string; quantity: number; item_price?: number }>;
    num_items?: number;
    order_id?: string;
    [key: string]: unknown;
  };
  action_source?: string;
}

export function generateEventId(eventName: string): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return `${eventName}_${ts}_${rand}`;
}

export function getFbp(): string {
  const match = document.cookie.match(/_fbp=([^;]+)/);
  return match ? match[1] : '';
}

export function getFbc(): string {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid');
  if (fbclid) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    try { localStorage.setItem('_fbc', fbc); } catch (_) { /* unavailable storage */ }
    return fbc;
  }
  try { return localStorage.getItem('_fbc') || ''; } catch (_) { return ''; }
}

export async function sha256(value: string): Promise<string> {
  if (!value) return '';
  const clean = value.trim().toLowerCase();
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(clean));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function fbqTrack(
  eventName: MetaBrowserEvent,
  params: Record<string, unknown> = {},
  eventId?: string,
): void {
  try {
    if (typeof window === 'undefined' || !BROWSER_EVENTS.has(eventName) || !(window as any).fbq) return;
    if (eventId) {
      (window as any).fbq('track', eventName, params, { eventID: eventId });
    } else {
      (window as any).fbq('track', eventName, params);
    }
  } catch (error) {
    console.warn('[MetaPixel] Erro no Pixel:', error);
  }
}

/**
 * Envia à CAPI somente os quatro eventos browser-side permitidos. Purchase é
 * construído e enviado exclusivamente pelo webhook server-side da IronPay.
 */
export async function sendCapiEvent(payload: MetaEventData): Promise<void> {
  if (!BROWSER_EVENTS.has(payload.event_name)) return;

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

    const response = await fetch('/api/meta-capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => null);

    if (!response.ok || result?.ok === false) {
      console.warn(`[MetaPixel] CAPI recusou ${payload.event_name}:`, {
        status: response.status,
        event_id: payload.event_id,
        error: result?.error || 'Resposta sem detalhe',
        upstream_status: result?.upstream_status,
      });
    }
  } catch (error) {
    console.warn('[MetaPixel] Erro na CAPI:', error);
  }
}

export async function trackPageView(
  userData?: MetaEventData['user_data'],
  eventId = generateEventId('PageView'),
): Promise<void> {
  fbqTrack('PageView', {}, eventId);
  await sendCapiEvent({ event_name: 'PageView', event_id: eventId, user_data: userData });
}

export async function trackViewContent(opts: {
  productId: string;
  productName: string;
  category?: string;
  price: number;
  currency?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  const eventId = generateEventId('ViewContent');
  const params = {
    content_ids: [opts.productId],
    content_name: opts.productName,
    content_category: opts.category || undefined,
    content_type: 'product',
    value: opts.price,
    currency: opts.currency || 'BRL',
  };
  fbqTrack('ViewContent', params, eventId);
  await sendCapiEvent({ event_name: 'ViewContent', event_id: eventId, user_data: opts.userData, custom_data: params });
}

export async function trackAddToCart(opts: {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
  currency?: string;
  userData?: MetaEventData['user_data'];
}): Promise<void> {
  const quantity = opts.quantity || 1;
  const eventId = generateEventId('AddToCart');
  const params = {
    content_ids: [opts.productId],
    content_name: opts.productName,
    content_type: 'product',
    value: opts.price * quantity,
    currency: opts.currency || 'BRL',
    contents: [{ id: opts.productId, quantity, item_price: opts.price }],
  };
  fbqTrack('AddToCart', params, eventId);
  await sendCapiEvent({ event_name: 'AddToCart', event_id: eventId, user_data: opts.userData, custom_data: params });
}

const IC_STORAGE_KEY = '_c10_initiate_checkout';

export function markInitiateCheckout(eventId: string): void {
  try { sessionStorage.setItem(IC_STORAGE_KEY, JSON.stringify({ id: eventId, t: Date.now() })); } catch (_) { /* unavailable storage */ }
}

export function consumeInitiateCheckoutId(maxAgeMs = 5 * 60 * 1000): string | null {
  try {
    const raw = sessionStorage.getItem(IC_STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(IC_STORAGE_KEY);
    const parsed = JSON.parse(raw) as { id?: string; t?: number };
    return parsed?.id && parsed?.t && Date.now() - parsed.t <= maxAgeMs ? parsed.id : null;
  } catch (_) {
    return null;
  }
}

export async function trackInitiateCheckout(opts: {
  value: number;
  numItems: number;
  contentIds: string[];
  currency?: string;
  userData?: MetaEventData['user_data'];
  eventId?: string;
}): Promise<void> {
  const eventId = opts.eventId || generateEventId('InitiateCheckout');
  const params = {
    value: opts.value,
    num_items: opts.numItems,
    content_ids: opts.contentIds,
    currency: opts.currency || 'BRL',
  };
  fbqTrack('InitiateCheckout', params, eventId);
  await sendCapiEvent({ event_name: 'InitiateCheckout', event_id: eventId, user_data: opts.userData, custom_data: params });
}

/**
 * Evento Contact — disparado quando o usuário clica no botão de WhatsApp.
 */
export async function trackContact(
  userData?: MetaEventData['user_data'],
  eventId = generateEventId('Contact'),
): Promise<void> {
  fbqTrack('Contact', {}, eventId);
  await sendCapiEvent({ event_name: 'Contact', event_id: eventId, user_data: userData });
}
