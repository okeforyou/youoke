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
  const { user } = useAuth();
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
    <div className="btm-nav fixed bottom-0 w-full sm:w-1/2 text-sm z-50 h-16">
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isHomePage && activeIndex === 1 ? "active" : ""}`}
        onClick={() => navigateToHome(1)}
      >
        <MusicalNoteIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">แนะนำ</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isHomePage && activeIndex === 2 ? "active" : ""}`}
        onClick={() => navigateToHome(2)}
      >
        <TrophyIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">มาแรง</span>
      </button>
      <button
        type="button"
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isHomePage && activeIndex === 3 ? "active" : ""}`}
        onClick={() => navigateToHome(3)}
      >
        <RectangleStackIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">เพลย์ลิสต์</span>
      </button>
      <button
        type="button"
        className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2"
        onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
      >
        <ChatBubbleLeftIcon className="w-6 h-6 pointer-events-none" />
        <span className="btm-nav-label pointer-events-none">ติดต่อ</span>
      </button>
      {!user.uid ? (
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
          className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary p-2 ${isAccountPage ? "active" : ""}`}
          onClick={navigateToAccount}
          disabled={isPending}
        >
          {isPending ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <UserCircleIcon className="w-6 h-6 pointer-events-none" />
          )}
          <span className="btm-nav-label pointer-events-none">บัญชี</span>
        </button>
      )}
    </div>
  );
}
