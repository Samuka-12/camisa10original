/**
 * Vercel Serverless Function: api/meta-purchase-debug
 *
 * Endpoint de diagnóstico EXCLUSIVO do fluxo Purchase.
 * Não altera nenhum outro evento.
 *
 * GET  /api/meta-purchase-debug
 *      → mostra se META_PIXEL_ID e META_ACCESS_TOKEN estão sendo lidos do
 *        ambiente (valores mascarados) e valida o token no Graph API.
 *
 * GET  /api/meta-purchase-debug?send=1&secret=<IRONPAY_TOKEN>
 *      → além do acima, envia um Purchase de teste (value 0.01) e devolve a
 *        resposta crua do Meta, para identificar rejeições.
 */

import { readMetaCredentials, sendPurchaseToMeta } from './_meta-purchase.js';
import { META_GRAPH_VERSION } from './_meta-config.js';

const LOG = '[meta-purchase-debug]';
const SECRET = process.env.IRONPAY_TOKEN || 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xnadtzeyynoblrbncltt.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

/** Persiste o Purchase na tabela meta_events para o dashboard do Admin. */
async function saveEventToSupabase(capiEvent, capiResponse) {
  if (!SUPABASE_KEY || !capiEvent) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/meta_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        event_name: capiEvent.event_name,
        event_id: capiEvent.event_id || null,
        event_time: capiEvent.event_time,
        source_url: capiEvent.event_source_url || null,
        email_hash: capiEvent.user_data?.em || null,
        phone_hash: capiEvent.user_data?.ph || null,
        custom_data: capiEvent.custom_data || null,
        capi_response: capiResponse || null,
        action_source: capiEvent.action_source || 'website',
        created_at: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error(`${LOG} Supabase save error:`, err.message);
  }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pixelId, accessToken, pixelSource, tokenSource } = readMetaCredentials(LOG);

  const result = {
    env: {
      META_PIXEL_ID_present: !!process.env.META_PIXEL_ID,
      META_ACCESS_TOKEN_present: !!process.env.META_ACCESS_TOKEN,
      pixel_id_in_use: pixelId || null,
      pixel_id_source: pixelSource,
      access_token_source: tokenSource,
      access_token_length: accessToken ? accessToken.length : 0,
      access_token_suffix: accessToken ? `…${accessToken.slice(-6)}` : null,
      META_TEST_EVENT_CODE: process.env.META_TEST_EVENT_CODE || null,
      graph_version: META_GRAPH_VERSION,
    },
    token_check: null,
    test_purchase: null,
  };

  if (accessToken) {
    try {
      const dbg = await fetch(
        `https://graph.facebook.com/${META_GRAPH_VERSION}/debug_token?input_token=${accessToken}&access_token=${accessToken}`,
      );
      const body = await dbg.json();
      const data = body?.data || {};
      result.token_check = {
        http_status: dbg.status,
        is_valid: data.is_valid ?? false,
        type: data.type ?? null,
        app_id: data.app_id ?? null,
        expires_at: data.expires_at ?? null,
        scopes: data.scopes ?? null,
        granular_targets: data.granular_scopes?.flatMap((s) => s.target_ids || []) ?? null,
        error: body?.error?.message || null,
      };
      if (result.token_check.granular_targets && pixelId) {
        result.token_check.token_covers_pixel =
          result.token_check.granular_targets.includes(String(pixelId));
      }
    } catch (err) {
      console.error(`${LOG} debug_token falhou:`, err.message);
      result.token_check = { error: err.message };
    }
  }

  const body = (req.method === 'POST' && req.body && typeof req.body === 'object') ? req.body : {};
  const sendFlag = req.query?.send === '1' || body.send === 1 || body.send === '1' || body.send === true;

  if (sendFlag) {
    const secret = req.query?.secret || body.secret;
    if (secret !== SECRET) {
      return res.status(401).json({ ...result, error: 'secret inválido para envio de teste' });
    }

    // Venda real (manual) quando os dados chegam no corpo; caso contrário, purchase de teste.
    const hasRealSale = Number(body.value) > 0;
    const orderId = body.order_id || `DEBUG-${Date.now()}`;
    const valueReais = hasRealSale ? Number(body.value) : 0.01;
    const quantity = Number(body.quantity) > 0 ? Number(body.quantity) : 1;

    result.mode = hasRealSale ? 'manual_sale' : 'test';
    result.test_purchase = await sendPurchaseToMeta(
      {
        id: orderId,
        status: 'paid',
        payment_method: body.payment_method || 'manual',
        // normalizeAmount interpreta inteiros como centavos
        amount: Math.round(valueReais * 100),
        customer: {
          email: body.email || 'debug@camisa10original.com.br',
          phone_number: body.phone || '11999999999',
          name: body.name || 'Debug Teste',
        },
      },
      {
        logPrefix: LOG,
        client_user_agent: req.headers['user-agent'],
        metaEventId: body.event_id || undefined,
        eventSourceUrl: body.event_source_url || undefined,
        customData: {
          currency: body.currency || 'BRL',
          num_items: quantity,
          content_ids: body.content_ids || [body.product_name || orderId],
          content_name: body.product_name || undefined,
          contents: [
            {
              id: (body.content_ids && body.content_ids[0]) || body.product_name || orderId,
              quantity,
              item_price: Math.round((valueReais / quantity) * 100) / 100,
            },
          ],
        },
      },
    );

    if (result.test_purchase?.capiEvent) {
      await saveEventToSupabase(result.test_purchase.capiEvent, result.test_purchase.response || null);
    }
  }

  return res.status(200).json(result);
}
