exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method not allowed' };
    }

    try {
        const payload = JSON.parse(event.body);

        // Valida a assinatura do webhook (se a SigiloPay enviar)
        // const signature = event.headers['x-sigilopay-signature'];

        console.log('Webhook recebido:', payload);

        // Processa o pagamento (salvar no banco, enviar email, etc)
        // ...

        return {
            statusCode: 200,
            body: JSON.stringify({ received: true })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};