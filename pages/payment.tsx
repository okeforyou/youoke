import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  PhotoIcon,
  BanknotesIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import Alert, { AlertHandler } from "../components/Alert";
import { getPricingPackage } from "../services/pricingService";
import { PricingPackage } from "../types/subscription";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase";

interface PaymentData {
  bankName: string;
  transferDate: string;
  transferTime: string;
  amount: string;
  note: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { user } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<PricingPackage | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    bankName: "",
    transferDate: "",
    transferTime: "",
    amount: "",
    note: "",
  });
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
        // Auto-fill amount
        setPaymentData((prev) => ({
          ...prev,
          amount: pkg.price.toString(),
        }));
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

      // Save payment to Firestore
      // TODO: Create paymentService to save payment data
      // await createPayment({
      //   userId: user.uid,
      //   plan: selectedPlan.id,
      //   amount: parseFloat(paymentData.amount),
      //   bankName: paymentData.bankName,
      //   transferDate: paymentData.transferDate,
      //   transferTime: paymentData.transferTime,
      //   note: paymentData.note,
      //   paymentProof: paymentProofURL,
      //   status: "pending",
      //   createdAt: new Date(),
      // });

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

  const canSubmit =
    paymentData.bankName &&
    paymentData.transferDate &&
    paymentData.transferTime &&
    paymentData.amount &&
    paymentProofFile &&
    !loading &&
    !uploading;

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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              อัปโหลดหลักฐานการชำระเงิน
            </h1>
            <p className="text-base-content/70">
              กรุณาอัปโหลดหลักฐานการโอนเงินเพื่อรอการอนุมัติ
            </p>
          </div>

          {/* Selected Plan Info */}
          <div className="card bg-primary text-primary-content shadow-lg mb-6">
            <div className="card-body">
              <h3 className="card-title text-2xl">แพ็กเกจ {selectedPlan.name}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">
                  {selectedPlan.price.toLocaleString("th-TH")}
                </span>
                <span className="text-2xl">฿</span>
              </div>
              <div className="text-sm opacity-80">
                {selectedPlan.duration === 365
                  ? "1 ปี"
                  : selectedPlan.duration === 30
                  ? "30 วัน"
                  : "ตลอดชีพ"}
              </div>
            </div>
          </div>

          {/* Bank Account Info */}
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">
                <BanknotesIcon className="w-6 h-6" />
                ข้อมูลบัญชีสำหรับโอนเงิน
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-primary">
                    ธนาคารกสิกรไทย
                  </h4>
                  <p className="text-sm">
                    <strong>เลขที่บัญชี:</strong> 123-4-56789-0
                    <br />
                    <strong>ชื่อบัญชี:</strong> บริษัท โอเคฟอร์ยู จำกัด
                  </p>
                </div>
                <div className="bg-base-200 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-secondary">
                    ธนาคารไทยพาณิชย์
                  </h4>
                  <p className="text-sm">
                    <strong>เลขที่บัญชี:</strong> 987-6-54321-0
                    <br />
                    <strong>ชื่อบัญชี:</strong> บริษัท โอเคฟอร์ยู จำกัด
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Bank Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <BanknotesIcon className="w-4 h-4 inline mr-1" />
                      ธนาคารที่โอน
                    </span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={paymentData.bankName}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, bankName: e.target.value })
                    }
                    required
                  >
                    <option value="">เลือกธนาคาร</option>
                    <option value="กสิกรไทย">ธนาคารกสิกรไทย</option>
                    <option value="ไทยพาณิชย์">ธนาคารไทยพาณิชย์</option>
                    <option value="กรุงเทพ">ธนาคารกรุงเทพ</option>
                    <option value="กรุงไทย">ธนาคารกรุงไทย</option>
                    <option value="ทหารไทยธนชาต">ธนาคารทหารไทยธนชาต</option>
                    <option value="กรุงศรีอยุธยา">ธนาคารกรุงศรีอยุธยา</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>
                </div>

                {/* Transfer Date & Time */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        <CalendarIcon className="w-4 h-4 inline mr-1" />
                        วันที่โอน
                      </span>
                    </label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      value={paymentData.transferDate}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          transferDate: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">
                        <ClockIcon className="w-4 h-4 inline mr-1" />
                        เวลาโอน
                      </span>
                    </label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      value={paymentData.transferTime}
                      onChange={(e) =>
                        setPaymentData({
                          ...paymentData,
                          transferTime: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Amount */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">จำนวนเงิน (฿)</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full"
                    value={paymentData.amount}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, amount: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      ยอดที่ต้องชำระ: {selectedPlan.price.toLocaleString("th-TH")}{" "}
                      ฿
                    </span>
                  </label>
                </div>

                {/* Note */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      หมายเหตุ (ถ้ามี)
                    </span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    placeholder="ข้อมูลเพิ่มเติม..."
                    value={paymentData.note}
                    onChange={(e) =>
                      setPaymentData({ ...paymentData, note: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="divider">หลักฐานการโอนเงิน</div>

                {/* Payment Proof Upload */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <PhotoIcon className="w-4 h-4 inline mr-1" />
                      รูปภาพหลักฐานการโอน
                    </span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="file-input file-input-bordered w-full"
                    required
                  />

                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      รองรับ: JPG, PNG, GIF (ไม่เกิน 5MB)
                    </span>
                  </label>

                  {/* Image Preview */}
                  {paymentProofPreview && (
                    <div className="mt-4">
                      <img
                        src={paymentProofPreview}
                        alt="Payment proof preview"
                        className="rounded-lg border border-base-300 max-h-96 mx-auto"
                      />
                    </div>
                  )}
                </div>

                <div className="divider"></div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-primary w-full"
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังอัปโหลดรูปภาพ...
                    </>
                  ) : loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังส่งข้อมูล...
                    </>
                  ) : (
                    "ส่งหลักฐานการชำระเงิน"
                  )}
                </button>

                {/* Info Alert */}
                <div className="alert alert-info">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span className="text-sm">
                    หลังจากส่งหลักฐานแล้ว ระบบจะตรวจสอบและอนุมัติภายใน 24
                    ชั่วโมง (วันทำการ)
                  </span>
                </div>
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
