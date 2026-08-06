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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

  if (req.query?.send === '1') {
    if (req.query?.secret !== SECRET) {
      return res.status(401).json({ ...result, error: 'secret inválido para envio de teste' });
    }
    result.test_purchase = await sendPurchaseToMeta(
      {
        id: `DEBUG-${Date.now()}`,
        status: 'paid',
        payment_method: 'pix',
        amount: 1,
        customer: { email: 'debug@camisa10original.com.br', phone_number: '11999999999', name: 'Debug Teste' },
      },
      { logPrefix: LOG, client_user_agent: req.headers['user-agent'] },
    );
  }

  return res.status(200).json(result);
}
