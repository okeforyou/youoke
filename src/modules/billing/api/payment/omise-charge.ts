import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Get keys directly from env to ensure they are fresh
const OMISE_PUBLIC_KEY = process.env.OMISE_PUBLIC_KEY || '';
const OMISE_SECRET_KEY = process.env.OMISE_SECRET_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { amount, packageName, userId, packageId } = req.body;

        // Security: Validate User Ownership (Basic implementation)
        // Ideally we should verify ID Token here too, similar to create-profile
        // For now, we ensure parameters are strictly present
        if (!amount || !userId || !packageName || !packageId) {
            return res.status(400).json({ error: 'Missing parameters: amount, userId, packageName, or packageId' });
        }

        // Validate amount is a positive number
        if (isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const amountSatang = Math.round(Number(amount) * 100);

        console.log(`Creating PromptPay QR for: ${amountSatang} satang`);

        // Create Charge with Source type 'promptpay'
        // API Version 2019-05-29 is required for Source
        const response = await axios.post('https://api.omise.co/charges', {
            amount: amountSatang,
            currency: 'thb',
            source: {
                type: 'promptpay'
            },
            metadata: {
                userId: userId,
                packageId: packageId,
                packageName: packageName,
                orderId: `ORD-${Date.now()}`
            }
        }, {
            auth: {
                username: OMISE_SECRET_KEY,
                password: ''
            },
            headers: {
                'Omise-Version': '2019-05-29'
            }
        });

        const charge = response.data;

        // Extract QR Code URL
        const qrImage = charge.source?.scannable_code?.image?.download_uri;

        if (!qrImage) {
            console.error("Omise Response Missing QR:", JSON.stringify(charge, null, 2));
            return res.status(500).json({ error: 'Failed to generate QR Code from Omise' });
        }

        return res.status(200).json({
            chargeId: charge.id,
            qrImage: qrImage,
            status: charge.status,
            amount: charge.amount
        });

    } catch (error: any) {
        console.error("Omise Charge Error:", error.response?.data || error.message);
        return res.status(500).json({
            error: error.message || 'Payment Creation Failed',
            details: error.response?.data
        });
    }
}
