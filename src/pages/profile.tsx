import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuthStore } from "@/modules/auth/useAuthStore";
import { SYSTEM_VERSION } from "@/core/version";
import { ProfileContent } from "@/components/profile/ProfileContent";
import { XMarkIcon } from "@heroicons/react/24/outline";

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
    <div className="min-h-screen w-full relative font-sans selection:bg-primary/10 overflow-hidden flex items-center justify-center bg-slate-50/30 dark:bg-zinc-950/30">
      <Head>
        <title>Identity Hub - YouOke v{SYSTEM_VERSION}</title>
      </Head>

      {/* 🌑 Deep Blurred Backdrop (Simulating being over the app) */}
      <div className="fixed inset-0 bg-slate-200/40 dark:bg-zinc-900/40 backdrop-blur-3xl" />

      {/* 🚀 Unified Centered Drawer Card */}
      <main className="relative z-10 w-full max-w-lg mx-auto sm:px-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-white dark:bg-zinc-950 shadow-[0_48px_100px_-12px_rgba(0,0,0,0.15)] sm:rounded-[40px] border border-slate-100 dark:border-zinc-800 overflow-hidden flex flex-col h-screen sm:h-auto sm:max-h-[85vh]">
          
          {/* Header (Mirrors Drawer Header) */}
          <header className="px-8 py-5 border-b border-slate-50 dark:border-zinc-900 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-20">
             <div className="flex flex-col">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Identity Hub</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Account & System Settings</p>
             </div>
             <button 
                onClick={() => router.push('/')}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-zinc-900 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
             >
                <XMarkIcon className="w-6 h-6" />
             </button>
          </header>

          {/* Scrollable Body (The Real Content) */}
          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
             <div className="p-2 sm:p-4">
                <ProfileContent />
             </div>
             
             {/* Footer Mark (Subtle) */}
             <div className="px-10 py-8 text-center bg-slate-50/30 dark:bg-zinc-900/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-px bg-slate-200 dark:bg-zinc-800"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
                    <div className="w-8 h-px bg-slate-200 dark:bg-zinc-800"></div>
                </div>
                <p className="text-[9px] font-black text-slate-300 dark:text-zinc-600 uppercase tracking-[0.4em]">Integrated Identity System v{SYSTEM_VERSION}</p>
             </div>
          </div>
        </div>
      </main>

      {/* 🏠 Home Shortcut (Floating for safety) */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:block">
         <button 
            onClick={() => router.push('/')}
            className="px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-zinc-950 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all opacity-40 hover:opacity-100"
         >
            Back to Dashboard
         </button>
      </div>
    </div>
  );
}
