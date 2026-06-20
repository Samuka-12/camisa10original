export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        const payload = req.body;
        console.log('Webhook recebido da SigiloPay:', payload);

        // Dispara o evento de webhook para a xTracky
        const xtrackyToken = "f4d9f616-1acf-4191-bb7c-d03f8a756ce0";
        const xtrackyUrl = `https://api.xtracky.com/api/integrations/api`;

        // Prepara o payload no formato esperado pelo xTracky
        const xtrackyPayload = {
            token: xtrackyToken,
            orderId: payload.identifier || payload.id || 'TESTE-' + Date.now(),
            amount: payload.amount || 0,
            status: payload.status === 'PAID' || payload.status === 'paid' || payload.status === 'approved' ? 'paid' : (payload.status || 'pending'),
            customer: {
                email: payload.client?.email || payload.customer?.email || '',
                phone: payload.client?.phone || payload.customer?.phone || '',
                document: payload.client?.document || payload.customer?.document || ''
            },
            raw_payload: payload // Repassa o body original para debug
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
