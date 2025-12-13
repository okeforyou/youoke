import { database as db } from "../firebase";
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { PricingPackage, DEFAULT_PRICING_PACKAGES } from "../types/subscription";

const PRICING_COLLECTION = "pricing";

/**
 * ดึงราคาทั้งหมดจาก Firestore
 * ถ้ายังไม่มีข้อมูล จะใช้ค่า default
 */
export async function getPricingPackages(): Promise<PricingPackage[]> {
  try {
    if (!db) {
      console.warn("Firebase not initialized, using default pricing");
      return DEFAULT_PRICING_PACKAGES;
    }

    const snapshot = await getDocs(collection(db, PRICING_COLLECTION));

    if (snapshot.empty) {
      console.log("No pricing in Firestore, initializing with defaults");
      await initializePricing();
      return DEFAULT_PRICING_PACKAGES;
    }

    const packages = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as PricingPackage[];

    return packages;
  } catch (error) {
    console.error("Error fetching pricing:", error);
    return DEFAULT_PRICING_PACKAGES;
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
 * สร้างหรืออัปเดตแพ็กเกจ (Admin only)
 */
export async function savePricingPackage(pkg: PricingPackage): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, PRICING_COLLECTION, pkg.id);
  await setDoc(docRef, pkg, { merge: true });
}

/**
 * อัปเดตราคา (Admin only)
 */
export async function updatePrice(planId: string, newPrice: number): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, PRICING_COLLECTION, planId);
  await updateDoc(docRef, { price: newPrice });
}

/**
 * ลบแพ็กเกจ (Admin only)
 */
export async function deletePricingPackage(planId: string): Promise<void> {
  if (!db) throw new Error("Firebase not initialized");

  const docRef = doc(db, PRICING_COLLECTION, planId);
  await deleteDoc(docRef);
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

/**
 * คำนวณวันหมดอายุจากแพ็กเกจ
 */
export function calculateExpiryDate(plan: PricingPackage, startDate = new Date()): Date | null {
  // Convert duration to number
  const durationDays = typeof plan.duration === 'number'
    ? plan.duration
    : parseInt(String(plan.duration), 10);

  // Check if duration is 0 or invalid
  if (durationDays === 0 || isNaN(durationDays)) {
    // Lifetime or invalid - ไม่มีวันหมดอายุ
    return null;
  }

  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + durationDays);
  return expiryDate;
}

/**
 * เช็คว่าสมาชิกหมดอายุหรือยัง
 */
export function isSubscriptionExpired(endDate: Date | null): boolean {
  if (!endDate) return false; // Lifetime ไม่หมดอายุ

  return new Date() > new Date(endDate);
}

/**
 * คำนวณจำนวนวันที่เหลือ
 */
export function getDaysRemaining(endDate: Date | null): number | null {
  if (!endDate) return null; // Lifetime

  const now = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}
