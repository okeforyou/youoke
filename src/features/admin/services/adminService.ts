import { db, realtimeDb } from "../../../../firebase";
import {
    collection,
    query,
    getDocs,
    where,
    orderBy,
    doc,
    updateDoc,
    getDoc,
} from "firebase/firestore";
import {
    ref,
    get,
    child,
    update,
    serverTimestamp as rtdbServerTimestamp
} from "firebase/database";

export interface AdminStats {
    totalUsers: number;
    activeSubs: number;
    revenue: number;
    loading: boolean;
}

export const AdminService = {
    /**
     * Get Dashboard Stats (Users from RTDB, Revenue from Firestore)
     */
    /**
     * Get Dashboard Stats (Users from Firestore, Revenue from Firestore)
     */
    getDashboardStats: async (): Promise<AdminStats> => {
        try {
            if (!db) return { totalUsers: 0, activeSubs: 0, revenue: 0, loading: false };

            // 1. Total Users (From Firestore)
            // Using getCount for efficiency if available, or fallback to size
            // const usersColl = collection(db, "users");
            // const snapshot = await getCountFromServer(usersColl); // Need to import getCountFromServer? Let's check imports.
            // Simplified: Query Active Users
            const usersQuery = query(collection(db, "users"));
            const usersSnapshot = await getDocs(usersQuery);
            const totalUsers = usersSnapshot.size;

            let activeSubs = 0;
            usersSnapshot.forEach(doc => {
                const user = doc.data();
                if (user.membership?.status === 'active' || user.isPremium === true) {
                    activeSubs++;
                }
            });

            // 2. Revenue (From Firestore 'payments' collection)
            const paymentsQuery = query(
                collection(db, "payments"), // Note: Collection name check - verify if 'payments' or 'payment_proofs'
                where("status", "==", "approved")
            );
            const paymentsSnapshot = await getDocs(paymentsQuery);
            let revenue = 0;
            paymentsSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.amount) revenue += Number(data.amount);
            });

            return {
                totalUsers,
                activeSubs,
                revenue,
                loading: false
            };
        } catch (error) {
            console.error("AdminService.getDashboardStats error:", error);
            return { totalUsers: 0, activeSubs: 0, revenue: 0, loading: false };
        }
    },

    /**
     * Ban or Unban a user (Firestore)
     */
    updateUserBanStatus: async (uid: string, ban: boolean): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            banned: ban,
            updatedAt: new Date() // Firestore timestamp ideally, but Date works
        });
    },

    /**
     * Manually assign a package to a user (Firestore Update)
     */
    assignPackage: async (uid: string, packageId: string, adminUid: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");

        // Simplified logic: Assuming standard packages exist (monthly, yearly)
        let durationDays = 30;
        let membershipType = 'monthly';

        if (packageId.includes('year')) {
            durationDays = 365;
            membershipType = 'yearly';
        } else if (packageId.includes('life')) {
            durationDays = 0;
            membershipType = 'lifetime';
        } else if (packageId.includes('day')) {
            durationDays = 1;
            membershipType = 'day_pass';
        }

        // Calculate Expiry
        const now = new Date();
        let expiresAt: Date | null = new Date();
        if (durationDays === 0) {
            expiresAt = null; // Lifetime
        } else {
            expiresAt.setDate(now.getDate() + durationDays);
        }

        // 2. Update User (Firestore)
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            membership: {
                type: membershipType,
                status: 'active',
                startedAt: now,
                expiresAt: expiresAt,
                pkgId: packageId,
                assignedBy: adminUid
            },
            isPremium: true,
            tier: membershipType,
            updatedAt: now
        });

        // 3. Sync to Realtime Database
        if (realtimeDb) {
            try {
                const rtdbUserRef = ref(realtimeDb, `users/${uid}`);
                const rtdbSubscription = {
                    plan: membershipType,
                    status: 'active',
                    startDate: now.toISOString(),
                    endDate: expiresAt ? expiresAt.toISOString() : null
                };

                await update(rtdbUserRef, {
                    role: 'premium',
                    tier: membershipType,
                    subscription: rtdbSubscription,
                    updatedAt: rtdbServerTimestamp()
                });
                console.log("✅ Synced package assignment to RealtimeDB for user:", uid);
            } catch (e) {
                console.error("❌ Failed to sync to RealtimeDB:", e);
            }
        }
    },

    /**
     * Assign Lifetime access directly (Firestore)
     */
    assignLifetime: async (uid: string, adminUid: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");

        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            membership: {
                type: 'lifetime',
                status: 'active',
                startedAt: new Date(),
                expiresAt: null,
                assignedBy: adminUid
            },
            isPremium: true,
            tier: 'lifetime',
            updatedAt: new Date()
        });

        // Sync to Realtime Database
        if (realtimeDb) {
            try {
                const rtdbUserRef = ref(realtimeDb, `users/${uid}`);
                const rtdbSubscription = {
                    plan: 'lifetime',
                    status: 'active',
                    startDate: new Date().toISOString(),
                    endDate: null
                };

                await update(rtdbUserRef, {
                    role: 'premium',
                    tier: 'lifetime',
                    subscription: rtdbSubscription,
                    updatedAt: rtdbServerTimestamp()
                });
                console.log("✅ Synced lifetime assignment to RealtimeDB for user:", uid);
            } catch (e) {
                console.error("❌ Failed to sync to RealtimeDB:", e);
            }
        }
    },

    /**
     * Get 6-month Revenue History (Firestore 'payments')
     */
    getRevenueHistory: async (): Promise<{ name: string; revenue: number }[]> => {
        try {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);

            if (!db) return [];
            const q = query(
                collection(db, "payments"),
                where("status", "==", "approved"),
                where("createdAt", ">=", sixMonthsAgo),
                orderBy("createdAt", "asc")
            );

            const snapshot = await getDocs(q);
            const monthlyData: Record<string, number> = {};

            for (let i = 0; i < 6; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleString('en-US', { month: 'short' });
                monthlyData[key] = 0;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt && data.amount) {
                    const date = data.createdAt.toDate();
                    const month = date.toLocaleString('en-US', { month: 'short' });
                    if (monthlyData[month] !== undefined) {
                        monthlyData[month] += Number(data.amount);
                    }
                }
            });

            const result = [];
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const key = d.toLocaleString('en-US', { month: 'short' });
                result.push({ name: key, revenue: monthlyData[key] || 0 });
            }

            return result;
        } catch (error) {
            console.error("Failed to get revenue history:", error);
            // Return empty fallback
            return [
                { name: "Jan", revenue: 0 }, { name: "Feb", revenue: 0 },
                { name: "Mar", revenue: 0 }, { name: "Apr", revenue: 0 },
                { name: "May", revenue: 0 }, { name: "Jun", revenue: 0 }
            ];
        }
    },

    /**
     * Get Weekly User Growth Stats (Firestore)
     */
    getUserGrowthStats: async (): Promise<{ name: string; active: number; new: number }[]> => {
        try {
            if (!db) return [];

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            const q = query(
                collection(db, "users"),
                where("createdAt", ">=", sevenDaysAgo),
                orderBy("createdAt", "asc")
            );

            const snapshot = await getDocs(q);

            const dailyStats: Record<string, number> = {};

            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString('en-US', { weekday: 'short' });
                dailyStats[key] = 0;
            }

            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt) {
                    const date = data.createdAt.toDate();
                    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                    // eslint-disable-next-line no-prototype-builtins
                    if (dailyStats.hasOwnProperty(day)) {
                        dailyStats[day]++;
                    }
                }
            });

            const result = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString('en-US', { weekday: 'short' });
                result.push({
                    name: key,
                    active: 0,
                    new: dailyStats[key] || 0
                });
            }

            return result;
        } catch (error) {
            console.error("Failed to get user stats:", error);
            return [];
        }
    },

    getPaymentProofs: async () => {
        if (!db) return [];
        try {
            const q = query(collection(db, "payment_proofs"), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            }));
        } catch (error) {
            console.error("Error fetching payments:", error);
            return [];
        }
    },

    approvePayment: async (paymentId: string, userId: string, packageId: string, adminUid: string) => {
        if (!db) throw new Error("Firebase not initialized");

        // 1. Get Package Details
        const pkgRef = doc(db, "packages", packageId);
        const pkgSnap = await getDocs(query(collection(db, "packages"), where("id", "==", packageId))); // Safety check if using custom ID

        let durationDays = 30;
        let pkgName = "Premium Package";

        // Try to find package
        try {
            const pkgDoc = await getDocs(query(collection(db, "packages"), where("__name__", "==", packageId)));
            if (!pkgDoc.empty) {
                const data = pkgDoc.docs[0].data();
                durationDays = data.durationDays || 30;
                pkgName = data.name || pkgName;
            }
        } catch (e) {
            console.log("Package lookup fallback");
        }

        // 2. Calculate Membership
        const now = new Date();
        let expiresAt: Date | null = new Date();

        if (durationDays === 0) {
            expiresAt = null; // Lifetime
        } else {
            expiresAt.setDate(now.getDate() + durationDays);
        }

        let membershipType = 'monthly';
        if (durationDays <= 3) membershipType = 'day_pass';
        else if (durationDays > 300) membershipType = 'yearly';
        if (durationDays === 0) membershipType = 'lifetime';

        // 3. Update User Membership (Firestore)
        const userRef = doc(db, "users", userId);
        const membershipData = {
            type: membershipType,
            status: 'active',
            startedAt: new Date(), // Use JS Date for Firestore
            expiresAt: expiresAt,
            packageId: packageId,
            assignedBy: adminUid
        };

        await updateDoc(userRef, {
            membership: membershipData,
            role: 'premium', // Sync role naming convention
            isPremium: true,
            tier: membershipType, // Sync tier naming
            updatedAt: new Date()
        });

        // 3.5 Sync to Realtime Database (Critical for Profile Page)
        if (realtimeDb) {
            try {
                const rtdbUserRef = ref(realtimeDb, `users/${userId}`);
                const rtdbSubscription = {
                    plan: membershipType,
                    status: 'active',
                    startDate: new Date().toISOString(),
                    endDate: expiresAt ? expiresAt.toISOString() : null
                };

                await update(rtdbUserRef, {
                    role: 'premium',
                    tier: membershipType,
                    subscription: rtdbSubscription,
                    updatedAt: rtdbServerTimestamp()
                });
                console.log("✅ Synced approval to RealtimeDB for user:", userId);
            } catch (e) {
                console.error("❌ Failed to sync to RealtimeDB:", e);
            }
        }

        // 4. Update Payment Status (Firestore)
        const paymentRef = doc(db, "payment_proofs", paymentId);
        await updateDoc(paymentRef, {
            status: 'approved',
            processedAt: new Date(),
            processedBy: adminUid
        });
    },

    rejectPayment: async (paymentId: string, userId: string, reason: string, adminUid: string) => {
        if (!db) throw new Error("Firebase not initialized");

        const paymentRef = doc(db, "payment_proofs", paymentId);
        await updateDoc(paymentRef, {
            status: 'rejected',
            processedAt: new Date(),
            processedBy: adminUid,
            rejectionReason: reason
        });
    }
};
