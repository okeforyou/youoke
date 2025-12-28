import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { UserProfile, SubscriptionPlan, SubscriptionStatus, UserRole } from "../types/subscription";
import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";

// Serialized version of UserProfile for SSR (dates as strings)
interface SerializedUserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  subscription: {
    plan: SubscriptionPlan;
    startDate: string | null;
    endDate: string | null;
    status: SubscriptionStatus;
    paymentProof?: string;
  };
  settings?: {
    autoPlayQueue: boolean;
    defaultVolume: number;
    quality: "auto" | "720p" | "480p" | "360p";
    theme: "light" | "dark";
    notifications: {
      expiryReminder: boolean;
      newAds: boolean;
    };
  };
  createdAt: string | null;
  updatedAt: string | null;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<SerializedUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authUser?.uid) {
          router.push("/login");
          return;
        }

        const response = await fetch("/api/user/me");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        const serializedProfile: SerializedUserProfile = {
          uid: data.user.uid,
          email: data.user.email,
          displayName: data.user.displayName,
          role: "user",
          subscription: {
            plan: data.user.subscription.plan,
            startDate: data.user.subscription.startDate,
            endDate: data.user.subscription.endDate,
            status: data.user.subscription.status,
          },
          createdAt: null,
          updatedAt: null,
        };
        setProfile(serializedProfile);
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, router]);

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
      <MainLayout maxWidth="2xl" activeTab={undefined}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout maxWidth="2xl" activeTab={undefined}>
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="text-center">
            <p className="text-xl text-error mb-4">{error}</p>
            <button onClick={() => router.push("/")} className="btn btn-primary">
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout maxWidth="2xl" activeTab={undefined}>
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="text-center">
            <p className="text-xl mb-4">ไม่พบข้อมูลผู้ใช้</p>
            <button onClick={() => router.push("/")} className="btn btn-primary">
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <Head>
        <title>สถานะสมาชิก - Oke for You คาราโอเกะออนไลน์</title>
      </Head>

      <MainLayout maxWidth="2xl" activeTab={undefined}>
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
      </MainLayout>
    </>
  );
}
