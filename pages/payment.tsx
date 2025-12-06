import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import Alert, { AlertHandler } from "../components/Alert";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage, SubscriptionPlan } from "../types/subscription";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { createPayment } from "../services/paymentService";

export default function PaymentPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PricingPackage | null>(null);
  const [loading, setLoading] = useState(false);

  const successRef = useRef<AlertHandler>(null);
  const errorRef = useRef<AlertHandler>(null);

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

  async function handleConfirmPayment() {
    setLoading(true);

    try {
      // Save payment to Firestore
      await createPayment({
        userId: user.uid,
        plan: selectedPlan.id as SubscriptionPlan,
        amount: selectedPlan.price,
        bankName: "",
        transferDate: new Date().toISOString().split('T')[0],
        transferTime: new Date().toTimeString().split(' ')[0],
        note: "",
        paymentProof: "",
      });

      successRef.current?.open();

      // Redirect to home after 2 seconds
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      console.error("Payment submission error:", error);
      errorRef.current?.open();
      setLoading(false);
    }
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
          <Alert
            ref={successRef}
            timer={2500}
            headline="สำเร็จ!"
            headlineColor="text-green-600"
            bgColor="bg-green-100"
            content={<span className="text-sm">ยืนยันการชำระเงินสำเร็จ!</span>}
            icon={<CheckCircleIcon />}
          />

          <Alert
            ref={errorRef}
            timer={3000}
            headline="ผิดพลาด"
            headlineColor="text-red-600"
            bgColor="bg-red-100"
            content={<span className="text-sm">ไม่สามารถดำเนินการได้</span>}
            icon={<ExclamationCircleIcon />}
          />

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
                  คุณกำลังจะสมัครแพ็กเกจ {selectedPlan.name}
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-base-300 p-6 rounded-lg mb-6">
                <div className="text-center text-sm mb-3">
                  สแกน QR Code เพื่อชำระเงิน
                </div>
                <div className="bg-white w-48 h-48 mx-auto flex items-center justify-center border-4 border-base-100">
                  {/* QR Code Placeholder - Replace with actual QR if needed */}
                  <div className="text-9xl">⬛</div>
                </div>
                <div className="text-center mt-4">
                  <div className="text-3xl font-bold">
                    ฿{selectedPlan.price.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="btn btn-success btn-block btn-lg text-white mb-4"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    กำลังดำเนินการ...
                  </>
                ) : (
                  "ยืนยันการชำระเงิน"
                )}
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
