import { useRouter } from "next/router";
import Head from "next/head";
import { useEffect, useState } from "react";
import { SparklesIcon, HomeIcon, CalendarIcon, CreditCardIcon, ClockIcon } from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";

// Types
interface UserSubscription {
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
}

interface RecentPayment {
  id: string;
  amount: number;
  status: string;
  planName: string;
  createdAt: string | null;
}

interface UserData {
  user: {
    uid: string;
    email: string;
    displayName: string;
    subscription: UserSubscription;
  };
  recentPayments: RecentPayment[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
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
        setUserData(data);
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authUser, router]);

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

  if (error || !userData) {
    return (
      <MainLayout maxWidth="2xl" activeTab={undefined}>
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="text-center">
            <p className="text-xl text-error mb-4">{error || "ไม่พบข้อมูลผู้ใช้"}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              รีโหลดหน้า
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { user, recentPayments } = userData;

  // Calculate days remaining
  const getDaysRemaining = (): number | null => {
    if (!user.subscription.endDate) return null;
    const end = new Date(user.subscription.endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = getDaysRemaining();
  const isPremium = user.subscription.status === "active" && user.subscription.plan !== "free";

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get plan name
  const getPlanName = (plan: string): string => {
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
  };

  return (
    <>
      <Head>
        <title>Dashboard - Oke for You</title>
      </Head>

      <MainLayout maxWidth="2xl" activeTab={undefined}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content">
              สวัสดี, {user.displayName}! 👋
            </h1>
            <p className="text-base-content/60 mt-1">
              ภาพรวมบัญชีและกิจกรรมของคุณ
            </p>
          </div>

          {/* Subscription Status Card */}
          <div className="card bg-base-100 shadow-xl mb-6 border border-base-300">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl">
                  <SparklesIcon className="w-6 h-6 text-primary" />
                  สถานะสมาชิก
                </h2>
                {isPremium && (
                  <div className="badge badge-success badge-lg">Premium</div>
                )}
                {!isPremium && (
                  <div className="badge badge-ghost badge-lg">Free</div>
                )}
              </div>

              <div className="divider my-2"></div>

              {/* Plan Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <SparklesIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm text-base-content/60">แพ็คเกจปัจจุบัน</div>
                    <div className="text-xl font-bold text-primary">
                      {getPlanName(user.subscription.plan)}
                    </div>
                  </div>
                </div>

                {user.subscription.endDate && (
                  <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
                    <div className="p-3 bg-warning/10 rounded-full">
                      <CalendarIcon className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm text-base-content/60">วันหมดอายุ</div>
                      <div className="text-lg font-semibold">
                        {formatDate(user.subscription.endDate)}
                      </div>
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <div className="text-sm text-base-content/60 mt-1">
                          เหลืออีก {daysRemaining} วัน
                        </div>
                      )}
                      {daysRemaining !== null && daysRemaining < 0 && (
                        <div className="text-sm text-error mt-1">หมดอายุแล้ว</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Upgrade/Renew Button */}
              {(!isPremium || (daysRemaining !== null && daysRemaining <= 7)) && (
                <div className="mt-6">
                  <button
                    onClick={() => router.push("/pricing")}
                    className="btn btn-primary btn-block btn-lg gap-2"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    {!isPremium ? "อัพเกรดเป็นสมาชิก" : "ต่ออายุสมาชิก"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Home */}
            <button
              onClick={() => router.push("/")}
              className="card bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-lg transition-all duration-200 border border-primary/20 hover:border-primary/40"
            >
              <div className="card-body items-center text-center">
                <div className="p-4 bg-primary/20 rounded-full mb-3">
                  <HomeIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="card-title text-lg">หน้าหลัก</h3>
                <p className="text-sm text-base-content/60">ค้นหาและเล่นเพลง</p>
              </div>
            </button>

            {/* Pricing */}
            <button
              onClick={() => router.push("/pricing")}
              className="card bg-gradient-to-br from-success/10 to-success/5 hover:shadow-lg transition-all duration-200 border border-success/20 hover:border-success/40"
            >
              <div className="card-body items-center text-center">
                <div className="p-4 bg-success/20 rounded-full mb-3">
                  <SparklesIcon className="w-8 h-8 text-success" />
                </div>
                <h3 className="card-title text-lg">แพ็คเกจ</h3>
                <p className="text-sm text-base-content/60">ดูแพ็คเกจทั้งหมด</p>
              </div>
            </button>

            {/* Profile */}
            <button
              onClick={() => router.push("/profile")}
              className="card bg-gradient-to-br from-info/10 to-info/5 hover:shadow-lg transition-all duration-200 border border-info/20 hover:border-info/40"
            >
              <div className="card-body items-center text-center">
                <div className="p-4 bg-info/20 rounded-full mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-8 h-8 text-info"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="card-title text-lg">โปรไฟล์</h3>
                <p className="text-sm text-base-content/60">จัดการข้อมูลส่วนตัว</p>
              </div>
            </button>
          </div>

          {/* Recent Payments */}
          <div className="card bg-base-100 shadow-xl border border-base-300">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">
                <CreditCardIcon className="w-6 h-6 text-primary" />
                ประวัติการชำระเงิน (5 รายการล่าสุด)
              </h2>

              {recentPayments.length === 0 ? (
                <div className="text-center py-12 text-base-content/60">
                  <CreditCardIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>ยังไม่มีประวัติการชำระเงิน</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>วันที่</th>
                        <th>แพ็คเกจ</th>
                        <th>จำนวนเงิน</th>
                        <th>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentPayments.map((payment) => (
                        <tr key={payment.id} className="hover">
                          <td>
                            <div className="flex items-center gap-2">
                              <ClockIcon className="w-4 h-4 text-base-content/40" />
                              {formatDate(payment.createdAt)}
                            </div>
                          </td>
                          <td>{payment.planName}</td>
                          <td className="font-semibold">{payment.amount} บาท</td>
                          <td>
                            {payment.status === "approved" && (
                              <div className="badge badge-success">อนุมัติแล้ว</div>
                            )}
                            {payment.status === "pending" && (
                              <div className="badge badge-warning">รออนุมัติ</div>
                            )}
                            {payment.status === "rejected" && (
                              <div className="badge badge-error">ปฏิเสธ</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
      </MainLayout>
    </>
  );
}
