import { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase';
import { createModulePayment, approveModulePayment } from '@/modules/billing/services/paymentService';
import { getModuleInfo } from '@/config/modules';

/**
 * Mock Checkout API
 * Simulates a payment gateway session creation.
 * In a real app, this would redirect to Omise/Stripe.
 * 
 * Flow:
 * 1. Receive moduleId, userId
 * 2. Create 'pending' payment
 * 3. (Mock) Immediately approve it
 * 4. Return success URL
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { moduleId, userId, userEmail } = req.body;

        if (!moduleId || !userId) {
            return res.status(400).json({ message: 'Missing moduleId or userId' });
        }

        const moduleInfo = getModuleInfo(moduleId);
        if (!moduleInfo) {
            return res.status(404).json({ message: 'Module not found' });
        }

        // 1. Create Pending Payment
        const paymentId = await createModulePayment(
            userId,
            moduleId,
            moduleInfo.name,
            moduleInfo.pricing.priceTHB,
            'mock_slip_url_auto_generated'
        );

        // 2. Mock Process: Auto-Approve immediately
        // In real world, this happens via Webhook later.
        console.log(`[MockCheckout] Auto-approving payment ${paymentId} for ${moduleId}`);
        await approveModulePayment(paymentId, userId, moduleId);

        // 3. Return Success
        return res.status(200).json({
            success: true,
            message: 'Payment Successful',
            redirectUrl: `/store?success=true&moduleId=${moduleId}`
        });

    } catch (error: any) {
        console.error('[MockCheckout] Error:', error);
        return res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
}
