exports.handler = async (event, context) => {
    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
            body: ''
        };
    }

    // Apenas POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const body = JSON.parse(event.body);

        const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1/transactions';
        const IRONPAY_TOKEN = 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';

        // IronPay espera o amount em centavos (inteiro)
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
        console.log('[create-payment] Resposta IronPay status:', response.status, '| body:', JSON.stringify(data));

        if (!response.ok) {
            const errMsg = data?.message || data?.error || data?.errorDescription || `Erro HTTP ${response.status}`;
            return {
                statusCode: response.status,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: errMsg, _raw: data })
            };
        }

        // Extrai o PIX da resposta da IronPay
        // A IronPay retorna: data.pix.pix_qr_code (string EMV) e data.pix.qr_code_base64 (pode ser null)
        const qrCode =
            data?.pix?.pix_qr_code ||
            data?.pix?.code ||
            data?.pix?.payload ||
            data?.pix?.emv ||
            data?.pix?.qr_code ||
            data?.qr_code || '';
        const rawBase64 = data?.pix?.qr_code_base64 || data?.pix?.base64 || data?.pix?.image_url || '';
        const qrImage = rawBase64
            ? (rawBase64.startsWith('data:image') ? rawBase64 : 'data:image/png;base64,' + rawBase64)
            : (qrCode ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrCode)}` : '');

        // Dispara o evento initiate_checkout para a xTracky
        const xtrackyPayload = {
            token: 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0',
            orderId: body.identifier || 'camisa10_' + Date.now(),
            amount: Number(body.amount),
            status: 'initiate_checkout',
            customer: {
                email: body.client?.email || '',
                phone: body.client?.phone || '',
                document: body.client?.document || ''
            }
        };

        fetch('https://api.xtracky.com/api/integrations/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xtrackyPayload)
        }).catch(err => console.error('Erro xTracky:', err.message));

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pix: { code: qrCode, base64: rawBase64, image: qrImage },
                _raw: data
            })
        };

    } catch (error) {
        console.error('[create-payment] Erro:', error.message);
        return {
            statusCode: 500,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
};