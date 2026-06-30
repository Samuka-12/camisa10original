/**
 * Vercel Serverless Function: api/webhook
 * Recebe webhooks da IronPay e:
 *  1. Encaminha para xTracky
 *  2. Dispara Purchase na CAPI do Meta
 *  3. Salva no Supabase
 */

const PIXEL_ID     = process.env.META_PIXEL_ID     || '4980340808962720';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || 'EAAShZBr3MwJsBR1DcfngA17838taRRTl67baJJdapxJARjZBrdFMYxZCVBGo4v8KxZAfSG6GwZAPWb98fJyG7O9a4ZB7MZCw1lotpZBsn6U6e9zGypWy6bOa1TReh6fNaa5NBHz10ZBXGZCzmZBLZCb7AITZB7wZCiOfSbQNPZC1RHm17ZAHxGsFDckbVOhM1QvIFUAj6gZDZD';
const SUPABASE_URL = process.env.SUPABASE_URL      || 'https://kffjkhyhhjpkwzfrcvzh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const CAPI_URL     = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

const xtrackyToken = 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0';
const xtrackyUrl   = 'https://api.xtracky.com/api/integrations/api';

async function saveEventToSupabase(eventName, capiEvent, capiResponse) {
  if (!SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/meta_events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        event_name:    eventName,
        event_time:    capiEvent.event_time,
        source_url:    capiEvent.event_source_url || null,
        email_hash:    capiEvent.user_data?.em    || null,
        phone_hash:    capiEvent.user_data?.ph    || null,
        custom_data:   capiEvent.custom_data      || null,
        capi_response: capiResponse               || null,
        action_source: 'website',
        created_at:    new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('[api/webhook] Supabase save error:', err.message);
  }
}

async function sendCapiPurchase(payload, isPaid) {
  if (!ACCESS_TOKEN || !isPaid) return null;
  const amount  = payload.amount ? payload.amount / 100 : 0;
  const orderId = payload.id || payload.transaction_id || 'IRONPAY-' + Date.now();
  const capiEvent = {
    event_name:       'Purchase',
    event_time:       Math.floor(Date.now() / 1000),
    event_source_url: 'https://camisa10original.com.br/checkout',
    action_source:    'website',
    user_data: {
      em: payload.customer?.email || '',
      ph: payload.customer?.phone_number || payload.customer?.phone || '',
    },
    custom_data: {
      order_id:    orderId,
      value:       amount,
      currency:    'BRL',
      content_ids: [orderId],
      num_items:   1,
    },
  };
  Object.keys(capiEvent.user_data).forEach(k => { if (!capiEvent.user_data[k]) delete capiEvent.user_data[k]; });
  try {
    const res = await fetch(`${CAPI_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [capiEvent] }),
    });
    const result = await res.json();
    await saveEventToSupabase('Purchase', capiEvent, result);
    return result;
  } catch (err) {
    console.error('[api/webhook] CAPI error:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const payload = req.body;
    const statusOriginal = payload.status || payload.data?.status || 'pending';
    const isPaid = ['paid', 'approved', 'PAID', 'authorized', 'paid_out'].includes(statusOriginal);

    // 1. xTracky
    const xtrackyPayload = {
      token:   xtrackyToken,
      orderId: payload.id || payload.transaction_id || 'IRONPAY-' + Date.now(),
      amount:  payload.amount ? payload.amount / 100 : 0,
      status:  isPaid ? 'paid' : (payload.status || 'pending'),
      customer: {
        email:    payload.customer?.email        || '',
        phone:    payload.customer?.phone_number || payload.customer?.phone || '',
        document: payload.customer?.document    || '',
      },
      raw_payload: payload,
    };

    fetch(xtrackyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(xtrackyPayload),
    }).catch(err => console.error('Erro xTracky:', err.message));

    // 2. Meta CAPI Purchase
    if (isPaid) {
      await sendCapiPurchase(payload, isPaid);
    }

    return res.status(200).json({ received: true, meta_capi_purchase: isPaid });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
