import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { getPricingPackages } from "../services/pricingService";
import { PricingPackage } from "../types/subscription";
import PackageCard from "../components/subscription/PackageCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import LoadingScreen from "../components/layout/LoadingScreen";
import EmptyState from "../components/layout/EmptyState";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";

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

      <AppShell background="gradient" maxWidth="4xl" showBottomNav>
        <PageHeader
          title="เลือกแพ็กเกจของคุณ"
          subtitle="ปลดล็อกทุกฟีเจอร์และเริ่มร้องคาราโอเกะแบบไม่มีขีดจำกัด!"
          showBack
          onBack={handleClose}
        />

        {/* Loading State */}
        {loading && <LoadingScreen variant="inline" text="กำลังโหลดแพ็กเกจ..." />}

        {/* Package Options - Grid Layout */}
        {!loading && packages.length > 0 && (
          <Card variant="elevated">
            <Card.Body>
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
              <Button
                onClick={handleContinue}
                disabled={!selectedPlan}
                variant="primary"
                size="lg"
                block
              >
                ดำเนินการต่อ
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* Empty State */}
        {!loading && packages.length === 0 && (
          <Card variant="elevated">
            <Card.Body>
              <EmptyState
                icon="folder"
                title="ไม่พบแพ็กเกจที่ใช้งานได้"
                description="กรุณาติดต่อผู้ดูแลระบบ"
                size="sm"
              />
            </Card.Body>
          </Card>
        )}
      </AppShell>
    </>
  );
}
