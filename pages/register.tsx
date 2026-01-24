import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import {
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getPricingPackages } from "../services/pricingService";
import { PricingPackage, SubscriptionPlan } from "../types/subscription";
import { createUserProfile } from "../services/userService";
import PackageCard from "../components/subscription/PackageCard";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import MainLayout from "../components/layout/MainLayout";
import PageHeader from "../components/layout/PageHeader";

interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const { plan: planQuery } = router.query;
  const { signUp, signInWithGoogle } = useAuth();
  const toast = useToast();

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
      const result = await getPricingPackages();
      if (result.success && result.data) {
        setPackages(result.data);

        // Default to FREE if no plan selected
        if (!planQuery) {
          setSelectedPlan(result.data.find((p) => p.id === "free") || null);
        }
      }
    } catch (error) {
      console.error("Error loading pricing:", error);
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (data.password !== data.confirmPassword) {
      toast?.error("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      // Create Firebase user
      const userCredential = await signUp(data.email, data.password);
      const user = userCredential.user;

      // Save user profile to Realtime Database
      const profileResult = await createUserProfile({
        uid: user.uid,
        email: data.email,
        plan: (selectedPlan?.id as SubscriptionPlan) || "free",
      });

      // Check if profile creation was successful
      if (!profileResult.success) {
        throw new Error(profileResult.error?.message || "ไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้");
      }

      const successMessage = selectedPlan?.id === "free"
        ? "สมัครสมาชิกสำเร็จ! กำลังพาคุณไปหน้าหลัก..."
        : "สมัครสมาชิกสำเร็จ! กรุณาชำระเงิน";
      toast?.success(successMessage);

      // Redirect based on plan
      setTimeout(() => {
        if (selectedPlan?.id === "free") {
          // FREE plan - go to home
          router.push("/");
        } else {
          // Paid plan - go to payment upload
          router.push(`/payment?plan=${selectedPlan?.id}`);
        }
      }, 1500);
    } catch (error: any) {
      console.error("Registration error:", error);
      toast?.error("ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง");
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
      const profileResult = await getUserProfile(user.uid);
      const existingProfile = profileResult.success ? profileResult.data : null;

      // Only create profile if it doesn't exist (new user)
      if (!existingProfile) {
        const profileResult = await createUserProfile({
          uid: user.uid,
          email: user.email || "",
          fullName: user.displayName || undefined,
          plan: (selectedPlan?.id as SubscriptionPlan) || "free",
        });

        // Check if profile creation was successful
        if (!profileResult.success) {
          throw new Error(profileResult.error?.message || "ไม่สามารถสร้างโปรไฟล์ผู้ใช้ได้");
        }
      }

      const successMessage = existingProfile
        ? "เข้าสู่ระบบสำเร็จ!"
        : selectedPlan?.id === "free"
          ? "สมัครสมาชิกสำเร็จ! กำลังพาคุณไปหน้าหลัก..."
          : "สมัครสมาชิกสำเร็จ! กรุณาชำระเงิน";
      toast?.success(successMessage);

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
      }, 1500);
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      toast?.error("ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
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

      <MainLayout centered maxWidth="2xl" activeTab={undefined}>
        <PageHeader
          title="สมัครสมาชิก"
          subtitle="กรอกข้อมูลเพื่อเริ่มใช้งาน"
          showBack
          onBack={() => router.push("/pricing")}
        />

        {/* Selected Plan Card */}
        {selectedPlan && selectedPlan.id !== "free" && (
          <Card className="mb-6">
            <Card.Body padding="sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">แพ็กเกจที่เลือก</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/pricing")}
                >
                  เปลี่ยน
                </Button>
              </div>
              <PackageCard
                plan={selectedPlan}
                isCurrentPlan={false}
                buttonText="แพ็กเกจที่เลือก"
                maxFeatures={4}
              />
            </Card.Body>
          </Card>
        )}

        {/* Registration Form */}
        <Card variant="elevated">
          <Card.Body>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Email */}
              <Input
                type="email"
                label="อีเมล"
                placeholder="name@example.com"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
                leftIcon={<EnvelopeIcon className="w-5 h-5" />}
                required
              />

              {/* Password */}
              <Input
                type="password"
                label="รหัสผ่าน"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={data.password}
                onChange={(e) => setData({ ...data, password: e.target.value })}
                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                required
                minLength={6}
              />

              {/* Confirm Password */}
              <Input
                type="password"
                label="ยืนยันรหัสผ่าน"
                placeholder="ใส่รหัสผ่านอีกครั้ง"
                value={data.confirmPassword}
                onChange={(e) => setData({ ...data, confirmPassword: e.target.value })}
                leftIcon={<LockClosedIcon className="w-5 h-5" />}
                error={
                  data.confirmPassword && data.password !== data.confirmPassword
                    ? "รหัสผ่านไม่ตรงกัน"
                    : undefined
                }
                required
              />

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
              <Button
                type="submit"
                variant="primary"
                size="lg"
                block
                disabled={!canSubmit}
                loading={loading}
              >
                {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
              </Button>



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
          </Card.Body>
        </Card>
      </MainLayout>
    </>
  );
}
