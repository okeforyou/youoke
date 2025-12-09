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
  error?: string;
}

export default function AccountPage({ user, recentPayments, error }: Props) {
  const router = useRouter();
  const { logOut } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

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

  // Tab content components
  const DashboardTab = () => (
    <div className="space-y-6">
      {/* Subscription Status Card */}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Contact */}
        <button
          onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="card-title text-lg">ติดต่อเรา</h3>
            <p className="text-sm text-base-content/60">สอบถามปัญหา</p>
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
    </div>
  );

  const ProfileTab = () => (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <div className="flex items-center gap-6 mb-6">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-24">
                <span className="text-3xl">
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <div className="flex-grow">
              <h2 className="text-2xl font-bold">{user.displayName}</h2>
              <p className="text-base-content/60">{user.email}</p>
            </div>
          </div>

          <div className="divider my-2"></div>

          {/* Account Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-base-content/50" />
              <div className="flex-grow">
                <div className="text-sm text-base-content/60">อีเมล</div>
                <div className="font-medium">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserCircleIcon className="w-5 h-5 text-base-content/50" />
              <div className="flex-grow">
                <div className="text-sm text-base-content/60">ชื่อผู้ใช้</div>
                <div className="font-medium">{user.displayName}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SparklesIcon className="w-5 h-5 text-base-content/50" />
              <div className="flex-grow">
                <div className="text-sm text-base-content/60">สถานะสมาชิก</div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getPlanName(user.subscription.plan)}</span>
                  {isPremium && <div className="badge badge-success badge-sm">Active</div>}
                </div>
              </div>
            </div>

            {user.subscription.startDate && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-base-content/50" />
                <div className="flex-grow">
                  <div className="text-sm text-base-content/60">วันที่สมัคร</div>
                  <div className="font-medium">{formatDate(user.subscription.startDate)}</div>
                </div>
              </div>
            )}

            {user.subscription.endDate && (
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-base-content/50" />
                <div className="flex-grow">
                  <div className="text-sm text-base-content/60">วันหมดอายุ</div>
                  <div className="font-medium">{formatDate(user.subscription.endDate)}</div>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <div className="text-sm text-base-content/60 mt-1">
                      เหลืออีก {daysRemaining} วัน
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Expiring Soon / Expired Alert */}
          {daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 7 && (
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
              <span>แพ็กเกจของคุณใกล้หมดอายุแล้ว!</span>
            </div>
          )}

          {daysRemaining !== null && daysRemaining < 0 && (
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
              <span>แพ็กเกจของคุณหมดอายุแล้ว</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const PricingTab = () => (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body text-center">
          <SparklesIcon className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="card-title text-2xl justify-center">แพ็คเกจของเรา</h2>
          <p className="text-base-content/60 mb-6">
            เลือกแพ็คเกจที่เหมาะกับคุณและเพลิดเพลินกับฟีเจอร์พิเศษ
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="btn btn-primary btn-lg gap-2"
          >
            <CreditCardIcon className="w-5 h-5" />
            ดูแพ็คเกจทั้งหมด
          </button>
        </div>
      </div>

      {/* Current Plan Summary */}
      <div className="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
        <div className="card-body">
          <h3 className="card-title">แพ็คเกจปัจจุบันของคุณ</h3>
          <div className="flex items-center justify-between mt-4">
            <div>
              <div className="text-sm text-base-content/60">แพ็คเกจ</div>
              <div className="text-xl font-bold text-primary">
                {getPlanName(user.subscription.plan)}
              </div>
            </div>
            {isPremium && <div className="badge badge-success badge-lg">Premium</div>}
            {!isPremium && <div className="badge badge-ghost badge-lg">Free</div>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>บัญชีของฉัน - Oke for You</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 pb-24">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-base-content">
              สวัสดี, {user.displayName}! 👋
            </h1>
            <p className="text-base-content/60 mt-1">จัดการบัญชีและข้อมูลของคุณ</p>
          </div>

          {/* Tabs */}
          <div className="tabs tabs-boxed bg-base-100 mb-6 p-2 shadow-lg border border-base-300">
            <button
              className={`tab tab-lg flex-1 ${activeTab === 0 ? "tab-active" : ""}`}
              onClick={() => setActiveTab(0)}
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              ภาพรวม
            </button>
            <button
              className={`tab tab-lg flex-1 ${activeTab === 1 ? "tab-active" : ""}`}
              onClick={() => setActiveTab(1)}
            >
              <UserCircleIcon className="w-5 h-5 mr-2" />
              โปรไฟล์
            </button>
            <button
              className={`tab tab-lg flex-1 ${activeTab === 2 ? "tab-active" : ""}`}
              onClick={() => setActiveTab(2)}
            >
              <CreditCardIcon className="w-5 h-5 mr-2" />
              แพ็คเกจ
            </button>
          </div>

          {/* Tab Content */}
          <div className="mb-6">
            {activeTab === 0 && <DashboardTab />}
            {activeTab === 1 && <ProfileTab />}
            {activeTab === 2 && <PricingTab />}
          </div>

          {/* Logout Button */}
          <div className="mt-8">
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

    // 4. Fetch recent payments (last 5)
    const paymentsSnapshot = await adminFirestore
      .collection("payments")
      .where("userId", "==", uid)
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const recentPayments: RecentPayment[] = await Promise.all(
      paymentsSnapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Get plan name
        let planName = data.planId;
        if (data.planName) {
          planName = data.planName;
        } else if (data.planId) {
          try {
            const planDoc = await adminFirestore.collection("plans").doc(data.planId).get();
            if (planDoc.exists) {
              const planData = planDoc.data();
              planName = planData?.displayName || data.planId;
            }
          } catch (error) {
            console.error("Error fetching plan:", error);
          }
        }

        return {
          id: doc.id,
          amount: data.amount || 0,
          status: data.status || "pending",
          planName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        };
      })
    );

    console.log(`✅ [SSR] Fetched user data and ${recentPayments.length} payments`);

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
        recentPayments: [],
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};
