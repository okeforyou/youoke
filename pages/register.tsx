import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import Alert, { AlertHandler } from "../components/Alert";
import { getPricingPackages } from "../services/pricingService";
import { PricingPackage, SubscriptionPlan } from "../types/subscription";
import { createUserProfile } from "../services/userService";
import PackageCard from "../components/subscription/PackageCard";

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { signUp, signInWithGoogle } = useAuth();

  const [data, setData] = useState<RegisterData>({
    email: "",
    password: "",
    confirmPassword: "",
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
          fullName: user.displayName || undefined,
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
            <h1 className="text-3xl font-bold mb-2">สมัครสมาชิก</h1>
            <p className="text-base-content/60">กรอกข้อมูลเพื่อเริ่มใช้งาน</p>
          </div>

          {/* Selected Plan Card */}
          {selectedPlan && selectedPlan.id !== "free" && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">แพ็กเกจที่เลือก</h3>
                <button
                  onClick={() => router.push("/pricing")}
                  className="btn btn-sm btn-outline btn-primary"
                >
                  เปลี่ยนแพ็กเกจ
                </button>
              </div>
              <PackageCard
                plan={selectedPlan}
                isCurrentPlan={false}
                buttonText="แพ็กเกจที่เลือก"
                maxFeatures={4}
              />
            </div>
          )}

          {/* Registration Form */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Email */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">อีเมล</span>
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

                {/* Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">รหัสผ่าน</span>
                  </label>
                  <input
                    type="password"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="input input-bordered w-full"
                    value={data.password}
                    onChange={(e) =>
                      setData({ ...data, password: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>

                {/* Confirm Password */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">ยืนยันรหัสผ่าน</span>
                  </label>
                  <input
                    type="password"
                    placeholder="ใส่รหัสผ่านอีกครั้ง"
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
                    <span className="label-text text-sm">
                      ยอมรับ{" "}
                      <a
                        href="https://okeforyou.com/terms"
                        target="_blank"
                        className="link"
                      >
                        ข้อกำหนด
                      </a>
                      {" และ "}
                      <a
                        href="https://okeforyou.com/privacy"
                        target="_blank"
                        className="link"
                      >
                        นโยบายความเป็นส่วนตัว
                      </a>
                    </span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn btn-primary w-full btn-lg"
                >
                  {loading ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      กำลังสมัคร...
                    </>
                  ) : (
                    "สมัครสมาชิก"
                  )}
                </button>

                <div className="divider text-sm text-base-content/50">หรือ</div>

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading || !agreedToTerms}
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
