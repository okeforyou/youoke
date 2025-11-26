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
import { createUserProfile } from "../services/userService";

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
  const { signUp, signInWithGoogle } = useAuth();

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
  const [googleLoading, setGoogleLoading] = useState(false);
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
      await createUserProfile({
        uid: user.uid,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        plan: (selectedPlan?.id as SubscriptionPlan) || "free",
      });

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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);

    try {
      const userCredential = await signInWithGoogle();
      const user = userCredential.user;

      // Check if user profile already exists
      const { getUserProfile } = await import("../services/userService");
      const existingProfile = await getUserProfile(user.uid);

      // Only create profile if it doesn't exist (new user)
      if (!existingProfile) {
        await createUserProfile({
          uid: user.uid,
          email: user.email || "",
          fullName: user.displayName || "ผู้ใช้ Google",
          phone: "", // Google doesn't provide phone by default
          plan: (selectedPlan?.id as SubscriptionPlan) || "free",
        });
      }

      successRef.current?.open();

      // Redirect based on plan
      setTimeout(() => {
        if (existingProfile) {
          // Existing user - go to home
          router.push("/");
        } else if (selectedPlan?.id === "free") {
          // New FREE plan user - go to home
          router.push("/");
        } else {
          // New paid plan user - go to payment upload
          router.push(`/payment?plan=${selectedPlan?.id}`);
        }
      }, 2000);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      errorRef.current?.open();
      setGoogleLoading(false);
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
            headlineColor="text-green-600"
            bgColor="bg-green-100"
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
            headlineColor="text-red-600"
            bgColor="bg-red-100"
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

                <div className="divider">หรือ</div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="btn btn-outline w-full gap-2"
                >
                  {googleLoading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      <span>สมัครด้วย Google</span>
                    </>
                  )}
                </button>

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
                    "สมัครสมาชิกด้วยอีเมล"
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
