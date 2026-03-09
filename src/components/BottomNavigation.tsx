import { useRouter } from 'next/router'
import { useTransition } from 'react'

import {
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftIcon,
  HomeIcon,
  MusicalNoteIcon,
  RectangleStackIcon,
  TrophyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from "@/context/AuthContext";
import { auth } from "@/firebase";
import { usePlayerStore } from '../modules/player/stores/usePlayerStore'
import { useUIStore } from '../stores/useUIStore'

import { useNotificationCount } from '@/hooks/useNotificationCount'

export default function BottomNavigation() {
  const { activeIndex, setActiveIndex } = usePlayerStore();
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const unreadCount = useNotificationCount();

  // Helper function to handle navigation to home page with active index
  const navigateToHome = (index: number) => {
    setActiveIndex(index);
    if (router.pathname !== '/') {
      router.push('/');
    }
  };

  // Helper function to handle navigation to account page
  const navigateToAccount = () => {
    startTransition(() => {
      router.push('/account');
    });
  };

  // Helper function to handle navigation to login page
  const navigateToLogin = () => {
    startTransition(() => {
      router.push('/login');
    });
  };

  // Check if current page is home
  const isHomePage = router.pathname === '/';
  const isAccountPage = router.pathname === '/account';

  return (
    <div className="btm-nav fixed bottom-0 w-full sm:w-1/2 text-sm z-50 h-16">
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isHomePage && activeIndex === 1 ? "active" : ""}`}
        onClick={() => navigateToHome(1)}
      >
        <HomeIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">หน้าแรก</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isHomePage && activeIndex === 2 ? "active" : ""}`}
        onClick={() => navigateToHome(2)}
      >
        <RectangleStackIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">แนะนำ</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isHomePage && activeIndex === 3 ? "active" : ""}`}
        onClick={() => navigateToHome(3)}
      >
        <TrophyIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">มาแรง</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${router.pathname === '/store' ? "active text-red-600" : ""}`}
        onClick={() => router.push('/store')}
      >
        <RectangleStackIcon className="w-6 h-6 pointer-events-none transform rotate-90" />
        <span className="btm-nav-label pointer-events-none">Apps</span>
      </button>
      {!user?.uid ? (
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2"
          onClick={navigateToLogin}
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <ArrowLeftOnRectangleIcon className="w-6 h-6 pointer-events-none" />
          )}
          <span className="btm-nav-label pointer-events-none">เข้าสู่ระบบ</span>
        </button>
      ) : (
        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 relative ${isAccountPage ? "active" : ""}`}
          onClick={() => useUIStore.getState().setProfileOpen(true)}
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <div className="relative">
              {/* Check both user store and direct firebase auth (ultimate fallback) */}
              {(user.photoURL || auth?.currentUser?.photoURL) ? (
                <div className="w-6 h-6 rounded-full overflow-hidden ring-1 ring-primary/20 bg-muted">
                  <img src={user.photoURL || auth?.currentUser?.photoURL || ""} alt="Profile" className="w-full h-full object-cover" />
                </div>
              ) : (
                <UserCircleIcon className="w-6 h-6 pointer-events-none" />
              )}

              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white z-10">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          )}
          <span className="btm-nav-label pointer-events-none">บัญชี</span>
        </button>
      )}
    </div>
  );
}
