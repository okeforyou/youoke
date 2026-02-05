import { useRouter } from 'next/router'
import { useTransition } from 'react'

import {
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftIcon,
  MusicalNoteIcon,
  RectangleStackIcon,
  TrophyIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'

import { useAuth } from '../context/AuthContext'
import { useKaraokeState } from '../hooks/karaoke'

export default function BottomNavigation() {
  const { activeIndex, setActiveIndex } = useKaraokeState();
  const { user, logOut } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
    <div className="btm-nav fixed bottom-0 w-full lg:hidden text-sm z-50 h-16 landscape:hidden pb-safe bg-black/60 backdrop-blur-xl border-t border-white/10">
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] transition-all duration-300 ${isHomePage && (activeIndex === 0 || activeIndex === 1) ? "text-[#FF0000] border-t-2 border-[#FF0000]" : "text-white/40"}`}
        onClick={() => navigateToHome(1)}
      >
        <MusicalNoteIcon className={`w-6 h-6 pointer-events-none ${isHomePage && (activeIndex === 0 || activeIndex === 1) ? "fill-[#FF0000]/10" : ""}`} />
        <span className="btm-nav-label pointer-events-none font-medium">แนะนำ</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] transition-all duration-300 ${isHomePage && activeIndex === 2 ? "text-[#FF0000] border-t-2 border-[#FF0000]" : "text-white/40"}`}
        onClick={() => navigateToHome(2)}
      >
        <TrophyIcon className={`w-6 h-6 pointer-events-none ${isHomePage && activeIndex === 2 ? "fill-[#FF0000]/10" : ""}`} />
        <span className="btm-nav-label pointer-events-none font-medium">มาแรง</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] transition-all duration-300 ${isHomePage && activeIndex === 3 ? "text-[#FF0000] border-t-2 border-[#FF0000]" : "text-white/40"}`}
        onClick={() => navigateToHome(3)}
      >
        <RectangleStackIcon className={`w-6 h-6 pointer-events-none ${isHomePage && activeIndex === 3 ? "fill-[#FF0000]/10" : ""}`} />
        <span className="btm-nav-label pointer-events-none font-medium">เพลย์ลิสต์</span>
      </button>
      <button
        type="button"
        className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-white/40 p-2"
        onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
      >
        <ChatBubbleLeftIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none font-medium">ติดต่อ</span>
      </button>
      {!user.uid ? (
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-white/40 p-2"
          onClick={navigateToLogin}
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <ArrowLeftOnRectangleIcon className="w-6 h-6 pointer-events-none" />
          )}
          <span className="btm-nav-label pointer-events-none font-medium">เข้าสู่ระบบ</span>
        </button>
      ) : (
        <button
          type="button"
          className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-white/40 p-2"
          onClick={() => logOut()}
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <ArrowLeftOnRectangleIcon className="w-6 h-6 pointer-events-none" />
          )}
          <span className="btm-nav-label pointer-events-none font-medium">ออก</span>
        </button>
      )}
    </div>
  );
}
