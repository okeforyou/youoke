import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect } from "react";
import {
  SparklesIcon,
  HomeIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import PackageCard from "../components/subscription/PackageCard";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import MainLayout from "../components/layout/MainLayout";
import EmptyState from "../components/layout/EmptyState";
import { PricingPackage } from "../types/subscription";
import { formatDate } from "../utils/formatting";
import { getDaysRemaining, getPlanDisplayName, isExpiringSoon as checkExpiringSoon } from "../utils/subscription";

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
  plans: PricingPackage[];
}

export default function AccountPage() {
  const router = useRouter();
  const { user: authUser, logOut } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authUser?.uid) {
          // Not authenticated, redirect to login
          router.push("/login");
          return;
        }

        const response = await fetch("/api/user/me");

        if (response.status === 401) {
          // Unauthorized, redirect to login
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

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    router.push(`/payment?plan=${planId}`);
  };

  // Loading state
  if (loading) {
    return (
      <MainLayout maxWidth="xl" activeTab={undefined}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error || !userData) {
    return (
      <MainLayout maxWidth="xl" activeTab={undefined}>
        <div className="min-h-screen flex items-center justify-center bg-base-200">
          <div className="text-center">
            <p className="text-xl text-error mb-4">{error || "ไม่พบข้อมูลผู้ใช้"}</p>
            <Button onClick={() => window.location.reload()} variant="primary">
              รีโหลดหน้า
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { user, recentPayments, plans } = userData;

  // Calculate subscription details
  const daysRemaining = user.subscription.endDate
    ? getDaysRemaining(new Date(user.subscription.endDate))
    : null;
  const isPremium = user.subscription.status === "active" && user.subscription.plan !== "free";
  const isExpiringSoon = user.subscription.endDate
    ? checkExpiringSoon(new Date(user.subscription.endDate), 7)
    : false;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  return (
    <>
      <Head>
        <title>บัญชีของฉัน - Oke for You</title>
      </Head>

      <MainLayout maxWidth="xl" activeTab={undefined}>
        {/* Header with Avatar */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 mb-8 lg:mb-12">
          {/* Avatar */}
          <div className="avatar placeholder">
            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-content rounded-full w-20 h-20 lg:w-24 lg:h-24 shadow-lg">
              <span className="text-3xl lg:text-4xl font-bold">
                {user.displayName?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-base-content mb-2">
              {user.displayName}
            </h1>
            <p className="text-base-content/60 text-sm lg:text-base">{user.email}</p>

            {/* Status Badge */}
            <div className="mt-3 flex justify-center lg:justify-start gap-2">
              {isPremium ? (
                <Badge variant="success" size="lg" className="gap-1">
                  <SparklesIcon className="w-4 h-4" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="ghost" size="lg">Free</Badge>
              )}
              <Badge variant="outline" size="lg">
                {getPlanDisplayName(user.subscription.plan as any)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Section 1: Subscription Status */}
        <div className="space-y-6">
          <Card variant="default">
            <Card.Body>
              <div className="flex items-center justify-between mb-4">
                <h2 className="card-title text-2xl">
                  <SparklesIcon className="w-6 h-6 text-primary" />
                  สถานะสมาชิก
                </h2>
                {isPremium && <Badge variant="success" size="lg">Premium</Badge>}
                {!isPremium && <Badge variant="ghost" size="lg">Free</Badge>}
              </div>

              <div className="divider my-2"></div>

              {/* Plan Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Plan */}
                <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <SparklesIcon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm text-base-content/60">แพ็คเกจปัจจุบัน</div>
                    <div className="text-xl font-bold text-primary">
                      {getPlanDisplayName(user.subscription.plan as any)}
                    </div>
                  </div>
                </div>

                {/* Start Date */}
                {user.subscription.startDate && (
                  <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
                    <div className="p-3 bg-success/10 rounded-full">
                      <CalendarIcon className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm text-base-content/60">วันที่สมัคร</div>
                      <div className="text-lg font-semibold">
                        {formatDate(user.subscription.startDate ? new Date(user.subscription.startDate) : null)}
                      </div>
                    </div>
                  </div>
                )}

                {/* End Date */}
                {user.subscription.endDate && (
                  <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
                    <div className="p-3 bg-warning/10 rounded-full">
                      <CalendarIcon className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm text-base-content/60">วันหมดอายุ</div>
                      <div className="text-lg font-semibold">
                        {formatDate(user.subscription.endDate ? new Date(user.subscription.endDate) : null)}
                      </div>
                      {daysRemaining !== null && daysRemaining > 0 && (
                        <div className="text-sm text-success mt-1">
                          เหลืออีก {daysRemaining} วัน
                        </div>
                      )}
                      {daysRemaining !== null && daysRemaining < 0 && (
                        <div className="text-sm text-error mt-1">หมดอายุแล้ว</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Days Remaining */}
                {isPremium && daysRemaining !== null && daysRemaining > 0 && (
                  <div className="flex items-start gap-4 p-4 bg-base-200 rounded-lg">
                    <div className="p-3 bg-info/10 rounded-full">
                      <ClockIcon className="w-6 h-6 text-info" />
                    </div>
                    <div className="flex-grow">
                      <div className="text-sm text-base-content/60">เวลาคงเหลือ</div>
                      <div className="text-xl font-bold text-info">
                        {daysRemaining} วัน
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {isExpiringSoon && (
                <div className="alert alert-warning mt-6">
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
                  <span>แพ็กเกจของคุณใกล้หมดอายุแล้ว! ({daysRemaining} วันเหลือ)</span>
                </div>
              )}

              {isExpired && (
                <div className="alert alert-error mt-6">
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
                  <span>แพ็กเกจของคุณหมดอายุแล้ว กรุณาต่ออายุเพื่อใช้งานต่อ</span>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Section 2: Available Packages */}
          {(!isPremium || isExpiringSoon || isExpired) && (
            <Card variant="default">
              <Card.Body>
                <h2 className="card-title text-2xl mb-4">
                  <CreditCardIcon className="w-6 h-6 text-primary" />
                  {!isPremium ? "เลือกแพ็คเกจที่เหมาะกับคุณ" : "ต่ออายุสมาชิก"}
                </h2>

                {/* Package Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {plans.map((plan) => (
                    <PackageCard
                      key={plan.id}
                      plan={plan}
                      isCurrentPlan={plan.id === user.subscription.plan}
                      onSelect={handleSelectPlan}
                      maxFeatures={3}
                    />
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Section 3: Payment History */}
          <Card variant="default">
            <Card.Body>
              <h2 className="card-title text-2xl mb-4">
                <ClockIcon className="w-6 h-6 text-primary" />
                ประวัติการชำระเงิน
              </h2>

              {recentPayments.length === 0 ? (
                <EmptyState
                  icon="payment"
                  title="ยังไม่มีประวัติการชำระเงิน"
                  description="รายการชำระเงินของคุณจะแสดงที่นี่"
                />
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
                              {formatDate(payment.createdAt ? new Date(payment.createdAt) : null)}
                            </div>
                          </td>
                          <td className="font-medium">{payment.planName}</td>
                          <td className="font-semibold text-primary">{payment.amount} บาท</td>
                          <td>
                            {payment.status === "approved" && (
                              <Badge variant="success">อนุมัติแล้ว</Badge>
                            )}
                            {payment.status === "pending" && (
                              <Badge variant="warning">รออนุมัติ</Badge>
                            )}
                            {payment.status === "rejected" && (
                              <Badge variant="error">ปฏิเสธ</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card variant="gradient">
            <Card.Body>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold mb-1">พร้อมร้องคาราโอเกะแล้วหรือยัง?</h3>
                  <p className="text-base-content/60">กลับไปหน้าหลักเพื่อเลือกเพลง</p>
                </div>
                <Button
                  onClick={() => router.push("/")}
                  variant="primary"
                  size="lg"
                  className="gap-2"
                >
                  <HomeIcon className="w-5 h-5" />
                  ไปหน้าหลัก
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Logout Button */}
          <div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="lg"
              block
              className="btn-error gap-2"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </MainLayout>
    </>
  );
}
