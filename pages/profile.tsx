import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import {
  UserCircleIcon,
  EnvelopeIcon,
  CalendarIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/userService";
import { UserProfile } from "../types/subscription";
import BottomNavigation from "../components/BottomNavigation";

export default function ProfileSimplePage() {
  const router = useRouter();
  const { user, logOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      router.push("/login");
      return;
    }

    loadProfile();
  }, [user]);

  async function loadProfile() {
    if (!user?.uid) return;

    try {
      const data = await getUserProfile(user.uid);
      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  function getPackageName(plan: string): string {
    switch (plan) {
      case "monthly":
        return "รายเดือน";
      case "yearly":
        return "รายปี";
      case "lifetime":
        return "ตลอดชีพ";
      default:
        return "ฟรี";
    }
  }

  function formatDate(date: any): string {
    if (!date) return "-";
    const d = typeof date === 'object' && 'toDate' in date ? date.toDate() : new Date(date);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getDaysRemaining(): number | null {
    if (!profile?.subscription?.endDate) return null;

    const endDate: any = profile.subscription.endDate;
    const end = typeof endDate === 'object' && 'toDate' in endDate
      ? endDate.toDate()
      : new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days;
  }

  function isExpiringSoon(): boolean {
    const days = getDaysRemaining();
    return days !== null && days > 0 && days <= 7;
  }

  function isExpired(): boolean {
    const days = getDaysRemaining();
    return days !== null && days < 0;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-xl mb-4">ไม่พบข้อมูลผู้ใช้</p>
          <button
            onClick={() => router.push("/")}
            className="btn btn-primary"
          >
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <>
      <Head>
        <title>โปรไฟล์ - Oke for You คาราโอเกะออนไลน์</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 pb-24">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => router.push("/account")}
            className="btn btn-ghost btn-sm gap-2 mb-6"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            กลับ
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-24">
                <span className="text-3xl">
                  {profile.displayName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold">{profile.displayName}</h1>
            <p className="text-base-content/60">{profile.email}</p>
          </div>

          {/* Subscription Status Card */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">สถานะสมาชิก</h2>

              {/* Plan */}
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="w-6 h-6 text-primary" />
                <div className="flex-grow">
                  <div className="text-sm text-base-content/60">แพ็กเกจ</div>
                  <div className="text-lg font-semibold">
                    {getPackageName(profile.subscription.plan)}
                  </div>
                </div>
                {profile.subscription.status === "active" && (
                  <div className="badge badge-success">ใช้งานอยู่</div>
                )}
                {profile.subscription.status === "expired" && (
                  <div className="badge badge-error">หมดอายุ</div>
                )}
                {profile.subscription.status === "pending" && (
                  <div className="badge badge-warning">รออนุมัติ</div>
                )}
              </div>

              <div className="divider my-2"></div>

              {/* Start Date */}
              {profile.subscription.startDate && (
                <div className="flex items-center gap-3 mb-3">
                  <CalendarIcon className="w-5 h-5 text-base-content/50" />
                  <div className="flex-grow">
                    <div className="text-sm text-base-content/60">
                      วันที่สมัคร
                    </div>
                    <div className="font-medium">
                      {formatDate(profile.subscription.startDate)}
                    </div>
                  </div>
                </div>
              )}

              {/* End Date */}
              {profile.subscription.endDate && (
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-base-content/50" />
                  <div className="flex-grow">
                    <div className="text-sm text-base-content/60">
                      วันหมดอายุ
                    </div>
                    <div className="font-medium">
                      {formatDate(profile.subscription.endDate)}
                    </div>
                    {daysRemaining !== null && daysRemaining > 0 && (
                      <div className="text-sm text-base-content/60 mt-1">
                        เหลืออีก {daysRemaining} วัน
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Expiring Soon Alert */}
              {isExpiringSoon() && (
                <div className="alert alert-warning mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>แพ็กเกจของคุณใกล้หมดอายุแล้ว!</span>
                </div>
              )}

              {/* Expired Alert */}
              {isExpired() && (
                <div className="alert alert-error mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>แพ็กเกจของคุณหมดอายุแล้ว</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Renew / Upgrade */}
            {(isExpiringSoon() || isExpired() || profile.subscription.plan === "free") && (
              <button
                onClick={() => router.push("/pricing")}
                className="btn btn-primary btn-block btn-lg gap-2"
              >
                <SparklesIcon className="w-5 h-5" />
                {profile.subscription.plan === "free"
                  ? "อัพเกรดเป็นสมาชิก"
                  : "ต่ออายุสมาชิก"}
              </button>
            )}
          </div>

          {/* User Info (for debugging) */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 bg-base-200 rounded-lg">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </>
  );
}
