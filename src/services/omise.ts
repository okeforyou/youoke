import Omise from 'omise';

const OMISE_PUBLIC_KEY = process.env.OMISE_PUBLIC_KEY || '';
const OMISE_SECRET_KEY = process.env.OMISE_SECRET_KEY || '';

const omise = Omise({
    publicKey: OMISE_PUBLIC_KEY,
    secretKey: OMISE_SECRET_KEY,
    omiseVersion: '2019-05-29'
});

export interface CreatePaymentLinkParams {
    amount: number; // Amount in THB (e.g. 100)
    title: string;
    description: string;
    userId: string;
    packageId: string;
}

export const OmiseService = {
    /**
     * Create a Payment Link (Easy for QR and Card)
     * This generates a URL that we can redirect the user to.
     */
    createPaymentLink: async (params: CreatePaymentLinkParams) => {
        if (!OMISE_SECRET_KEY) throw new Error("Omise Secret Key is missing");

        // Amount in Satang (multiply by 100)
        const amountSatang = Math.round(params.amount * 100);

        try {
            const link = await new Promise((resolve, reject) => {
                omise.links.create({
                    amount: amountSatang,
                    currency: 'thb',
                    title: params.title,
                    description: params.description,
                    // valid_for_seconds: 3600, // Optional: Expires in 1 hour
                }, (err: any, resp: any) => {
                    if (err) reject(err);
                    else resolve(resp);
                });
            });

            return link as any;
        } catch (error) {
            console.error("Omise Payment Link Error:", error);
            throw error;
        }
    },

    /**
     * Retrieve a Charge (to verify status manually if needed)
     */
    retrieveCharge: async (chargeId: string) => {
        if (!OMISE_SECRET_KEY) throw new Error("Omise Secret Key is missing");

        const charge = await new Promise((resolve, reject) => {
            omise.charges.retrieve(chargeId, (err: any, resp: any) => {
                if (err) reject(err);
                else resolve(resp);
            });
        });
        return charge as any;
    }
};
