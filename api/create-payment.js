export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1/transactions';
        const IRONPAY_TOKEN = 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';

        // IronPay espera o valor em centavos (inteiro)
        const amountInCents = Math.round(Number(body.amount) * 100);

        const payload = {
            amount: amountInCents,
            offer_hash: body.offer_hash || 'default_offer',
            payment_method: 'pix',
            installments: 1,
            customer: {
                name: body.client?.name || 'Cliente',
                email: body.client?.email || 'cliente@email.com',
                phone_number: (body.client?.phone || '11999999999').replace(/\D/g, ''),
                document: (body.client?.document || '00000000000').replace(/\D/g, '')
            },
            cart: [
                {
                    product_hash: body.offer_hash || 'default_offer',
                    title: body.product_name || 'Camiseta',
                    price: amountInCents,
                    quantity: 1,
                    operation_type: 1,
                    tangible: true
                }
            ]
        };

        console.log('[create-payment] Enviando para IronPay:', JSON.stringify(payload));

        const response = await fetch(`${IRONPAY_API_URL}?api_token=${IRONPAY_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('[create-payment] Resposta IronPay:', JSON.stringify(data));

        if (!response.ok) {
            const errMsg = data?.message || data?.error || data?.errorDescription || `Erro HTTP ${response.status}`;
            return res.status(response.status).json({ error: errMsg, _raw: data });
        }

        // Extrai o PIX da resposta da IronPay
        const qrCode = data?.pix?.code || data?.pix?.payload || data?.qr_code || '';
        const qrImage = data?.pix?.base64 || data?.pix?.image_url || '';

        // Dispara o evento de initiate_checkout para a xTracky
        const xtrackyToken = "f4d9f616-1acf-4191-bb7c-d03f8a756ce0";
        const xtrackyUrl = `https://api.xtracky.com/api/integrations/api`;
        const xtrackyPayload = {
            token: xtrackyToken,
            orderId: body.identifier || 'camisa10_' + Date.now(),
            amount: Number(body.amount),
            status: 'initiate_checkout',
            customer: {
                email: body.client?.email || '',
                phone: body.client?.phone || '',
                document: body.client?.document || ''
            }
        };

        fetch(xtrackyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xtrackyPayload)
        }).catch(err => console.error('Erro xTracky initiate_checkout:', err.message));

        // Retorna resposta normalizada + raw para debug
        return res.status(200).json({
            pix: {
                code: qrCode,
                base64: qrImage,
                image: qrImage.startsWith('data:image') ? qrImage : (qrImage ? qrImage : `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}`)
            },
            _raw: data
        });

    } catch (error) {
        console.error('[create-payment] Erro:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
