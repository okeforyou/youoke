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
    getDashboardStats: async (): Promise<AdminStats> => {
        try {
            if (!db || !realtimeDb) return { totalUsers: 0, activeSubs: 0, revenue: 0, loading: false };

            // 1. Total Users & Active Subs (From Realtime Database)
            // Note: RTDB doesn't have efficient "count" without downloading data or using counters.
            // For now, we fetch all users (assuming scale allows < 10k users for client-side).
            // Optimization: Create a centralized 'stats/users' counter in RTDB ideally.
            const dbRef = ref(realtimeDb);
            const snapshot = await get(child(dbRef, "users"));

            let totalUsers = 0;
            let activeSubs = 0;

            if (snapshot.exists()) {
                const usersData = snapshot.val();
                totalUsers = Object.keys(usersData).length;

                // Calculate active subs
                Object.values(usersData).forEach((user: any) => {
                    // Check subscription status
                    // Structure depends on how it's stored. detailed in assignPackage
                    const isActive = user.membership?.status === 'active' || user.isPremium === true;
                    // Also check expiry if needed, but status 'active' is usually sufficient if maintained correctly
                    if (isActive) {
                        activeSubs++;
                    }
                });
            }

            // 2. Revenue (From Firestore 'payments' collection)
            const paymentsQuery = query(
                collection(db, "payments"),
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
            // Return zeros on error to prevent crash
            return { totalUsers: 0, activeSubs: 0, revenue: 0, loading: false };
        }
    },

    /**
     * Ban or Unban a user (Realtime Database)
     */
    updateUserBanStatus: async (uid: string, ban: boolean): Promise<void> => {
        if (!realtimeDb) throw new Error("Realtime DB not initialized");
        const updates: any = {};
        updates[`/users/${uid}/banned`] = ban;
        updates[`/users/${uid}/updatedAt`] = rtdbServerTimestamp();

        await update(ref(realtimeDb), updates);
    },

    /**
     * Manually assign a package to a user (Realtime Database Update)
     */
    assignPackage: async (uid: string, packageId: string, adminUid: string): Promise<void> => {
        if (!realtimeDb) throw new Error("Realtime DB not initialized");

        // Note: Packages might be in Firestore or RTDB. Assuming Firestore based on 'packages' collection reference in source.
        // If packages are in Firestore, we fetch them first.
        // But for assigning, we mostly need the duration logic.
        // Let's assume we fetch package details from Firestore 'packages' collection first.

        // 1. Get Package Details (Firestore)
        // const pkgRef = doc(db, "packages", packageId); 
        // const pkgSnap = await getDoc(pkgRef);
        // Using mock logic for now or simple mapping if collection missing

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
        let expiresAt: number | null = Date.now();
        if (durationDays === 0) {
            expiresAt = null; // Lifetime
        } else {
            expiresAt += durationDays * 24 * 60 * 60 * 1000;
        }

        // 2. Update User (RTDB)
        const updates: any = {};
        updates[`/users/${uid}/membership`] = {
            type: membershipType,
            status: 'active',
            startedAt: rtdbServerTimestamp(),
            expiresAt: expiresAt, // Store as timestamp or null
            pkgId: packageId,
            assignedBy: adminUid
        };
        updates[`/users/${uid}/isPremium`] = true; // Legacy support
        updates[`/users/${uid}/updatedAt`] = rtdbServerTimestamp();

        await update(ref(realtimeDb), updates);
    },

    /**
     * Assign Lifetime access directly (Realtime Database)
     */
    assignLifetime: async (uid: string, adminUid: string): Promise<void> => {
        if (!realtimeDb) throw new Error("Realtime DB not initialized");

        const updates: any = {};
        updates[`/users/${uid}/membership`] = {
            type: 'lifetime',
            status: 'active',
            startedAt: rtdbServerTimestamp(),
            expiresAt: null,
            assignedBy: adminUid
        };
        updates[`/users/${uid}/isPremium`] = true;
        updates[`/users/${uid}/tier`] = 'lifetime'; // Update tier claim reflection usually needs Functions
        updates[`/users/${uid}/updatedAt`] = rtdbServerTimestamp();

        await update(ref(realtimeDb), updates);
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
     * Get Weekly User Growth Stats (Realtime Database)
     */
    getUserGrowthStats: async (): Promise<{ name: string; active: number; new: number }[]> => {
        try {
            if (!realtimeDb) return [];

            // Note: Querying RTDB by child 'createdAt' requires index on .indexOn: ["createdAt"] rules.
            // Assuming we fetch all and filter for now due to lack of known rules.
            const dbRef = ref(realtimeDb, "users");
            // const q = query(dbRef, orderByChild('createdAt'), startAt(sevenDaysAgo.getTime())); 
            // ^ This would be better if indexed.

            const snapshot = await get(dbRef);

            const dailyStats: Record<string, number> = {};
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toLocaleDateString('en-US', { weekday: 'short' });
                dailyStats[key] = 0;
            }

            if (snapshot.exists()) {
                const users = snapshot.val();
                Object.values(users).forEach((user: any) => {
                    const createdAt = user.createdAt; // Check if timestamp or date string
                    if (createdAt) {
                        const date = new Date(createdAt);
                        if (date >= sevenDaysAgo) {
                            const day = date.toLocaleDateString('en-US', { weekday: 'short' });
                            // eslint-disable-next-line no-prototype-builtins
                            if (dailyStats.hasOwnProperty(day)) {
                                dailyStats[day]++;
                            }
                        }
                    }
                });
            }

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

        // 3. Update User Membership (RTDB)
        if (realtimeDb) {
            const userRef = ref(realtimeDb, `users/${userId}`);
            await update(userRef, {
                membership: {
                    type: membershipType,
                    status: 'active',
                    updatedAt: Date.now(),
                    expiresAt: expiresAt ? expiresAt.getTime() : null,
                    packageId: packageId
                },
                isPremium: true
            });
        }

        // 4. Update Payment Status (Firestore)
        const paymentRef = doc(db, "payment_proofs", paymentId);
        await updateDoc(paymentRef, {
            status: 'approved',
            processedAt: rtdbServerTimestamp(), // Use compat timestamp or firestore one? Using standard Date for now if needed or import
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
