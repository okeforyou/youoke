import { useRouter } from 'next/router'

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

  // Helper function to handle navigation to home page with active index
  const navigateToHome = (index: number) => {
    setActiveIndex(index);
    if (router.pathname !== '/') {
      router.push('/');
    }
  };

  // Helper function to handle navigation to account page
  const navigateToAccount = () => {
    if (router.pathname !== '/account') {
      router.push('/account');
    }
  };

  // Helper function to handle navigation to login page
  const navigateToLogin = () => {
    if (router.pathname !== '/login') {
      router.push('/login');
    }
  };

  // Check if current page is home
  const isHomePage = router.pathname === '/';
  const isAccountPage = router.pathname === '/account';

  return (
    <div className="btm-nav fixed bottom-0 w-full sm:w-1/2 text-sm z-50 h-16">
      <button
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary ${isHomePage && activeIndex === 1 ? "active" : ""}`}
        onClick={() => navigateToHome(1)}
      >
        <MusicalNoteIcon className="w-6 h-6" />
        <span className="btm-nav-label">แนะนำ</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary ${isHomePage && activeIndex === 2 ? "active" : ""}`}
        onClick={() => navigateToHome(2)}
      >
        <TrophyIcon className="w-6 h-6" />
        <span className="btm-nav-label">มาแรง</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary ${isHomePage && activeIndex === 3 ? "active" : ""}`}
        onClick={() => navigateToHome(3)}
      >
        <RectangleStackIcon className="w-6 h-6" />
        <span className="btm-nav-label">เพลย์ลิสต์</span>
      </button>
      <button
        className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary"
        title="ติดต่อเรา"
        onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
      >
        <ChatBubbleLeftIcon className="w-6 h-6" />
        <span className="btm-nav-label">ติดต่อ</span>
      </button>
      {!user.uid ? (
        <button
          title="เข้าสู่ระบบ"
          className="flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary"
          onClick={navigateToLogin}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          <span className="btm-nav-label">เข้าสู่ระบบ</span>
        </button>
      ) : (
        <button
          className={`flex flex-col items-center justify-center gap-1 min-h-[64px] text-primary ${isAccountPage ? "active" : ""}`}
          title="บัญชีของฉัน"
          onClick={navigateToAccount}
        >
          <UserCircleIcon className="w-6 h-6" />
          <span className="btm-nav-label">บัญชี</span>
        </button>
      )}
    </div>
  );
}
