import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  ChatBubbleLeftIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage } from "../types/subscription";
import PackageCard from "../components/subscription/PackageCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import LoadingScreen from "../components/layout/LoadingScreen";
import AppShell from "../components/layout/AppShell";
import PageHeader from "../components/layout/PageHeader";
import { BANK_INFO, APP_CONFIG } from "../utils/constants";
import { formatCurrency } from "../utils/formatting";

export default function PaymentPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PricingPackage | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user?.uid) {
      router.push("/login");
      return;
    }

    if (planQuery && planQuery !== "free") {
      loadPlan();
    } else {
      // FREE plan doesn't need payment
      router.push("/");
    }
  }, [planQuery, user]);

  async function loadPlan() {
    try {
      const pkg = await getPricingPackage(planQuery as string);
      if (pkg) {
        setSelectedPlan(pkg);
      } else {
        router.push("/pricing");
      }
    } catch (error) {
      console.error("Error loading plan:", error);
      router.push("/pricing");
    }
  }

  function handleNotifyLineOA() {
    const planName = selectedPlan.displayName || selectedPlan.name;
    const price = formatCurrency(selectedPlan.price);
    const email = user.email;

    const message = `สวัสดีครับ ได้ชำระเงินแพ็กเกจ ${planName} จำนวน ${price} แล้ว
อีเมล: ${email}
กรุณาเปิดใช้งานแพ็กเกจให้ด้วยครับ`;

    const encodedMessage = encodeURIComponent(message);
    const lineUrl = APP_CONFIG.support.lineUrl + `?text=${encodedMessage}`;

    window.open(lineUrl, "_blank");
  }

  function handleClose() {
    router.push("/pricing");
  }

  if (!selectedPlan) {
    return <LoadingScreen variant="fullscreen" text="กำลังโหลดข้อมูลแพ็กเกจ..." />;
  }

  return (
    <>
      <Head>
        <title>ยืนยันการชำระเงิน - YouOke</title>
      </Head>

      <AppShell background="gradient" maxWidth="2xl" showBottomNav>
        <PageHeader
          title="ยืนยันการชำระเงิน"
          subtitle="กรุณาโอนเงินและแจ้งชำระผ่าน LINE@"
          showBack
          onBack={() => router.push("/pricing")}
        />

        {/* Selected Package Card */}
        <Card className="mb-6">
          <Card.Body padding="sm">
            <h3 className="text-lg font-semibold mb-3">แพ็กเกจที่เลือก</h3>
            <PackageCard
              plan={selectedPlan}
              isCurrentPlan={false}
              buttonText="แพ็กเกจที่เลือก"
              maxFeatures={5}
            />
          </Card.Body>
        </Card>

        {/* Bank Details */}
        <Card variant="elevated" className="mb-6">
          <Card.Body>
            <Alert variant="info" icon={<BanknotesIcon className="w-6 h-6" />}>
              <Alert.Title>ข้อมูลบัญชีธนาคาร</Alert.Title>
              <Alert.Description>
                <div className="space-y-2 mt-3">
                  <div className="flex justify-between">
                    <span className="text-base-content/70">ชื่อบัญชี:</span>
                    <span className="font-semibold">{BANK_INFO.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">ธนาคาร:</span>
                    <span className="font-semibold">{BANK_INFO.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-base-content/70">เลขที่บัญชี:</span>
                    <span className="font-semibold text-lg">{BANK_INFO.accountNumber}</span>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/70">จำนวนเงิน:</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedPlan.price)}
                    </span>
                  </div>
                </div>
              </Alert.Description>
            </Alert>
          </Card.Body>
        </Card>

        {/* Instructions */}
        <Card variant="elevated" className="mb-6">
          <Card.Body>
            <h3 className="text-lg font-semibold mb-3">ขั้นตอนการชำระเงิน</h3>
            <ol className="list-decimal list-inside space-y-2 text-base-content/80">
              <li>โอนเงินตามจำนวนที่ระบุ</li>
              <li>กดปุ่ม "แจ้งชำระเงินทาง LINE@"</li>
              <li>แนบสลิปการโอนเงินในแชท LINE</li>
              <li>รอการยืนยันจากแอดมิน (ภายใน 24 ชม.)</li>
            </ol>

            {/* Action Buttons */}
            <div className="mt-6 space-y-3">
              <Button
                onClick={handleNotifyLineOA}
                variant="success"
                size="lg"
                block
              >
                <ChatBubbleLeftIcon className="w-6 h-6" />
                แจ้งชำระเงินทาง LINE@
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="ghost"
                block
              >
                กลับหน้าหลัก
              </Button>
            </div>
          </Card.Body>
        </Card>
      </AppShell>
    </>
  );
}
