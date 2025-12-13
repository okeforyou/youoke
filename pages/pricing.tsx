import { useRouter } from "next/router";
import { XMarkIcon } from "@heroicons/react/24/solid";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getPricingPackages } from "../services/pricingService";
import { PricingPackage } from "../types/subscription";
import PackageCard from "../components/subscription/PackageCard";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>("yearly");
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  async function loadPackages() {
    try {
      setLoading(true);
      const data = await getPricingPackages();

      // Filter out free plan for pricing page
      const paidPlans = data.filter((p) => p.id !== "free");
      setPackages(paidPlans);

      // Set default selected plan to popular or first paid plan
      const popularPlan = paidPlans.find((p) => p.popular);
      if (popularPlan) {
        setSelectedPlan(popularPlan.id);
      } else if (paidPlans.length > 0) {
        setSelectedPlan(paidPlans[0].id);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (user?.uid) {
      router.push("/account");
    } else {
      router.push("/");
    }
  }

  function handleSelectPlan(planId: string) {
    setSelectedPlan(planId);
  }

  function handleContinue() {
    if (user?.uid) {
      // Logged in users go directly to payment
      router.push(`/payment?plan=${selectedPlan}`);
    } else {
      // Not logged in users go to register
      router.push(`/register?plan=${selectedPlan}`);
    }
  }

  return (
    <>
      <Head>
        <title>เลือกแพ็กเกจ - Oke for You</title>
      </Head>

      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="card bg-base-100 shadow-2xl">
            <div className="card-body p-6 relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 z-10"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 mt-2">
                <h2 className="text-2xl font-bold mb-2">เลือกแพ็กเกจของคุณ</h2>
                <p className="text-sm text-base-content/60">
                  ปลดล็อกทุกฟีเจอร์และเริ่มร้องคาราโอเกะแบบไม่มีขีดจำกัด!
                </p>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                </div>
              )}

              {/* Package Options - Grid Layout */}
              {!loading && packages.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`transition-all ${
                          selectedPlan === pkg.id ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""
                        }`}
                      >
                        <PackageCard
                          plan={pkg}
                          isCurrentPlan={false}
                          onSelect={handleSelectPlan}
                          maxFeatures={5}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={handleContinue}
                    disabled={!selectedPlan}
                    className="btn btn-primary btn-block btn-lg"
                  >
                    ดำเนินการต่อ
                  </button>
                </>
              )}

              {/* Empty State */}
              {!loading && packages.length === 0 && (
                <div className="text-center py-12 text-base-content/60">
                  <p>ไม่พบแพ็กเกจที่ใช้งานได้</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
