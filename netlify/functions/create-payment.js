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
        const IRONPAY_TOKEN = process.env.IRONPAY_TOKEN || 'qoVerJe5Jw33aHINratQw4XFdc4gtQrEPFJ9QE7CRz22JyHupjVT0h8IdmIf';

        // Validação do valor mínimo antes de chamar a API IronPay
        const amountRaw = Number(body.amount);
        if (!amountRaw || amountRaw < 5) {
            return {
                statusCode: 400,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'O valor da compra precisa ser no mínimo R$ 5,00.' })
            };
        }

        // IronPay espera o amount em centavos (inteiro)
        const amountInCents = Math.round(amountRaw * 100);

        // Mapeamento dinâmico de ofertas reais da IronPay para evitar falhas de hashes inexistentes
        const IRONPAY_OFFERS = [
            { hash: 'le2c9v07wt_6a07bll641', price: 500 }, // R$ 5.00
            { hash: 'camisa10_test_xtracky', price: 1000 }, // R$ 10.00
            { hash: 'le2c9v07wt_ugrhokrjd4', price: 8184 }, // R$ 81.84
            { hash: '28774c5c-7b4d-4d2a-b4d2-2d1c274e9df4', price: 8990 }, // R$ 89.90
            { hash: 'le2c9v07wt_gybcv5o9me', price: 9093 }, // R$ 90.93
            { hash: 'le2c9v07wt_v070c04aaj', price: 9093 }, // R$ 90.93
            { hash: 'camisa10_test_offer', price: 9990 }, // R$ 99.90
            { hash: '0d2e2638-9c47-4637-b278-5bef856687fa', price: 10993 }, // R$ 109.93
            { hash: '28774c5c-6fe1-439d-b4d2-2d1c274e9df4', price: 10993 }, // R$ 109.93
            { hash: 'da698fa3-abd8-44ee-afba-b4da0ca4f6a5', price: 10993 }, // R$ 109.93
            { hash: 'le2c9v07wt_qhiquzl8s5', price: 12493 }, // R$ 124.93
            { hash: 'fbb34d6e-519e-4c4c-9961-063302e0a361', price: 12923 }, // R$ 129.23
            { hash: 'ada92365-5b50-486b-b401-c06b1d166905', price: 12993 }, // R$ 129.93
            { hash: 'ad39980c-ae89-4642-9e45-3f77b05a745b', price: 12993 }, // R$ 129.93
            { hash: 'le2c9v07wt_xd5mdq8cxm', price: 16367 }, // R$ 163.67
            { hash: 'le2c9v07wt_zcooucvxh0', price: 18186 }, // R$ 181.86
            { hash: 'le2c9v07wt_sewgxy8qzx', price: 18186 }, // R$ 181.86
            { hash: 'le2c9v07wt_29bj1pj5sl', price: 22686 }, // R$ 226.86
            { hash: 'le2c9v07wt_z8bth3cft4', price: 99000 } // R$ 990.00
        ];

        // Função para encontrar a oferta com o preço mais próximo do amountInCents
        function findBestOffer(cents) {
            let bestOffer = IRONPAY_OFFERS[0];
            let minDiff = Math.abs(cents - bestOffer.price);
            for (let i = 1; i < IRONPAY_OFFERS.length; i++) {
                const diff = Math.abs(cents - IRONPAY_OFFERS[i].price);
                if (diff < minDiff) {
                    minDiff = diff;
                    bestOffer = IRONPAY_OFFERS[i];
                }
            }
            return bestOffer;
        }

        const bestOffer = findBestOffer(amountInCents);
        const resolvedOfferHash = bestOffer.hash;

        // Determinar o método de pagamento
        const paymentMethod = body.payment_method || 'pix';
        const installments = body.installments || 1;

        // Se houver cart items (múltiplos produtos), construir array de cart items
        const cartItems = body.cart_items && Array.isArray(body.cart_items) ? body.cart_items : [];
        
        const cart = cartItems.length > 0 
          ? cartItems.map((item, index) => ({
              product_hash: resolvedOfferHash,
              title: item.title || 'Produto',
              price: Math.round(Number(item.price) * 100),
              quantity: item.quantity || 1,
              operation_type: 1,
              tangible: true
            }))
          : [{
              product_hash: resolvedOfferHash,
              title: body.product_name || 'Camiseta',
              price: amountInCents,
              quantity: 1,
              operation_type: 1,
              tangible: true
            }];

        // Construir o payload base
        const payload = {
            amount: amountInCents,
            offer_hash: resolvedOfferHash,
            payment_method: paymentMethod,
            installments: installments,
            customer: {
                name: body.client?.name || 'Cliente',
                email: body.client?.email || 'cliente@email.com',
                phone_number: (body.client?.phone || '11999999999').replace(/\D/g, ''),
                document: (body.client?.document || '00000000000').replace(/\D/g, '')
            },
            cart: cart,
            postback_url: process.env.IRONPAY_WEBHOOK_URL || 'https://camisa10original.netlify.app/api/ironpay/webhook'
        };

        // Se for pagamento com cartão, adicionar os dados do cartão
        if (paymentMethod === 'credit_card' && body.card) {
            let expMonth = Number(body.card.expiry_month);
            let expYear = Number(body.card.expiry_year);
            if (expYear < 100) expYear += 2000;

            payload.card = {
                number: body.card.number?.replace(/\s/g, ''),
                holder_name: body.card.holder_name,
                exp_month: expMonth,
                exp_year: expYear,
                cvv: String(body.card.cvv || '').trim()
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
        console.log('[create-payment] Resposta IronPay status:', response.status, '| body:', JSON.stringify(data));

        if (!response.ok) {
            const errMsg = data?.message || data?.error || data?.errorDescription || `Erro HTTP ${response.status}`;
            return {
                statusCode: response.status,
                headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: errMsg, _raw: data })
            };
        }

        // Construir resposta normalizada
        // Inclui meta_event_id na resposta para que o frontend confirme o event_id
        // usado na deduplicação entre Pixel (fbq) e CAPI (webhook)
        let responseData = {
            status: 'success',
            transaction_id: data?.id || data?.transaction_id || null,
            payment_method: paymentMethod,
            meta_event_id: body.meta_event_id || null,
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

        // Dispara o evento initiate_checkout para a xTracky
        const xtrackyPayload = {
            token: 'f4d9f616-1acf-4191-bb7c-d03f8a756ce0',
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

        fetch('https://api.xtracky.com/api/integrations/api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(xtrackyPayload)
        }).catch(err => console.error('Erro xTracky:', err.message));

        return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...responseData,
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
