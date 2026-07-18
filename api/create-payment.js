export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;

        const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1/transactions';
        const IRONPAY_TOKEN = process.env.IRONPAY_TOKEN || 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';

        // Validação do valor mínimo antes de chamar a API IronPay
        const amountRaw = Number(body.amount);
        if (!amountRaw || amountRaw < 5) {
            return res.status(400).json({ error: 'O valor da compra precisa ser no mínimo R$ 5,00.' });
        }

        // IronPay espera o valor em centavos (inteiro)
        const amountInCents = Math.round(amountRaw * 100);

        // Determinar o método de pagamento
        const paymentMethod = body.payment_method || 'pix';
        const installments = body.installments || 1;

        // Construir o payload base
        // Se houver cart items (múltiplos produtos), construir array de cart items
        const cartItems = body.cart_items && Array.isArray(body.cart_items) ? body.cart_items : [];
        
        const cart = cartItems.length > 0 
          ? cartItems.map((item, index) => ({
              product_hash: item.product_hash || `product_${index}`,
              title: item.title || 'Produto',
              price: Math.round(Number(item.price) * 100),
              quantity: item.quantity || 1,
              operation_type: 1,
              tangible: true
            }))
          : [{
              product_hash: body.offer_hash || 'default_offer',
              title: body.product_name || 'Camiseta',
              price: amountInCents,
              quantity: 1,
              operation_type: 1,
              tangible: true
            }];

        const payload = {
            amount: amountInCents,
            offer_hash: body.offer_hash || 'default_offer',
            payment_method: paymentMethod,
            installments: installments,
            customer: {
                name: body.client?.name || 'Cliente',
                email: body.client?.email || 'cliente@email.com',
                phone_number: (body.client?.phone || '11999999999').replace(/\D/g, ''),
                document: (body.client?.document || '00000000000').replace(/\D/g, '')
            },
            cart: cart,
            postback_url: process.env.IRONPAY_WEBHOOK_URL || 'https://camisa10original.com.br/api/ironpay/webhook'
        };

        // Se for pagamento com cartão, adicionar os dados do cartão
        if (paymentMethod === 'credit_card' && body.card) {
            payload.card = {
                number: body.card.number?.replace(/\s/g, ''),
                holder_name: body.card.holder_name,
                expiry_month: body.card.expiry_month,
                expiry_year: body.card.expiry_year,
                cvv: body.card.cvv
            };
        }

        console.log('[create-payment] Enviando para IronPay:', JSON.stringify({
            ...payload,
            card: payload.card ? { ...payload.card, number: '****', cvv: '***' } : undefined
        }));

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

        // Construir resposta normalizada
        let responseData = {
            status: 'success',
            transaction_id: data?.id || data?.transaction_id || null,
            payment_method: paymentMethod
        };

        // Se for PIX, incluir dados do QR Code
        if (paymentMethod === 'pix') {
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

            responseData.pix = {
                code: qrCode,
                base64: rawBase64,
                image: qrImage
            };
        }

        // Se for cartão de crédito, incluir status da transação
        if (paymentMethod === 'credit_card') {
            let cardStatus = data?.status || 'pending';
            // Normalizar status
            if (['paid', 'authorized', 'approved', 'captured'].includes(cardStatus.toLowerCase())) {
                cardStatus = 'aprovado';
            } else if (['refused', 'denied', 'declined', 'failed', 'error', 'canceled'].includes(cardStatus.toLowerCase())) {
                cardStatus = 'recusado';
            }
            
            responseData.card = {
                status: cardStatus,
                authorization_code: data?.authorization_code || null,
                last_four: body.card?.number?.slice(-4) || null
            };
        }

        // Dispara o evento de initiate_checkout para a xTracky
        const xtrackyToken = "f4d9f616-1acf-4191-bb7c-d03f8a756ce0";
        const xtrackyUrl = `https://api.xtracky.com/api/integrations/api`;
        const xtrackyPayload = {
            token: xtrackyToken,
            orderId: body.identifier || 'camisa10_' + Date.now(),
            amount: amountRaw,
            status: 'initiate_checkout',
            payment_method: paymentMethod,
            customer: {
                email: body.client?.email || '',
                phone: body.client?.phone || '',
                document: body.client?.document || ''
            },
            tracking: {
                fbclid: body.tracking?.fbclid || '',
                utm_source: body.tracking?.utm_source || '',
                utm_medium: body.tracking?.utm_medium || '',
                utm_campaign: body.tracking?.utm_campaign || '',
                utm_content: body.tracking?.utm_content || '',
                utm_term: body.tracking?.utm_term || ''
            }
        };

        fetch(xtrackyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xtrackyPayload)
        }).catch(err => console.error('Erro xTracky initiate_checkout:', err.message));

        return res.status(200).json({
            ...responseData,
            _raw: data
        });

    } catch (error) {
        console.error('[create-payment] Erro:', error.message);
        return res.status(500).json({ error: error.message });
    }
}
