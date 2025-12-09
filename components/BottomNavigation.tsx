import { useRouter } from 'next/router'

import {
    ArrowLeftOnRectangleIcon,
    ChatBubbleLeftIcon,
    HomeIcon,
    ChartBarIcon,
    UserCircleIcon,
} from '@heroicons/react/24/outline'

import {
    HomeIcon as HomeIconSolid,
    ChartBarIcon as ChartBarIconSolid,
    UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid'

import { useAuth } from '../context/AuthContext'

export default function BottomNavigation() {
  const { user } = useAuth();
  const router = useRouter();

  // Determine active state based on current path
  const isHome = router.pathname === '/';
  const isDashboard = router.pathname === '/dashboard';
  const isProfile = router.pathname === '/profile' || router.pathname === '/account';

  return (
    <div className="btm-nav fixed bottom-0 w-full sm:w-1/2 h-16 text-sm z-50 bg-base-100 border-t border-base-300">
      {/* Home */}
      <button
        className={`text-primary shrink ${isHome ? "active" : ""}`}
        onClick={() => router.push('/')}
        title="หน้าหลัก"
      >
        {isHome ? (
          <HomeIconSolid className="w-6 h-6" />
        ) : (
          <HomeIcon className="w-6 h-6" />
        )}
        <span className="btm-nav-label">หน้าหลัก</span>
      </button>

      {/* Dashboard (only show if logged in) */}
      {user.uid ? (
        <button
          className={`text-primary shrink ${isDashboard ? "active" : ""}`}
          onClick={() => router.push('/dashboard')}
          title="ภาพรวม"
        >
          {isDashboard ? (
            <ChartBarIconSolid className="w-6 h-6" />
          ) : (
            <ChartBarIcon className="w-6 h-6" />
          )}
          <span className="btm-nav-label">ภาพรวม</span>
        </button>
      ) : (
        <button
          className="text-primary shrink"
          title="ติดต่อเรา"
          onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
        >
          <ChatBubbleLeftIcon className="w-6 h-6" />
          <span className="btm-nav-label">ติดต่อ</span>
        </button>
      )}

      {/* Contact */}
      <button
        className="text-primary shrink"
        title="ติดต่อเรา"
        onClick={() => window.open("https://line.me/R/ti/p/@243lercy", "_blank")}
      >
        <ChatBubbleLeftIcon className="w-6 h-6" />
        <span className="btm-nav-label">ติดต่อ</span>
      </button>

      {/* Profile / Login */}
      {!user.uid ? (
        <button
          title="เข้าสู่ระบบ"
          className={`text-primary shrink`}
          onClick={() => router.push("/login")}
        >
          <ArrowLeftOnRectangleIcon className="w-6 h-6" />
          <span className="btm-nav-label">เข้าสู่ระบบ</span>
        </button>
      ) : (
        <button
          className={`text-primary shrink ${isProfile ? "active" : ""}`}
          title="โปรไฟล์"
          onClick={() => router.push("/profile")}
        >
          {isProfile ? (
            <UserCircleIconSolid className="w-6 h-6" />
          ) : (
            <UserCircleIcon className="w-6 h-6" />
          )}
          <span className="btm-nav-label">โปรไฟล์</span>
        </button>
      )}
    </div>
  );
}
