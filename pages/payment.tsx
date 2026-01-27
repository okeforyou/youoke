import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  ChatBubbleLeftIcon,
  BanknotesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage } from "../types/subscription";
import PackageCard from "../components/subscription/PackageCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Alert from "../components/ui/Alert";
import LoadingScreen from "../components/layout/LoadingScreen";
import MainLayout from "../components/layout/MainLayout";
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
      const result = await getPricingPackage(planQuery as string);
      if (result.success && result.data) {
        setSelectedPlan(result.data);
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

      <MainLayout maxWidth="2xl" activeTab={undefined}>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/pricing")}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← กลับ
          </button>
          <h1 className="text-3xl font-bold mb-2">ยืนยันการชำระเงิน</h1>
          <p className="text-base-content/60">กรุณาโอนเงินและแจ้งชำระผ่าน LINE@</p>
        </div>

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
            <Alert
              variant="info"
              icon={<BanknotesIcon className="w-6 h-6" />}
              title="ข้อมูลบัญชีธนาคาร"
            >
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
            </Alert>
          </Card.Body>
        </Card>

        {/* Instructions */}
        <Card variant="elevated" className="mb-6">
          <Card.Body>
            <h3 className="text-lg font-semibold mb-3">ขั้นตอนการชำระเงิน</h3>
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                <XMarkIcon className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">การชำระเงินไม่สำเร็จ</h1>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                ขออภัย ไม่สามารถทำรายการได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่หากพบปัญหา &quot;ซ้ำ&quot;
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => router.push('/pricing')}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-focus transition-colors"
                >
                  ลองใหม่อีกครั้ง
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </MainLayout>
    </>
  );
}
