import { database as db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { PricingPackage } from "../types/subscription";
import { DEFAULT_PRICING_PACKAGES } from "../utils/constants";

const PRICING_COLLECTION = "pricing";

// In-memory cache for pricing packages (reduces Firestore reads)
let pricingCache: PricingPackage[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Re-export subscription utility functions for backward compatibility
export {
  calculateExpiryDate,
  isSubscriptionExpired,
  getDaysRemaining,
} from "../utils/subscription";

/**
 * ดึงราคาทั้งหมดจาก Firestore
 * ถ้ายังไม่มีข้อมูล จะใช้ค่า default
 * Uses 5-minute in-memory cache to reduce Firestore reads
 */
export async function getPricingPackages(): Promise<PricingPackage[]> {
  try {
    // Check cache first
    const now = Date.now();
    if (pricingCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return pricingCache;
    }

    if (!db) {
      console.warn("Firebase not initialized, using default pricing");
      return DEFAULT_PRICING_PACKAGES;
    }

    const snapshot = await getDocs(collection(db, PRICING_COLLECTION));

    if (snapshot.empty) {
      console.log("No pricing in Firestore, initializing with defaults");
      await initializePricing();
      // Cache default packages
      pricingCache = DEFAULT_PRICING_PACKAGES;
      cacheTimestamp = Date.now();
      return DEFAULT_PRICING_PACKAGES;
    }

    const packages = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as PricingPackage[];

    // Update cache
    pricingCache = packages;
    cacheTimestamp = Date.now();

    return packages;
  } catch (error) {
    console.error("Error fetching pricing:", error);
    // Return cached data if available, otherwise defaults
    return pricingCache || DEFAULT_PRICING_PACKAGES;
  }
}

/**
 * ดึงแพ็กเกจเดียว
 */
export async function getPricingPackage(planId: string): Promise<PricingPackage | null> {
  try {
    const packages = await getPricingPackages();
    return packages.find((pkg) => pkg.id === planId) || null;
  } catch (error) {
    console.error("Error fetching pricing package:", error);
    return null;
  }
}

/**
 * Clear pricing cache (useful after admin updates)
 */
export function clearPricingCache(): void {
  pricingCache = null;
  cacheTimestamp = 0;
}

/**
 * สร้างหรืออัปเดตแพ็กเกจ (Admin only)
 */
export async function savePricingPackage(pkg: PricingPackage): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, PRICING_COLLECTION, pkg.id);
  await setDoc(docRef, pkg, { merge: true });

  // Clear cache after update
  clearPricingCache();
}

/**
 * อัปเดตราคา (Admin only)
 */
export async function updatePrice(planId: string, newPrice: number): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, PRICING_COLLECTION, planId);
  await updateDoc(docRef, { price: newPrice });

  // Clear cache after update
  clearPricingCache();
}

/**
 * ลบแพ็กเกจ (Admin only)
 */
export async function deletePricingPackage(planId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, PRICING_COLLECTION, planId);
  await deleteDoc(docRef);

  // Clear cache after delete
  clearPricingCache();
}

/**
 * Initialize pricing in Firestore (ครั้งแรก)
 */
export async function initializePricing(): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  console.log("Initializing pricing packages in Firestore...");

  for (const pkg of DEFAULT_PRICING_PACKAGES) {
    await savePricingPackage(pkg);
  }

  console.log("Pricing initialized successfully");
}
