import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  XMarkIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage } from "../types/subscription";
import PackageCard from "../components/subscription/PackageCard";

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
    const price = selectedPlan.price;
    const email = user.email;

    const message = `สวัสดีครับ ได้ชำระเงินแพ็กเกจ ${planName} จำนวน ${price} บาทแล้ว
อีเมล: ${email}
กรุณาเปิดใช้งานแพ็กเกจให้ด้วยครับ`;

    const encodedMessage = encodeURIComponent(message);
    const lineUrl = `https://line.me/R/ti/p/@243lercy?text=${encodedMessage}`;

    window.open(lineUrl, "_blank");
  }

  function handleClose() {
    router.push("/pricing");
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ยืนยันการชำระเงิน - YouOke</title>
      </Head>

      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="card bg-base-100 shadow-2xl">
            <div className="card-body p-6 relative">
              {/* Close Button */}
              <button
                onClick={handleClose}
                className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6 mt-2">
                <h2 className="text-xl font-bold mb-2">ยืนยันการชำระเงิน</h2>
                <p className="text-sm text-base-content/60">
                  กรุณาตรวจสอบแพ็กเกจที่เลือกและโอนเงิน
                </p>
              </div>

              {/* Selected Package Card */}
              <div className="mb-6">
                <PackageCard
                  plan={selectedPlan}
                  isCurrentPlan={false}
                  buttonText="แพ็กเกจที่เลือก"
                  maxFeatures={5}
                />
              </div>

              {/* Bank Details */}
              <div className="bg-base-300 p-6 rounded-lg mb-6">
                <div className="text-center mb-4">
                  <div className="text-lg font-bold">
                    โอนเงินจำนวน ฿{selectedPlan.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-base-100 p-4 rounded-lg space-y-3 text-sm">
                  <div>
                    <div className="text-base-content/60 mb-1">ชื่อบัญชี</div>
                    <div className="font-semibold">บุญยานันทน์ ชูพินิจ</div>
                  </div>

                  <div>
                    <div className="text-base-content/60 mb-1">ธนาคาร</div>
                    <div className="font-semibold">ธนาคารกรุงเทพ</div>
                  </div>

                  <div>
                    <div className="text-base-content/60 mb-1">เลขที่บัญชี</div>
                    <div className="font-semibold text-lg">090-0-601717</div>
                  </div>
                </div>

                <div className="text-center mt-4 text-xs text-base-content/60">
                  โปรดโอนเงินตามจำนวนที่ระบุ
                </div>
              </div>

              {/* Instructions */}
              <div className="alert alert-info mb-6">
                <div className="text-sm">
                  <strong>ขั้นตอนการชำระเงิน:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>โอนเงินตามจำนวนที่ระบุ</li>
                    <li>กดปุ่ม "แจ้งชำระเงินทาง LINE@"</li>
                    <li>แนบสลิปการโอนเงินในแชท LINE</li>
                    <li>รอการยืนยันจากแอดมิน (ภายใน 24 ชม.)</li>
                  </ol>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={handleNotifyLineOA}
                className="btn btn-success btn-block btn-lg mb-4"
              >
                <ChatBubbleLeftIcon className="w-6 h-6" />
                แจ้งชำระเงินทาง LINE@
              </button>

              <button
                onClick={() => router.push("/")}
                className="btn btn-outline btn-block mb-4"
              >
                กลับหน้าหลัก
              </button>

              {/* Back Link */}
              <div className="text-center">
                <button
                  onClick={handleClose}
                  className="text-sm text-base-content/60 hover:text-base-content"
                >
                  กลับไปเลือกแพ็กเกจอื่น
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
