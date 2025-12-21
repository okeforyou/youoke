import { database as db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { PricingPackage } from "../types/subscription";
import { DEFAULT_PRICING_PACKAGES } from "../utils/constants";
import {
  ServiceResult,
  ServiceError,
  success,
  failure,
  retryWithResult,
  withFirestore,
  logServiceOperation,
  SimpleCache,
} from "../utils/serviceHelper";

const PRICING_COLLECTION = "pricing";

// Use SimpleCache instead of custom cache
const pricingCache = new SimpleCache<PricingPackage[]>(5 * 60 * 1000); // 5 minutes

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
export async function getPricingPackages(): Promise<ServiceResult<PricingPackage[]>> {
  // Check cache first
  const cached = pricingCache.get("all-packages");
  if (cached) {
    logServiceOperation("getPricingPackages", { source: "cache" });
    return success(cached);
  }

  return retryWithResult(
    async () => {
      return withFirestore(async () => {
        const snapshot = await getDocs(collection(db!, PRICING_COLLECTION));

        if (snapshot.empty) {
          console.log("No pricing in Firestore, initializing with defaults");
          const initResult = await initializePricing();
          if (!initResult.success) {
            return failure(initResult.error!);
          }

          // Cache default packages
          pricingCache.set("all-packages", DEFAULT_PRICING_PACKAGES);
          logServiceOperation("getPricingPackages", { source: "initialized", count: DEFAULT_PRICING_PACKAGES.length });
          return success(DEFAULT_PRICING_PACKAGES);
        }

        const packages = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as PricingPackage[];

        // Update cache
        pricingCache.set("all-packages", packages);
        logServiceOperation("getPricingPackages", { source: "firestore", count: packages.length });
        return success(packages);
      }, "PRICING_FETCH_FAILED", DEFAULT_PRICING_PACKAGES);
    },
    { maxRetries: 2, initialDelay: 500 }
  );
}

/**
 * ดึงแพ็กเกจเดียว
 */
export async function getPricingPackage(planId: string): Promise<ServiceResult<PricingPackage>> {
  const packagesResult = await getPricingPackages();
  if (!packagesResult.success || !packagesResult.data) {
    return failure(packagesResult.error!);
  }

  const pkg = packagesResult.data.find((p) => p.id === planId);
  if (!pkg) {
    return failure(
      new ServiceError(
        `Pricing package not found: ${planId}`,
        "PRICING_NOT_FOUND"
      )
    );
  }

  logServiceOperation("getPricingPackage", { planId });
  return success(pkg);
}

/**
 * Clear pricing cache (useful after admin updates)
 */
export function clearPricingCache(): void {
  pricingCache.clear();
  logServiceOperation("clearPricingCache", { cleared: true });
}

/**
 * สร้างหรืออัปเดตแพ็กเกจ (Admin only)
 */
export async function savePricingPackage(pkg: PricingPackage): Promise<ServiceResult<void>> {
  return withFirestore(async () => {
    const docRef = doc(db!, PRICING_COLLECTION, pkg.id);
    await setDoc(docRef, pkg, { merge: true });

    // Clear cache after update
    clearPricingCache();

    logServiceOperation("savePricingPackage", { planId: pkg.id, price: pkg.price });
    return success(undefined);
  }, "PRICING_SAVE_FAILED");
}

/**
 * อัปเดตราคา (Admin only)
 */
export async function updatePrice(planId: string, newPrice: number): Promise<ServiceResult<void>> {
  return withFirestore(async () => {
    const docRef = doc(db!, PRICING_COLLECTION, planId);
    await updateDoc(docRef, { price: newPrice });

    // Clear cache after update
    clearPricingCache();

    logServiceOperation("updatePrice", { planId, newPrice });
    return success(undefined);
  }, "PRICING_UPDATE_FAILED");
}

/**
 * ลบแพ็กเกจ (Admin only)
 */
export async function deletePricingPackage(planId: string): Promise<ServiceResult<void>> {
  return withFirestore(async () => {
    const docRef = doc(db!, PRICING_COLLECTION, planId);
    await deleteDoc(docRef);

    // Clear cache after delete
    clearPricingCache();

    logServiceOperation("deletePricingPackage", { planId });
    return success(undefined);
  }, "PRICING_DELETE_FAILED");
}

/**
 * Initialize pricing in Firestore (ครั้งแรก)
 */
export async function initializePricing(): Promise<ServiceResult<void>> {
  return withFirestore(async () => {
    console.log("Initializing pricing packages in Firestore...");

    for (const pkg of DEFAULT_PRICING_PACKAGES) {
      const result = await savePricingPackage(pkg);
      if (!result.success) {
        return failure(result.error!);
      }
    }

    console.log("Pricing initialized successfully");
    logServiceOperation("initializePricing", { count: DEFAULT_PRICING_PACKAGES.length });
    return success(undefined);
  }, "PRICING_INIT_FAILED");
}
