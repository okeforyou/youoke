import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import Alert, { AlertHandler } from "../components/Alert";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage, SubscriptionPlan } from "../types/subscription";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";
import { createPayment } from "../services/paymentService";
import PackageCard from "../components/subscription/PackageCard";

export default function PaymentPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PricingPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file);
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }

  async function handleConfirmPayment() {
    if (!paymentProofFile) {
      alert("กรุณาแนบหลักฐานการโอนเงิน");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload image to Firebase Storage
      const timestamp = Date.now();
      const fileName = `payment-proofs/${user.uid}/${timestamp}_${paymentProofFile.name}`;
      const storageRef = ref(storage, fileName);

      await uploadBytes(storageRef, paymentProofFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Save payment to Firestore
      await createPayment({
        userId: user.uid,
        plan: selectedPlan.id as SubscriptionPlan,
        amount: selectedPlan.price,
        bankName: "ธนาคารกรุงเทพ",
        transferDate: new Date().toISOString().split('T')[0],
        transferTime: new Date().toTimeString().split(' ')[0],
        note: "",
        paymentProof: downloadURL,
      });

      setUploadSuccess(true);
      successRef.current?.open();
    } catch (error: any) {
      console.error("Payment submission error:", error);

      // Show specific error message
      let errorMessage = "ไม่สามารถดำเนินการได้";
      if (error.code === 'storage/unauthorized') {
        errorMessage = "ไม่มีสิทธิ์อัปโหลดไฟล์ กรุณาติดต่อผู้ดูแลระบบ";
      } else if (error.code === 'storage/canceled') {
        errorMessage = "ยกเลิกการอัปโหลด";
      } else if (error.code === 'storage/unknown') {
        errorMessage = "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ";
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(`เกิดข้อผิดพลาด: ${errorMessage}\n\nกรุณาลองใหม่อีกครั้งหรือติดต่อทาง LINE@`);
      errorRef.current?.open();
      setLoading(false);
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

              {/* Upload Payment Proof */}
              {!uploadSuccess && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    แนบหลักฐานการโอนเงิน
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input file-input-bordered file-input-primary w-full"
                  />

                  {/* Preview */}
                  {previewUrl && (
                    <div className="mt-4">
                      <img
                        src={previewUrl}
                        alt="Payment proof preview"
                        className="w-full max-w-sm mx-auto rounded-lg border-2 border-base-300"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Success State - Show after upload */}
              {uploadSuccess && (
                <div className="alert alert-success mb-6">
                  <CheckCircleIcon className="w-6 h-6" />
                  <div>
                    <h3 className="font-bold">อัปโหลดหลักฐานสำเร็จ!</h3>
                    <div className="text-sm">
                      เพื่อให้เราตรวจสอบและเปิดใช้งานแพ็กเกจให้คุณเร็วขึ้น
                      <br />
                      กรุณาแจ้งการชำระเงินทาง LINE@
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!uploadSuccess ? (
                <button
                  onClick={handleConfirmPayment}
                  disabled={loading || !paymentProofFile}
                  className="btn btn-primary btn-block btn-lg mb-4"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังอัปโหลด...
                    </>
                  ) : (
                    "ยืนยันและอัปโหลดหลักฐาน"
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleNotifyLineOA}
                    className="btn btn-success btn-block btn-lg mb-4"
                  >
                    <ChatBubbleLeftIcon className="w-6 h-6" />
                    แจ้งชำระเงินทาง LINE@
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="btn btn-outline btn-block"
                  >
                    กลับหน้าหลัก
                  </button>
                </>
              )}

              {/* Back Link - Only show before upload */}
              {!uploadSuccess && (
                <div className="text-center">
                  <button
                    onClick={handleClose}
                    className="text-sm text-base-content/60 hover:text-base-content"
                  >
                    กลับไปเลือกแพ็กเกจอื่น
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
