import type { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore as adminDb } from "@/firebase-admin";
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

/**
 * Omise Webhook Handler
 * 
 * NOTE: You must add this URL to Omise Dashboard -> Events -> Webhooks
 * URL: https://your-domain.com/api/payment/omise-webhook
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const event = req.body;

        console.log(`🔔 Omise Webhook: ${event.key} (${event.id})`);

        if (event.key === 'charge.complete') {
            const charge = event.data;

            if (charge.status === 'successful') {
                const metadata = charge.metadata || {};
                const userId = metadata.userId;
                const packageId = metadata.packageId;

                if (userId && packageId) {
                    console.log(`✅ Payment Success for User: ${userId}, Package: ${packageId}`);

                    // 1. Calculate Expiry
                    // Default to 30 days if not found, or ideally fetch package details.
                    // For MVP stability: 
                    // Pro (day_pass) = 1 day
                    // VIP (monthly) = 30 days
                    // Lifetime = 100 years

                    let daysToAdd = 30;
                    if (packageId === 'day_pass') daysToAdd = 1;
                    if (packageId === 'lifetime') daysToAdd = 36500;

                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

                    // 2. Update User Membership (Secure Write)
                    if (adminDb) {
                        const isDayPass = packageId.toLowerCase().includes('day') || packageId.toLowerCase().includes('trial');
                        const membershipType = packageId === 'lifetime' ? 'lifetime' : (isDayPass ? 'day_pass' : 'monthly');

                        await adminDb.collection('users').doc(userId).update({
                            membership: {
                                type: packageId === 'lifetime' ? 'lifetime' : 'pro',
                                status: 'active',
                                updatedAt: Timestamp.now(),
                                expiresAt: Timestamp.fromDate(expiresAt),
                                packageId: packageId
                            },
                            isPremium: true
                        });

                        // 3. Log Order
                        await adminDb.collection('payment_proofs').add({
                            userId,
                            packageId,
                            amount: charge.amount / 100, // Convert satang back to unit
                            slipUrl: charge.authorize_uri || 'omise_auto',
                            status: 'approved',
                            createdAt: Timestamp.now(),
                            processedAt: Timestamp.now(),
                            processedBy: 'omise_webhook',
                            gatewayId: charge.id,
                            paymentMethod: charge.source?.type || 'credit_card'
                        });
                    }

                    console.log('🎉 User Upgraded Automatically!');
                }
            }
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        console.error("Webhook Error:", error);
        res.status(500).json({ error: error.message });
    }
}
