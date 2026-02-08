export interface PaymentSlip {
    id: string;
    userId: string;
    userDisplayName?: string; // Optional: snapshot of user name
    packageId?: string;
    packageName?: string;
    moduleId?: string; // For Marketplace Modules
    moduleName?: string;
    amount: number;
    slipUrl: string;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: any; // Firestore Timestamp
    processedAt?: any;
    processedBy?: string; // Admin ID
    rejectionReason?: string;
}
