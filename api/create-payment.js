export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const body = req.body;
        
        const SIGILO_SECRET_KEY = '0akz7eyk20cmo98ijbv7jpil51kwvyb5g4hru1clsoey7qte7f9xklhjq915qvj9';
        const SIGILO_PUBLIC_KEY = 'samuelcab444_fd963j9ub7kpwenl';
        const SIGILO_API = 'https://app.sigilopay.com.br/api/v1/gateway/pix/receive';

        const response = await fetch(SIGILO_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'x-secret-key': SIGILO_SECRET_KEY,
                'x-public-key': SIGILO_PUBLIC_KEY
            },
            body: JSON.stringify({
                identifier: body.identifier || 'camisa10_' + Date.now(),
                amount: body.amount,
                client: body.client
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.message || 'Erro ao gerar PIX' });
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
