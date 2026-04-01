import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, User, LogOut, Settings, Bell } from "lucide-react";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { SYSTEM_VERSION } from "@/core/version";
import { ProfileContent } from "@/components/profile/ProfileContent";
import BottomNavigation from "@/components/BottomNavigation";

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24 font-sans">
      <Head>
        <title>โปรไฟล์ - YouOke v{SYSTEM_VERSION}</title>
      </Head>

      {/* Desktop/Mobile Focused Container */}
      <main className="max-w-2xl mx-auto md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <div className="bg-white shadow-2xl md:rounded-[48px] overflow-hidden border border-slate-100 dark:bg-zinc-950 dark:border-zinc-800">
          {/* Header Bar */}
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900/50">
             <h1 className="text-xl font-black text-slate-900 dark:text-white">โปรไฟล์ของฉัน</h1>
             <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <User className="w-5 h-5" />
             </div>
          </div>

          <div className="p-2 md:p-6">
            <ProfileContent />
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
