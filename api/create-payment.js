export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        const SIGILO_SECRET_KEY = '0akz7eyk20cmo98ijbv7jpil51kwvyb5g4hru1clsoey7qte7f9xklhjq915qvj9';
        const SIGILO_PUBLIC_KEY = 'samuelcab444_fd963j9ub7kpwenl';
        const SIGILO_API = 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive';

        // SigiloPay espera o valor em Reais (float/decimal), ex: 139.90
        const amountInReais = Number(body.amount);

        const payload = {
            identifier: body.identifier || 'camisa10_' + Date.now(),
            amount: amountInReais,
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
        console.log('[create-payment] Resposta SigiloPay:', JSON.stringify(data));

        if (!response.ok) {
            const errMsg = data?.message || data?.error || data?.errorDescription || `Erro HTTP ${response.status}`;
            return res.status(response.status).json({ error: errMsg, _raw: data });
        }

        // Normaliza o nó pix para o frontend encontrar independente do formato da resposta
        // Suporta: data.pix, data.order.pix, data.data.pix, data.transaction.pix, raiz direto
        const pixNode =
            data?.pix ??
            data?.order?.pix ??
            data?.data?.pix ??
            data?.transaction?.pix ??
            (data?.qr_code || data?.qrCode || data?.pixCopiaECola ? data : null);

        // Extrai o código copia-e-cola de onde estiver
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

        // Extrai a imagem base64 de onde estiver
        const rawBase64 =
            pixNode?.base64 ??
            pixNode?.image ??
            pixNode?.imageBase64 ??
            data?.qr_code_base64 ??
            '';

        const qrImage = rawBase64
            ? (rawBase64.startsWith('data:image') ? rawBase64 : 'data:image/png;base64,' + rawBase64)
            : '';

        // Retorna resposta normalizada + raw para debug
        return res.status(200).json({
            pix: {
                code: qrCode,
                base64: rawBase64,
                image: qrImage,
            },
            _raw: data
        });

    } catch (error) {
        console.error('[create-payment] Erro:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
