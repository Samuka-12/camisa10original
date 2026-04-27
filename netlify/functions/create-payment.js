exports.handler = async (event, context) => {
    // Só aceita POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { amount, customer } = JSON.parse(event.body);

        // Chama a API da SigiloPay
        const response = await fetch('https://api.sigilopay.com/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.SIGILOPAY_SECRET_KEY}` // Chave secreta
            },
            body: JSON.stringify({
                amount,
                customer,
                // outros dados necessários
            })
        });

        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};