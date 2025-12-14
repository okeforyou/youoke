import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
import nookies from "nookies";
import { useState } from "react";
import {
  SparklesIcon,
  HomeIcon,
  CalendarIcon,
  CreditCardIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  EnvelopeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";

import { adminAuth, adminDb, adminFirestore } from "../firebase-admin";
import { useAuth } from "../context/AuthContext";
import BottomNavigation from "../components/BottomNavigation";
import PackageCard from "../components/subscription/PackageCard";
import { PricingPackage } from "../types/subscription";

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

interface Props {
  user: {
    uid: string;
    email: string;
    displayName: string;
    subscription: UserSubscription;
  };
  recentPayments: RecentPayment[];
  plans: PricingPackage[];
  error?: string;
}

export default function AccountPage({ user, recentPayments, plans, error }: Props) {
  const router = useRouter();
  const { logOut } = useAuth();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-xl text-error mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            รีโหลดหน้า
          </button>
        </div>
      </div>
    );
  }

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
  const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

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

  // Handle logout
  const handleLogout = async () => {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle plan selection - Go directly to payment page for logged-in users
  const handleSelectPlan = (planId: string) => {
    router.push(`/payment?plan=${planId}`);
  };

  return (
    <>
      <Head>
        <title>บัญชีของฉัน - Oke for You</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 pb-24 lg:pb-8">
        <div className="container mx-auto px-4 py-6 lg:py-12 max-w-5xl">
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
                  <div className="badge badge-success badge-lg gap-1">
                    <SparklesIcon className="w-4 h-4" />
                    Premium
                  </div>
                ) : (
                  <div className="badge badge-ghost badge-lg">Free</div>
                )}
                <div className="badge badge-outline badge-lg">
                  {getPlanName(user.subscription.plan)}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Subscription Status */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="card-title text-2xl">
                    <SparklesIcon className="w-6 h-6 text-primary" />
                    สถานะสมาชิก
                  </h2>
                  {isPremium && <div className="badge badge-success badge-lg">Premium</div>}
                  {!isPremium && <div className="badge badge-ghost badge-lg">Free</div>}
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
                        {getPlanName(user.subscription.plan)}
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
                          {formatDate(user.subscription.startDate)}
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
                          {formatDate(user.subscription.endDate)}
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

                  {/* Days Remaining (if active) */}
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
              </div>
            </div>

            {/* Section 2: Available Packages */}
            {(!isPremium || isExpiringSoon || isExpired) && (
              <div className="card bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                  <h2 className="card-title text-2xl mb-4">
                    <CreditCardIcon className="w-6 h-6 text-primary" />
                    {!isPremium ? "เลือกแพ็คเกจที่เหมาะกับคุณ" : "ต่ออายุสมาชิก"}
                  </h2>

                  {/* Package Cards Grid - Using PackageCard Component */}
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
                </div>
              </div>
            )}

            {/* Section 3: Payment History */}
            <div className="card bg-base-100 shadow-xl border border-base-300">
              <div className="card-body">
                <h2 className="card-title text-2xl mb-4">
                  <ClockIcon className="w-6 h-6 text-primary" />
                  ประวัติการชำระเงิน
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
                            <td className="font-medium">{payment.planName}</td>
                            <td className="font-semibold text-primary">{payment.amount} บาท</td>
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

            {/* Quick Actions - Home Link */}
            <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <div className="card-body">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-bold mb-1">พร้อมร้องคาราโอเกะแล้วหรือยัง?</h3>
                    <p className="text-base-content/60">กลับไปหน้าหลักเพื่อเลือกเพลง</p>
                  </div>
                  <button
                    onClick={() => router.push("/")}
                    className="btn btn-primary gap-2 btn-lg"
                  >
                    <HomeIcon className="w-5 h-5" />
                    ไปหน้าหลัก
                  </button>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-error btn-block btn-lg gap-2"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </>
  );
}

// Server-Side Rendering
export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log("🚀 [SSR] account getServerSideProps started");

  try {
    // 1. Check authentication
    const cookies = nookies.get(context);
    const token = cookies.token;

    if (!token) {
      console.log("❌ [SSR] No token found, redirecting to login");
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // 2. Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 3. Fetch user data from Realtime Database
    const userRef = adminDb.ref(`users/${uid}`);
    const userSnapshot = await userRef.once("value");

    if (!userSnapshot.exists()) {
      console.log("❌ [SSR] User not found");
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const userData = userSnapshot.val();

    // 4. Fetch plans from Firestore
    const plansSnapshot = await adminFirestore
      .collection("plans")
      .get();

    // Create a Map to cache plan data (avoids N+1 query problem in payment lookups)
    const plansMap = new Map<string, { displayName: string }>();

    // Filter active and visible plans, then sort by price
    const plans: PricingPackage[] = plansSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        const isActive = data.isActive || false;
        const isVisible = data.isVisible !== false;

        // Cache ALL plan data for payment lookups (not just visible ones)
        plansMap.set(doc.id, {
          displayName: data.displayName || data.name || doc.id,
        });

        return isActive && isVisible;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.displayName || doc.id,
          displayName: data.displayName || data.name || doc.id,
          price: data.price || 0,
          duration: data.duration || "",
          features: data.features || [],
          popular: data.popular || false,
        };
      })
      .sort((a, b) => a.price - b.price);

    // 5. Fetch recent payments (last 5)
    const paymentsSnapshot = await adminFirestore
      .collection("payments")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    // ⚡ Performance optimization: Use cached plan data instead of querying each plan
    const recentPayments: RecentPayment[] = paymentsSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Get plan name from cache (no additional queries needed!)
      let planName = data.planId;
      if (data.planName) {
        planName = data.planName;
      } else if (data.planId && plansMap.has(data.planId)) {
        // Use cached data instead of querying Firestore
        planName = plansMap.get(data.planId)!.displayName;
      }

      return {
        id: doc.id,
        amount: data.amount || 0,
        status: data.status || "pending",
        planName,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    console.log(`✅ [SSR] Fetched user data, ${plans.length} plans, and ${recentPayments.length} payments`);

    return {
      props: {
        user: {
          uid,
          email: userData.email || "",
          displayName: userData.displayName || userData.email?.split("@")[0] || "User",
          subscription: {
            plan: userData.subscription?.plan || "free",
            status: userData.subscription?.status || "inactive",
            startDate: userData.subscription?.startDate
              ? new Date(userData.subscription.startDate).toISOString()
              : null,
            endDate: userData.subscription?.endDate
              ? new Date(userData.subscription.endDate).toISOString()
              : null,
          },
        },
        plans,
        recentPayments,
      },
    };
  } catch (error: any) {
    console.error("❌ [SSR] Error in getServerSideProps:", error);
    return {
      props: {
        user: {
          uid: "",
          email: "",
          displayName: "Error",
          subscription: {
            plan: "free",
            status: "inactive",
            startDate: null,
            endDate: null,
          },
        },
        plans: [],
        recentPayments: [],
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};
