exports.handler = async (event, context) => {
    // Apenas POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' },
            body: ''
        };
    }

    try {
        const body = JSON.parse(event.body);

        const SIGILO_SECRET_KEY = '0akz7eyk20cmo98ijbv7jpil51kwvyb5g4hru1clsoey7qte7f9xklhjq915qvj9';
        const SIGILO_PUBLIC_KEY = 'samuelcab444_fd963j9ub7kpwenl';
        const SIGILO_API = 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive';

        // SigiloPay espera o amount em centavos (inteiro)
        const amountInCents = Math.round(Number(body.amount) * 100);

        const payload = {
            identifier: body.identifier || 'camisa10_' + Date.now(),
            amount: amountInCents,
            client: body.client
        };

        console.log('[create-payment] Enviando para SigiloPay:', JSON.stringify(payload));

        const response = await fetch(SIGILO_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-secret-key': SIGILO_SECRET_KEY,
                'x-public-key': SIGILO_PUBLIC_KEY
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('[create-payment] Resposta SigiloPay status:', response.status, '| body:', JSON.stringify(data));

        if (!response.ok) {
            const errMsg = data?.message || data?.error || data?.errorDescription || `Erro HTTP ${response.status}`;
            return {
                statusCode: response.status,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: errMsg, _raw: data })
            };
        }

        // Normaliza o nó pix: suporta data.pix, data.order.pix, data.data.pix, campos na raiz
        const pixNode =
            data?.pix ??
            data?.order?.pix ??
            data?.data?.pix ??
            data?.transaction?.pix ??
            (data?.qr_code || data?.qrCode || data?.pixCopiaECola ? data : null);

        // Extrai o código copia-e-cola de qualquer campo possível
        const qrCode =
            pixNode?.code ??
            pixNode?.payload ??
            pixNode?.emv ??
            pixNode?.qrCode ??
            pixNode?.qrcode ??
            pixNode?.qr_code ??
            pixNode?.pixCopiaECola ??
            data?.pixCopiaECola ??
            data?.qr_code ??
            '';

        // Extrai imagem base64 de qualquer campo possível
        const rawBase64 =
            pixNode?.base64 ??
            pixNode?.image ??
            pixNode?.imageBase64 ??
            data?.qr_code_base64 ??
            '';

        const qrImage = rawBase64
            ? (rawBase64.startsWith('data:image') ? rawBase64 : 'data:image/png;base64,' + rawBase64)
            : '';

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pix: {
                    code: qrCode,
                    base64: rawBase64,
                    image: qrImage
                },
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