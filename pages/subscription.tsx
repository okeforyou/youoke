import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { getUserProfile, createUserProfile } from "../services/userService";
import { UserProfile } from "../types/subscription";

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
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

    // 1. Load from localStorage FIRST (instant!)
    const cacheKey = `user_profile_${user.uid}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const cachedData = JSON.parse(cached);
        setProfile(cachedData);
        setLoading(false);
        console.log('⚡ Loaded from localStorage (instant)');
      } catch (e) {
        console.error('Failed to parse cached profile:', e);
      }
    }

    // 2. Fetch fresh data in background
    try {
      let data = await getUserProfile(user.uid);

      // If profile doesn't exist, create it automatically
      if (!data && user.email) {
        console.log("Profile not found, creating new profile...");
        data = await createUserProfile({
          uid: user.uid,
          email: user.email,
          plan: "free", // Default to free plan
        });
      }

      if (data) {
        // 3. Update both state and localStorage
        setProfile(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        console.log('✅ Updated with fresh data');
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
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

  function getStatusText(status: string): string {
    switch (status) {
      case "active":
        return "ใช้งานได้";
      case "expired":
        return "หมดอายุ";
      case "pending":
        return "รออนุมัติ";
      default:
        return "ไม่ทราบสถานะ";
    }
  }

  function getStatusColor(status: string): string {
    switch (status) {
      case "active":
        return "text-success";
      case "expired":
        return "text-error";
      case "pending":
        return "text-warning";
      default:
        return "text-base-content/60";
    }
  }

  if (loading) {
    return (
      <>
        <Head>
          <title>สถานะสมาชิก - Oke for You คาราโอเกะออนไลน์</title>
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 pb-24">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Back Button Skeleton */}
            <div className="mb-6">
              <div className="h-8 w-20 bg-base-300/50 rounded animate-pulse"></div>
            </div>

            {/* Header Skeleton */}
            <div className="text-center mb-8">
              <div className="h-9 w-48 bg-base-300/50 rounded mx-auto animate-pulse"></div>
            </div>

            {/* Card Skeleton */}
            <div className="card bg-base-100 shadow-xl mb-6">
              <div className="card-body p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`flex justify-between items-center ${i < 4 ? 'pb-4 border-b border-base-300' : ''}`}>
                    <div className="h-5 w-24 bg-base-300/50 rounded animate-pulse"></div>
                    <div className="h-5 w-32 bg-base-300/50 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Button Skeleton */}
            <div className="h-14 w-full bg-base-300/50 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </>
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

  return (
    <>
      <Head>
        <title>สถานะสมาชิก - Oke for You คาราโอเกะออนไลน์</title>
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
            <h1 className="text-3xl font-bold">สถานะสมาชิก</h1>
          </div>

          {/* Simple Subscription Card */}
          <div className="card bg-base-100 shadow-xl mb-6">
            <div className="card-body p-6">
              {/* Package Row */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-base-300">
                <span className="text-base-content/70">แพ็กเกจ:</span>
                <span className="font-semibold text-right">
                  YouOke Premium ({getPackageName(profile.subscription.plan)})
                </span>
              </div>

              {/* Bong Pun Row - Empty for now */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-base-300">
                <span className="text-base-content/70">บ่วงปุ๊น:</span>
                <span className="text-base-content/40">-</span>
              </div>

              {/* Status Row */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-base-300">
                <span className="text-base-content/70">สถานะ:</span>
                <span className={`font-semibold ${getStatusColor(profile.subscription.status)}`}>
                  {getStatusText(profile.subscription.status)}
                </span>
              </div>

              {/* Expiry Date Row */}
              <div className="flex justify-between items-center">
                <span className="text-base-content/70">การชำระเงินครั้งถัดไป:</span>
                <span className="font-semibold">
                  {profile.subscription.endDate ? formatDate(profile.subscription.endDate) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => router.push("/pricing")}
            className="btn btn-neutral btn-block btn-lg"
          >
            จัดการแพลนสมาชิก
          </button>

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
    </>
  );
}
