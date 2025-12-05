import { useRouter } from "next/router";
import Head from "next/head";
import {
  UserCircleIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  ChevronRightIcon,
  HomeIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function AccountPage() {
  const router = useRouter();
  const { user, logOut } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user?.uid) {
      router.push("/login");
    }
  }, [user, router]);

  async function handleLogout() {
    try {
      await logOut();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  if (!user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>บัญชีของฉัน - Oke for You คาราโอเกะออนไลน์</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 pb-24">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header with Avatar */}
          <div className="text-center mb-8">
            <div className="avatar placeholder mb-4">
              <div className="bg-primary text-primary-content rounded-full w-24">
                <span className="text-3xl">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">บัญชีของฉัน</h1>
            <p className="text-base-content/60">{user.email}</p>
          </div>

          {/* Menu Cards */}
          <div className="space-y-3">
            {/* Subscription Status Card */}
            <button
              onClick={() => router.push("/subscription")}
              className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] w-full"
            >
              <div className="card-body p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <CreditCardIcon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">สถานะสมาชิก</h3>
                      <p className="text-sm text-base-content/60">
                        ดูแพ็กเกจและวันหมดอายุ
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-base-content/30" />
                </div>
              </div>
            </button>

            {/* Pricing/Membership Card */}
            <button
              onClick={() => router.push("/pricing")}
              className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] w-full border-2 border-primary/20"
            >
              <div className="card-body p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-primary p-3 rounded-full">
                      <SparklesIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">จัดการแพ็กเกจ</h3>
                      <p className="text-sm text-base-content/60">
                        เลือกแพ็กเกจ, อัพเกรด หรือต่ออายุ
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </button>

            {/* Line@ Contact Card */}
            <button
              onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
              className="card bg-success/10 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] w-full border-2 border-success/20"
            >
              <div className="card-body p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-success p-3 rounded-full">
                      <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">ติดต่อเรา</h3>
                      <p className="text-sm text-base-content/60">
                        สอบถามปัญหา หรือขอความช่วยเหลือ
                      </p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-6 h-6 text-success" />
                </div>
              </div>
            </button>

            <div className="divider my-6"></div>

            {/* Back to Home */}
            <button
              onClick={() => router.push("/")}
              className="btn btn-ghost btn-block justify-start gap-3 h-auto py-4"
            >
              <HomeIcon className="w-6 h-6" />
              <span className="text-base">กลับหน้าหลัก</span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="btn btn-outline btn-error btn-block justify-start gap-3 h-auto py-4"
            >
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
              <span className="text-base">ออกจากระบบ</span>
            </button>
          </div>

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-base-content/50">
              Oke for You - คาราโอเกะออนไลน์
            </p>
            <p className="text-xs text-base-content/40 mt-1">
              เวอร์ชัน 1.0.0
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
