import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { UserProfile } from "../types/subscription";
import { GetServerSideProps } from "next";
import { adminDb } from "../firebase-admin";
import nookies from "nookies";

interface Props {
  profile: UserProfile | null;
  error?: string;
}

export default function SubscriptionPage({ profile, error }: Props) {
  const router = useRouter();

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
  try {
    // Get auth token from cookies
    const cookies = nookies.get(context);
    const token = cookies.token;

    if (!token) {
      // ไม่มี token = ยังไม่ login -> redirect to login
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // Verify token and get uid (ถ้ามี Firebase Admin)
    if (!adminDb) {
      console.warn('Firebase Admin not initialized - falling back to client-side');
      return {
        props: {
          profile: null,
          error: "กรุณาตั้งค่า Firebase Admin SDK ใน .env.local",
        },
      };
    }

    // For now, extract uid from token (อาจจะต้องใช้ adminAuth.verifyIdToken แทน)
    // แต่เนื่องจากเราใช้ session cookie อาจจะต้องปรับตรง AuthContext ให้เก็บ uid ใน cookie ด้วย
    const uid = cookies.uid; // ต้องเพิ่มการเก็บ uid ใน cookie ที่ AuthContext

    if (!uid) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // Fetch user profile from Realtime Database (SSR!)
    const userRef = adminDb.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return {
        props: {
          profile: null,
          error: "ไม่พบข้อมูลผู้ใช้",
        },
      };
    }

    const profile = snapshot.val() as UserProfile;

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

    console.log(`✅ SSR: Loaded profile for ${uid} in ${Date.now()}ms`);

    return {
      props: {
        profile: serializedProfile,
      },
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        profile: null,
        error: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      },
    };
  }
};
