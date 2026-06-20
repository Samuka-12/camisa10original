export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        const payload = req.body;
        console.log('Webhook recebido da IronPay:', payload);

        // Dispara o evento de webhook para a xTracky
        const xtrackyToken = "f4d9f616-1acf-4191-bb7c-d03f8a756ce0";
        const xtrackyUrl = `https://api.xtracky.com/api/integrations/api`;

        // IronPay envia status como: paid, refunded, pending, waiting_payment
        console.log('[Webhook] Payload completo:', JSON.stringify(payload));

        const statusOriginal = payload.status || payload.data?.status || 'pending';
        const isPaid = ['paid', 'approved', 'PAID', 'authorized', 'paid_out'].includes(statusOriginal);

        // Prepara o payload no formato esperado pelo xTracky
        const xtrackyPayload = {
            token: xtrackyToken,
            orderId: payload.id || payload.transaction_id || 'IRONPAY-' + Date.now(),
            amount: payload.amount ? payload.amount / 100 : 0, // IronPay retorna em centavos
            status: isPaid ? 'paid' : (payload.status || 'pending'),
            customer: {
                email: payload.customer?.email || '',
                phone: payload.customer?.phone_number || payload.customer?.phone || '',
                document: payload.customer?.document || ''
            },
            raw_payload: payload
        };

        console.log('Disparando Webhook para xTracky:', xtrackyPayload);

        await fetch(xtrackyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(xtrackyPayload)
        }).catch(err => console.error('Erro ao enviar para xTracky:', err.message));

        return res.status(200).json({ received: true, forwarded_to_xtracky: true });

    } catch (error) {
        console.error('Erro no processamento do webhook:', error);
        return res.status(500).json({ error: error.message });
    }
}
