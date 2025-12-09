import { useRouter } from "next/router";
import Head from "next/head";
import {
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
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
      return;
    }

    // Redirect to dashboard (new user area)
    router.push("/dashboard");
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

      <div className="min-h-screen bg-base-200 pb-24">
        <div className="container mx-auto px-4 py-8 max-w-md">
          {/* Header - Simple */}
          <div className="text-center mb-6">
            <div className="avatar placeholder mb-3">
              <div className="bg-primary text-primary-content rounded-full w-20">
                <span className="text-2xl">
                  {user.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
            </div>
            <h1 className="text-2xl font-bold">โปรไฟล์</h1>
            <p className="text-sm text-base-content/60 mt-1">{user.email}</p>
          </div>

          {/* Single Card with All Options */}
          <div className="card bg-base-100 shadow-lg mb-4">
            <div className="card-body p-0">
              {/* Subscription Status */}
              <button
                onClick={() => router.push("/subscription")}
                className="w-full text-left px-6 py-4 hover:bg-base-200 transition-colors border-b border-base-200"
              >
                <div className="font-medium">สถานะสมาชิก</div>
                <div className="text-sm text-base-content/60 mt-1">
                  ดูแพ็กเกจและวันหมดอายุ
                </div>
              </button>

              {/* Manage Package */}
              <button
                onClick={() => router.push("/pricing")}
                className="w-full text-left px-6 py-4 hover:bg-base-200 transition-colors border-b border-base-200"
              >
                <div className="font-medium">จัดการแพ็กเกจ</div>
                <div className="text-sm text-base-content/60 mt-1">
                  เลือกแพ็กเกจ, อัพเกรด หรือต่ออายุ
                </div>
              </button>

              {/* Contact */}
              <button
                onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
                className="w-full text-left px-6 py-4 hover:bg-base-200 transition-colors"
              >
                <div className="font-medium">ติดต่อเรา</div>
                <div className="text-sm text-base-content/60 mt-1">
                  สอบถามปัญหา หรือขอความช่วยเหลือ
                </div>
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-outline btn-error btn-block"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            ออกจากระบบ
          </button>
        </div>
      </div>
    </>
  );
}
