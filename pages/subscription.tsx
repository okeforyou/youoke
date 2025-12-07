import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { UserProfile, SubscriptionPlan, SubscriptionStatus, UserRole } from "../types/subscription";
import { GetServerSideProps } from "next";
import { adminDb, adminAuth } from "../firebase-admin";
import nookies from "nookies";

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

interface Props {
  profile: SerializedUserProfile | null;
  error?: string;
}

export default function SubscriptionPage({ profile, error }: Props) {
  const router = useRouter();

  // 🔍 Debug: Check if SSR data is received
  console.log('🔍 SSR Data:', { profile, error });

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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <p className="text-xl mb-4">{error}</p>
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
        <div className="container mx-auto px-4 py-8 max-w-2xl transition-opacity duration-300 opacity-0 animate-[fadeIn_0.3s_ease-in_forwards]">
          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
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
              <div className="text-xs mb-2 text-success font-bold">✅ SSR Enabled - Data loaded from server!</div>
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

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  console.log('🚀 [SSR] getServerSideProps started');

  try {
    // Get auth token from cookies
    const cookies = nookies.get(context);
    const token = cookies.token;
    console.log('🍪 [SSR] Token from cookies:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');

    if (!token) {
      console.log('❌ [SSR] No token found -> redirect to login');
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // Verify token and get uid using Firebase Admin Auth
    if (!adminDb || !adminAuth) {
      console.error('❌ [SSR] Firebase Admin not initialized!');
      return {
        props: {
          profile: null,
          error: "กรุณาตั้งค่า Firebase Admin SDK ใน .env.local",
        },
      };
    }

    console.log('✅ [SSR] Firebase Admin initialized');

    // Verify the token and extract uid
    let uid: string;
    try {
      console.log('🔐 [SSR] Verifying token...');
      const decodedToken = await adminAuth.verifyIdToken(token);
      uid = decodedToken.uid;
      console.log(`✅ [SSR] Token verified! UID: ${uid}`);
    } catch (verifyError: any) {
      console.error('❌ [SSR] Token verification failed:', verifyError.message);
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // Fetch user profile from Realtime Database (SSR!)
    console.log(`📡 [SSR] Fetching profile from database for uid: ${uid}`);
    const userRef = adminDb.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      console.log('❌ [SSR] Profile not found in database');
      return {
        props: {
          profile: null,
          error: "ไม่พบข้อมูลผู้ใช้",
        },
      };
    }

    const profile = snapshot.val() as UserProfile;
    console.log('✅ [SSR] Profile fetched successfully:', {
      email: profile.email,
      role: profile.role,
      plan: profile.subscription?.plan,
    });

    // แปลง Firebase Timestamp เป็น serializable format
    const serializedProfile = {
      ...profile,
      createdAt: profile.createdAt ? new Date(profile.createdAt).toISOString() : null,
      updatedAt: profile.updatedAt ? new Date(profile.updatedAt).toISOString() : null,
      subscription: {
        ...profile.subscription,
        startDate: profile.subscription?.startDate ? new Date(profile.subscription.startDate).toISOString() : null,
        endDate: profile.subscription?.endDate ? new Date(profile.subscription.endDate).toISOString() : null,
      },
    };

    console.log(`✅ [SSR] Returning serialized profile for ${uid}`);

    return {
      props: {
        profile: serializedProfile,
      },
    };
  } catch (error: any) {
    console.error('❌ [SSR] Unexpected error:', error.message);
    console.error('Stack:', error.stack);
    return {
      props: {
        profile: null,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};
