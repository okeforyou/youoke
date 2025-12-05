import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import Alert, { AlertHandler } from "../components/Alert";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage, SubscriptionPlan } from "../types/subscription";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { createPayment } from "../services/paymentService";

// Simplified - no form data needed, just file upload

export default function PaymentPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PricingPackage | null>(null);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const successRef = useRef<AlertHandler>(null);
  const errorRef = useRef<AlertHandler>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }

    setPaymentProofFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadPaymentProof(): Promise<string> {
    if (!paymentProofFile || !user?.uid) {
      throw new Error("No file or user");
    }

    setUploading(true);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `payment-proofs/${user.uid}/${timestamp}_${paymentProofFile.name}`;
      const storageRef = ref(storage, fileName);

      // Upload file
      await uploadBytes(storageRef, paymentProofFile);

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!paymentProofFile) {
      alert("กรุณาอัปโหลดหลักฐานการโอนเงิน");
      return;
    }

    setLoading(true);

    try {
      // Upload payment proof image
      const paymentProofURL = await uploadPaymentProof();

      // Save payment to Firestore with auto-filled data
      await createPayment({
        userId: user.uid,
        plan: selectedPlan.id as SubscriptionPlan,
        amount: selectedPlan.price, // Auto-fill from plan
        bankName: "", // Optional
        transferDate: new Date().toISOString().split('T')[0], // Today's date
        transferTime: new Date().toTimeString().split(' ')[0], // Current time
        note: "", // Optional
        paymentProof: paymentProofURL,
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

  const canSubmit = paymentProofFile && !loading && !uploading;

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
        <title>อัปโหลดหลักฐานการชำระเงิน - YouOke</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Alerts */}
          <Alert
            ref={successRef}
            timer={2500}
            headline="สำเร็จ!"
            headlineColor="text-green-600"
            bgColor="bg-green-100"
            content={
              <span className="text-sm">
                ส่งหลักฐานการชำระเงินสำเร็จ! รอการอนุมัติภายใน 24 ชั่วโมง
              </span>
            }
            icon={<CheckCircleIcon />}
          />

          <Alert
            ref={errorRef}
            timer={3000}
            headline="ผิดพลาด"
            headlineColor="text-red-600"
            bgColor="bg-red-100"
            content={
              <span className="text-sm">
                ไม่สามารถส่งหลักฐานได้ กรุณาลองใหม่อีกครั้ง
              </span>
            }
            icon={<ExclamationCircleIcon />}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              ยืนยันการชำระเงิน
            </h1>
            <p className="text-base-content/60">
              โอนเงินและอัปโหลดหลักฐาน
            </p>
          </div>

          {/* Selected Plan Info */}
          <div className="card bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30 shadow-lg mb-6">
            <div className="card-body p-6 text-center">
              <div className="text-sm text-base-content/60 mb-2">ยอดที่ต้องชำระ</div>
              <div className="flex items-baseline justify-center gap-2 mb-2">
                <span className="text-5xl font-bold text-primary">
                  {selectedPlan.price.toLocaleString("th-TH")}
                </span>
                <span className="text-2xl text-base-content/60">฿</span>
              </div>
              <div className="text-sm text-base-content/70">
                แพ็กเกจ {selectedPlan.name}
              </div>
            </div>
          </div>

          {/* QR Code & Bank Info */}
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold text-center mb-4">
                สแกน QR Code เพื่อชำระเงิน
              </h3>

              {/* QR Code Placeholder */}
              <div className="flex justify-center mb-4">
                <div className="bg-base-200 p-6 rounded-lg">
                  <div className="w-48 h-48 bg-white flex items-center justify-center border-2 border-base-300 rounded">
                    <div className="text-center text-base-content/40">
                      <BanknotesIcon className="w-16 h-16 mx-auto mb-2" />
                      <div className="text-xs">QR Code</div>
                      <div className="text-xs">PromptPay</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="divider text-sm">หรือโอนผ่านบัญชีธนาคาร</div>

              {/* Bank Info - Compact */}
              <div className="space-y-2 text-center text-sm">
                <div>
                  <div className="font-semibold">ธนาคารกสิกรไทย</div>
                  <div className="text-base-content/70">123-4-56789-0</div>
                </div>
                <div className="text-xs text-base-content/60">
                  บริษัท โอเคฟอร์ยู จำกัด
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form - Simplified */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body p-6">
              <h3 className="text-lg font-semibold mb-4">อัปโหลดหลักฐานการโอนเงิน</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Payment Proof Upload */}
                <div className="form-control">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input file-input-bordered file-input-primary w-full"
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      รองรับไฟล์: JPG, PNG (ไม่เกิน 5MB)
                    </span>
                  </label>

                  {/* Image Preview */}
                  {paymentProofPreview && (
                    <div className="mt-4">
                      <img
                        src={paymentProofPreview}
                        alt="Payment proof preview"
                        className="rounded-lg border border-base-300 max-h-80 mx-auto"
                      />
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-success w-full btn-lg text-white"
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังอัปโหลด...
                    </>
                  ) : loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังส่งข้อมูล...
                    </>
                  ) : (
                    "ยืนยันการชำระเงิน"
                  )}
                </button>

                {/* Info */}
                <p className="text-center text-sm text-base-content/60">
                  ระบบจะตรวจสอบและอนุมัติภายใน 24 ชั่วโมง
                </p>
              </form>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost btn-sm"
            >
              ← กลับหน้าหลัก
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
