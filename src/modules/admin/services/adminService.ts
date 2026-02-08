import { db } from "../../../firebase";
import {
    collection,
    query,
    getDocs,
    where,
    orderBy,
    limit,
    doc,
    updateDoc,
    getDoc,
    serverTimestamp,
    Timestamp,
    getCountFromServer
} from "firebase/firestore";

export interface AdminStats {
    totalUsers: number;
    activeSubs: number;
    revenue: number;
    loading: boolean;
}

export const AdminService = {
    /**
     * Get Dashboard Stats (Users, Active Subs, Revenue)
     * optimized to use count() where possible or efficient queries
     */
    getDashboardStats: async (): Promise<AdminStats> => {
        try {
            // 1. Total Users (Use count aggregation if available, else fallback to query)
            // Note: getCountFromServer is cheaper than fetching all docs
            if (!db) return { totalUsers: 0, activeSubs: 0, revenue: 0, loading: false };
            const usersColl = collection(db, "users");
            const snapshot = await getCountFromServer(usersColl);
            const totalUsers = snapshot.data().count;

            // 2. Active Subs & Revenue
            // For active subs, we might need to query. 
            // If the dataset is huge, this should be an aggregation function or stored in a stats doc.
            // For now, we query active users (assuming not millions)
            // Or limit to a reasonable number for estimation if scale is high.

            // Fetch users with active membership
            // Note: This query requires an index on membership.status
            const activeUsersQuery = query(
                collection(db, "users"),
                where("membership.status", "==", "active")
            );
            const activeSnapshot = await getDocs(activeUsersQuery);
            const activeSubs = activeSnapshot.size;

            // Calculate Revenue (Estimate based on active subscriptions)
            // Ideally, we sum up approved payments from the 'payments' or 'orders' collection
            const paymentsQuery = query(
                collection(db, "payment_proofs"), // Using the collection seen in orders.tsx
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
     * Ban or Unban a user
     */
    updateUserBanStatus: async (uid: string, ban: boolean): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            banned: ban,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Manually assign a package to a user
     */
    assignPackage: async (uid: string, packageId: string, adminUid: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, "users", uid);
        const pkgRef = doc(db, "packages", packageId);
        const pkgSnap = await getDoc(pkgRef);

        if (!pkgSnap.exists()) {
            throw new Error("Package not found");
        }

        const pkgData = pkgSnap.data();
        const durationDays = pkgData.durationDays || 30;

        // Calculate Type
        let membershipType = 'monthly';
        if (durationDays <= 3) membershipType = 'day_pass';
        else if (durationDays > 300) membershipType = 'yearly';
        if (durationDays === 0) membershipType = 'lifetime';

        // Calculate Expiry
        let expiresAt: Date | null = new Date();
        if (durationDays === 0) {
            expiresAt = null; // Lifetime
        } else {
            expiresAt.setDate(expiresAt.getDate() + durationDays);
        }

        await updateDoc(userRef, {
            membership: {
                type: membershipType,
                status: 'active',
                startedAt: serverTimestamp(),
                expiresAt: expiresAt,
                pkgId: packageId, // Track which package was assigned
                assignedBy: adminUid
            },
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Assign Lifetime access directly
     */
    assignLifetime: async (uid: string, adminUid: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            membership: {
                type: 'lifetime',
                status: 'active',
                startedAt: serverTimestamp(),
                expiresAt: null,
                assignedBy: adminUid
            },
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Get 6-month Revenue History
     * (Simplified: Fetches recent approved payments and groups client-side)
     */
    getRevenueHistory: async (): Promise<{ name: string; revenue: number }[]> => {
        try {
            // Fetch last 6 months of payments
            // Note: In a real large-scale app, this should be pre-aggregated in a dedicated stats doc.
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1); // Start of month

            if (!db) return [];
            const q = query(
                collection(db, "payment_proofs"),
                where("status", "==", "approved"),
                where("createdAt", ">=", sixMonthsAgo),
                orderBy("createdAt", "asc")
            );

            const snapshot = await getDocs(q);
            const monthlyData: Record<string, number> = {};

            // Initialize last 6 months
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

            // Convert to array and reverse to show chronological order
            // Note: Object keys order isn't guaranteed, so we reconstruct
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
     * Get Weekly User Growth Stats
     */
    getUserGrowthStats: async (): Promise<{ name: string; active: number; new: number }[]> => {
        try {
            // Fetch users created in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
            sevenDaysAgo.setHours(0, 0, 0, 0);

            if (!db) return [];
            const q = query(
                collection(db, "users"),
                where("createdAt", ">=", sevenDaysAgo),
                orderBy("createdAt", "asc")
            );

            const snapshot = await getDocs(q);

            const dailyStats: Record<string, number> = {};

            // Initialize last 7 days keys
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
                    active: 0, // Not easily calculable without active_session tracking
                    new: dailyStats[key] || 0
                });
            }

            return result;
        } catch (error) {
            console.error("Failed to get user stats:", error);
            return [
                { name: "Mon", active: 0, new: 0 }, { name: "Tue", active: 0, new: 0 },
                { name: "Wed", active: 0, new: 0 }, { name: "Thu", active: 0, new: 0 },
                { name: "Fri", active: 0, new: 0 }, { name: "Sat", active: 0, new: 0 },
                { name: "Sun", active: 0, new: 0 }
            ];
        }
    }
};
