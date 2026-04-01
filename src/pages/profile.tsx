import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ArrowLeft, Home, Bell, User } from "lucide-react";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { SYSTEM_VERSION } from "@/core/version";
import { ProfileContent } from "@/components/profile/ProfileContent";

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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-zinc-950">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-zinc-950 font-sans selection:bg-primary/10">
      <Head>
        <title>Account Settings - YouOke v{SYSTEM_VERSION}</title>
      </Head>

      {/* 🚀 Ultra-Clean Global Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 dark:bg-zinc-900/80 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
            <button 
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-black uppercase tracking-widest">Back to Home</span>
            </button>
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <User className="w-4 h-4" />
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
        </div>
      </nav>

      {/* 💎 Focused Settings Hub Card */}
      <main className="max-w-2xl mx-auto pt-24 pb-24 px-4 md:px-0 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] rounded-[48px] overflow-hidden border border-slate-100 dark:bg-zinc-900 dark:border-zinc-800 relative group transition-all hover:border-slate-200">
          
          {/* Internal Page Label */}
          <div className="px-10 pt-14 pb-4">
             <div className="flex items-center gap-2 mb-2">
                 <div className="w-8 h-1 bg-primary rounded-full"></div>
                 <div className="w-2 h-1 bg-primary/20 rounded-full"></div>
             </div>
             <h1 className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">Identity Hub</h1>
             <p className="text-slate-400 font-bold mt-2 text-xs uppercase tracking-[0.2em]">User Profile & System Permissions</p>
          </div>

          <div className="p-2 md:p-6 mb-10">
            <ProfileContent />
          </div>

          {/* Minimal Traceback Info */}
          <div className="p-8 border-t border-slate-50 dark:border-zinc-900 bg-slate-50/10 text-center">
             <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.4em]">Official YouOKE System v{SYSTEM_VERSION}</p>
          </div>
        </div>

        {/* Home Utility below main card */}
        <div className="mt-12 text-center">
            <button 
                onClick={() => router.push('/')}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white shadow-sm ring-1 ring-slate-100 hover:ring-primary/20 hover:shadow-xl hover:text-primary transition-all rounded-[24px] text-xs font-black uppercase tracking-widest text-slate-400 active:scale-95 group"
            >
                <div className="bg-slate-100 p-2 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <Home className="w-4 h-4" />
                </div>
                <span>Return to Dashboard</span>
            </button>
        </div>
      </main>

      {/* 🛑 Hiding BottomNavigation for the standalone Hub view to match user's clean flow */}
    </div>
  );
}
