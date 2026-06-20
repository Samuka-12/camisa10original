exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const payload = JSON.parse(event.body);

        // Valida a assinatura do webhook (se a SigiloPay enviar)
        // const signature = event.headers['x-sigilopay-signature'];

        console.log('Webhook recebido da IronPay:', payload);
13	
14	        // Dispara o evento de webhook para a xTracky
15	        const xtrackyToken = "f4d9f616-1acf-4191-bb7c-d03f8a756ce0";
16	        const xtrackyUrl = `https://api.xtracky.com/api/integrations/api`;
17	
18	        // IronPay envia status como: paid, refunded, pending, waiting_payment
        // Logamos o payload completo para debug no painel da Netlify
        console.log('[Webhook] Payload completo:', JSON.stringify(payload));

        const statusOriginal = payload.status || payload.data?.status || 'pending';
        const isPaid = ['paid', 'approved', 'PAID', 'authorized', 'paid_out'].includes(statusOriginal);
20	
21	        // Prepara o payload no formato esperado pelo xTracky
22	        const xtrackyPayload = {
23	            token: xtrackyToken,
24	            orderId: payload.id || payload.transaction_id || 'IRONPAY-' + Date.now(),
25	            amount: payload.amount ? payload.amount / 100 : 0, // IronPay retorna em centavos
26	            status: isPaid ? 'paid' : (payload.status || 'pending'),
27	            customer: {
28	                email: payload.customer?.email || '',
29	                phone: payload.customer?.phone_number || payload.customer?.phone || '',
30	                document: payload.customer?.document || ''
31	            },
32	            raw_payload: payload
33	        };
34	
35	        console.log('Disparando Webhook para xTracky:', xtrackyPayload);
36	
37	        await fetch(xtrackyUrl, {
38	            method: 'POST',
39	            headers: {
40	                'Content-Type': 'application/json'
41	            },
42	            body: JSON.stringify(xtrackyPayload)
43	        }).catch(err => console.error('Erro ao enviar para xTracky:', err.message));
44	
45	        return {
46	            statusCode: 200,
47	            body: JSON.stringify({ received: true, forwarded_to_xtracky: true })
48	        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};