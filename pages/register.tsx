import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import Alert, { AlertHandler } from "../components/Alert";
import { getPricingPackages } from "../services/pricingService";
import { PricingPackage, SubscriptionPlan } from "../types/subscription";

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { signUp } = useAuth();

  const [data, setData] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
  });

  const [selectedPlan, setSelectedPlan] = useState<PricingPackage | null>(null);
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const successRef = useRef<AlertHandler>(null);
  const errorRef = useRef<AlertHandler>(null);

  useEffect(() => {
    loadPricing();
  }, []);

  useEffect(() => {
    if (planQuery && packages.length > 0) {
      const pkg = packages.find((p) => p.id === planQuery);
      if (pkg) {
        setSelectedPlan(pkg);
      }
    }
  }, [planQuery, packages]);

  async function loadPricing() {
    try {
      const data = await getPricingPackages();
      setPackages(data);

      // Default to FREE if no plan selected
      if (!planQuery) {
        setSelectedPlan(data.find((p) => p.id === "free") || null);
      }
    } catch (error) {
      console.error("Error loading pricing:", error);
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      errorRef.current?.open();
      return;
    }

    setLoading(true);

    try {
      // Create Firebase user
      const userCredential = await signUp(data.email, data.password);
      const user = userCredential.user;

      // Save user profile to Firestore
      // TODO: Create userService to save profile data
      // await createUserProfile({
      //   uid: user.uid,
      //   email: data.email,
      //   fullName: data.fullName,
      //   phone: data.phone,
      //   subscription: {
      //     plan: selectedPlan?.id || "free",
      //     status: "pending", // Will be "active" after payment approval
      //   }
      // });

      successRef.current?.open();

      // Redirect based on plan
      setTimeout(() => {
        if (selectedPlan?.id === "free") {
          // FREE plan - go to home
          router.push("/");
        } else {
          // Paid plan - go to payment upload
          router.push(`/payment?plan=${selectedPlan?.id}`);
        }
      }, 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      errorRef.current?.open();
      setLoading(false);
    }
  };

  const canSubmit =
    data.email &&
    data.password &&
    data.confirmPassword &&
    data.fullName &&
    data.phone &&
    data.password === data.confirmPassword &&
    agreedToTerms &&
    !loading;

  return (
    <>
      <Head>
        <title>สมัครสมาชิก - YouOke Karaoke Online</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Alerts */}
          <Alert
            ref={successRef}
            timer={2500}
            headline="สำเร็จ!"
            headlineColor="text-success"
            bgColor="bg-success/20"
            content={
              <span className="text-sm">
                {selectedPlan?.id === "free"
                  ? "สมัครสมาชิกสำเร็จ! กำลังพาคุณไปหน้าหลัก..."
                  : "สมัครสมาชิกสำเร็จ! กรุณาอัปโหลดหลักฐานการชำระเงิน"}
              </span>
            }
            icon={<CheckCircleIcon />}
          />

          <Alert
            ref={errorRef}
            timer={3000}
            headline="ผิดพลาด"
            headlineColor="text-error"
            bgColor="bg-error/20"
            content={
              <span className="text-sm">
                {data.password !== data.confirmPassword
                  ? "รหัสผ่านไม่ตรงกัน"
                  : "ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง"}
              </span>
            }
            icon={<ExclamationCircleIcon />}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              สมัครสมาชิก
            </h1>
            <p className="text-base-content/70">
              เริ่มต้นใช้งาน YouOke Karaoke Online
            </p>
          </div>

          {/* Selected Plan Card */}
          {selectedPlan && (
            <div className="card bg-base-100 shadow-lg mb-6">
              <div className="card-body">
                <h3 className="card-title text-lg">แพ็กเกจที่เลือก</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {selectedPlan.name}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {selectedPlan.price === 0
                        ? "ฟรี"
                        : `${selectedPlan.price.toLocaleString("th-TH")} ฿`}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/pricing")}
                    className="btn btn-sm btn-outline"
                  >
                    เปลี่ยนแพ็กเกจ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <UserIcon className="w-4 h-4 inline mr-1" />
                      ชื่อ-นามสกุล
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="นาย/นาง ชื่อ นามสกุล"
                    className="input input-bordered w-full"
                    value={data.fullName}
                    onChange={(e) =>
                      setData({ ...data, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Email */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                      อีเมล
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="input input-bordered w-full"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    required
                  />
                </div>

                {/* Phone */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <PhoneIcon className="w-4 h-4 inline mr-1" />
                      เบอร์โทรศัพท์
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="0812345678"
                    pattern="[0-9]{10}"
                    className="input input-bordered w-full"
                    value={data.phone}
                    onChange={(e) => setData({ ...data, phone: e.target.value })}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      10 หลัก (ไม่ต้องใส่เครื่องหมาย -)
                    </span>
                  </label>
                </div>

                {/* Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <LockClosedIcon className="w-4 h-4 inline mr-1" />
                      รหัสผ่าน
                    </span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input input-bordered w-full"
                    value={data.password}
                    onChange={(e) =>
                      setData({ ...data, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      อย่างน้อย 6 ตัวอักษร
                    </span>
                  </label>
                </div>

                {/* Confirm Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">
                      <LockClosedIcon className="w-4 h-4 inline mr-1" />
                      ยืนยันรหัสผ่าน
                    </span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`input input-bordered w-full ${
                      data.confirmPassword &&
                      data.password !== data.confirmPassword
                        ? "input-error"
                        : ""
                    }`}
                    value={data.confirmPassword}
                    onChange={(e) =>
                      setData({ ...data, confirmPassword: e.target.value })
                    }
                    required
                  />
                  {data.confirmPassword &&
                    data.password !== data.confirmPassword && (
                      <label className="label">
                        <span className="label-text-alt text-error">
                          รหัสผ่านไม่ตรงกัน
                        </span>
                      </label>
                    )}
                </div>

                {/* Terms & Conditions */}
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    />
                    <span className="label-text">
                      ฉันยอมรับ{" "}
                      <a
                        href="https://okeforyou.com/terms"
                        target="_blank"
                        className="link link-primary"
                      >
                        ข้อกำหนดและเงื่อนไข
                      </a>{" "}
                      และ{" "}
                      <a
                        href="https://okeforyou.com/privacy"
                        target="_blank"
                        className="link link-primary"
                      >
                        นโยบายความเป็นส่วนตัว
                      </a>
                    </span>
                  </label>
                </div>

                <div className="divider"></div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังสมัครสมาชิก...
                    </>
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </button>

                {/* Login Link */}
                <div className="text-center text-sm">
                  <span className="text-base-content/60">มีบัญชีอยู่แล้ว? </span>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="link link-primary"
                  >
                    เข้าสู่ระบบ
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push("/pricing")}
              className="btn btn-ghost btn-sm"
            >
              ← กลับไปเลือกแพ็กเกจ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
