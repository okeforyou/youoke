import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, User, LogOut, Settings, Bell } from "lucide-react";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import BottomNavigation from "../components/BottomNavigation";
import { MembershipCard } from "../components/profile/MembershipCard";
import { PackageStore } from "../components/profile/PackageStore";
import { NotificationList } from "../components/profile/NotificationList";
import { SYSTEM_VERSION } from "@/core/version";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, isLoading } = useAuthStore();
  const packageSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleScrollToPackages = () => {
    packageSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 font-sans text-foreground dark:bg-zinc-950">
      <Head>
        <title>โปรไฟล์ - YouOke v{SYSTEM_VERSION}</title>
      </Head>

      {/* Mobile Top Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between lg:hidden dark:bg-zinc-900/80 dark:border-zinc-800">
        <h1 className="text-lg font-black text-slate-900 dark:text-white">โปรไฟล์</h1>
        <div className="flex items-center gap-3">
             <Bell className="w-5 h-5 text-slate-400" />
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-black text-primary">{(user as any).displayName?.charAt(0)}</span>
             </div>
        </div>
      </div>

      <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* 🌑 Left Sidebar: The Identity Panel (Compact & Sharp) */}
          <div className="w-full lg:w-[340px] shrink-0 space-y-6 lg:sticky lg:top-8">
            
            {/* Main Profile Card (Bento Style) */}
            <div className="relative group overflow-hidden rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm transition-all hover:shadow-xl dark:bg-zinc-900 dark:border-zinc-800">
              {/* Subtle Gradient Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>
              
              <div className="relative mx-auto mb-6 w-28 h-28 p-1.5 rounded-full border-2 border-slate-100 bg-white dark:bg-zinc-800 dark:border-zinc-700">
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-slate-50 text-3xl font-black text-slate-400 overflow-hidden dark:bg-zinc-900">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    user.displayName?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                {/* Active Indicator */}
                <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full dark:border-zinc-800 shadow-sm"></div>
              </div>

              <div className="flex flex-col items-center gap-1.5 relative z-10">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 dark:text-white">
                  {user.displayName}
                  {(user.role === 'admin' || user.role === 'owner') && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter ring-1 ring-primary/20">ADMIN</span>
                  )}
                </h2>
                <p className="text-[13px] font-bold text-slate-400 dark:text-zinc-500">{user.email}</p>
                
                {(user.role === 'admin' || user.role === 'owner') && (
                   <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-slate-50 rounded-full border border-slate-100 dark:bg-zinc-800/50 dark:border-zinc-700">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400">FULL SYSTEM ACCESS</span>
                   </div>
                )}
              </div>

              <div className="mt-10 space-y-3">
                <button 
                  onClick={() => router.push('/profile/edit')}
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2.5 font-black text-sm bg-slate-950 text-white hover:bg-slate-800 transition-all active:scale-[0.97] dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow-lg shadow-slate-200 dark:shadow-none"
                >
                  <Settings className="w-4 h-4" /> จัดการข้อมูลส่วนตัว
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full h-12 rounded-2xl flex items-center justify-center gap-2.5 font-black text-sm text-rose-500 hover:bg-rose-50 transition-all active:scale-[0.97] dark:hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" /> ออกจากระบบ
                </button>
              </div>
            </div>

            {/* Notifications Box (Integrated) */}
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:bg-zinc-900 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <Bell className="w-4 h-4 text-primary" />
                  การแจ้งเตือน
                </h3>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ล่าสุด</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto no-scrollbar">
                <NotificationList />
              </div>
            </div>
          </div>

          {/* 💎 Right Main: The Power Panel (Membership & Packages) */}
          <div className="flex-1 space-y-10">
            
            {/* Membership Visualizer Section */}
            <section className="animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary/10 rounded-2xl">
                    <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white">ข้อมูลสมาชิก</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest dark:text-zinc-500">Your Membership Plan</p>
                </div>
              </div>
              
              <div className="group transition-all">
                <MembershipCard
                  membership={user.membership || { type: 'free', status: 'active', expiresAt: null }}
                  role={user.role}
                  onUpgrade={handleScrollToPackages}
                />
              </div>
            </section>

            {/* Separator Decor */}
            <div className="relative py-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-zinc-800"></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-zinc-800"></div>
            </div>

            {/* Package Store Section */}
            <section ref={packageSectionRef} className="scroll-mt-20 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              <div className="bg-white/40 backdrop-blur-sm rounded-[40px] border border-slate-200/50 p-6 md:p-10 dark:bg-zinc-900/40 dark:border-zinc-800/50">
                <PackageStore />
              </div>
            </section>
          </div>

        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
