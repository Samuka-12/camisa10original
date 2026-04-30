export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Method not allowed');
    }

    try {
        const payload = req.body;
        console.log('Webhook recebido:', payload);

        return res.status(200).json({ received: true });

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
