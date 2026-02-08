import { db } from "../firebase";
import {
    collection,
    query,
    getDocs,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    orderBy
} from "firebase/firestore";

export interface Package {
    id: string;
    name: string;
    price: number;
    durationDays: number; // 0 = Lifetime
    features: string[];
    isPopular?: boolean;
    isActive: boolean;
    createdAt?: any;
}

const PACKAGES_COLLECTION = "packages";

export const PackageService = {
    /**
     * Get all packages
     */
    getAllPackages: async (): Promise<Package[]> => {
        if (!db) return [];
        const q = query(
            collection(db, PACKAGES_COLLECTION),
            orderBy("price", "asc") // Ordered by price typically
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Package));
    },

    /**
     * Create a new package
     */
    createPackage: async (pkg: Omit<Package, "id" | "createdAt">, customId?: string): Promise<string> => {
        if (!db) throw new Error("Firestore not initialized");
        if (customId) {
            const docRef = doc(db, PACKAGES_COLLECTION, customId);
            await import("firebase/firestore").then(m => m.setDoc(docRef, {
                ...pkg,
                createdAt: serverTimestamp()
            }));
            return customId;
        } else {
            const docRef = await addDoc(collection(db, PACKAGES_COLLECTION), {
                ...pkg,
                createdAt: serverTimestamp()
            });
            return docRef.id;
        }
    },

    /**
     * Update an existing package
     */
    updatePackage: async (id: string, updates: Partial<Package>): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, PACKAGES_COLLECTION, id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    },

    /**
     * Delete a package
     */
    deletePackage: async (id: string): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        const docRef = doc(db, PACKAGES_COLLECTION, id);
        await deleteDoc(docRef);
    }
};
