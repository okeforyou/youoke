import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { adminFirestore } from "@/firebase-admin";

const OMISE_SECRET_KEY = process.env.OMISE_SECRET_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { chargeId } = req.query;

    if (!chargeId || typeof chargeId !== 'string') {
        return res.status(400).json({ error: 'Missing chargeId' });
    }

    try {
        // Retrieve Charge from Omise
        const response = await axios.get(`https://api.omise.co/charges/${chargeId}`, {
            auth: {
                username: OMISE_SECRET_KEY,
                password: ''
            },
            headers: {
                'Omise-Version': '2019-05-29'
            }
        });

        const charge = response.data;
        const isSuccess = charge.status === 'successful';

        if (isSuccess) {
            // AUTO-UPGRADE USER Logic
            // We duplicate the webhook logic here to ensure instant feedback
            // Firestore update is idempotent (safe to run twice)
            try {
                const { userId, packageId, packageName } = charge.metadata;

                if (userId && packageId) {
                    console.log(`✅ Charge ${chargeId} successful. Upgrading user ${userId}...`);

                    // 1. Calculate Expiry
                    const now = new Date();
                    const expiryDate = new Date();

                    // Simple logic: lookup package or hardcode map based on ID logic
                    // Assuming Monthly/Yearly for now based on name checks or ID
                    if (packageId.includes('year') || packageName?.includes('Year') || packageName?.includes('ปี')) {
                        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                    } else if (packageId.includes('life') || packageName?.includes('Life') || packageName?.includes('ถาวร')) {
                        expiryDate.setFullYear(expiryDate.getFullYear() + 99);
                    } else {
                        // Default 30 days
                        expiryDate.setDate(expiryDate.getDate() + 30);
                    }

                    if (adminFirestore) {
                        await adminFirestore.collection('users').doc(userId).set({
                            membership: {
                                type: 'pro', // or vip, depending on mapping
                                status: 'active',
                                sku: packageId,
                                packageName: packageName || 'Premium',
                                expiryDate: expiryDate.toISOString(),
                                updatedAt: new Date().toISOString()
                            }
                        }, { merge: true });
                    }

                    // Log Proof
                    if (adminFirestore) {
                        await adminFirestore.collection('payment_proofs').add({
                            userId: userId,
                            packageId: packageId,
                            packageName: packageName,
                            amount: charge.amount / 100,
                            slipUrl: "AUTO_OMISE_QR",
                            paymentMethod: 'omise_qr',
                            status: 'approved',
                            transactionId: chargeId,
                            createdAt: new Date()
                        });
                    }
                }
            } catch (dbError) {
                console.error("DB Update Failed during Status Check:", dbError);
                // Don't fail the request, just log. Client just wants to know payment is done.
            }
        }

        return res.status(200).json({
            status: charge.status,
            paid: charge.paid,
            data: charge
        });

    } catch (error: any) {
        console.error("Omise Status Check Error:", error.response?.data || error.message);
        return res.status(500).json({ error: 'Failed to check status' });
    }
}
