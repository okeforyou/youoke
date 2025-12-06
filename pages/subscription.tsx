import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { getUserProfile } from "../services/userService";
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

    try {
      const data = await getUserProfile(user.uid);
      setProfile(data);
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
