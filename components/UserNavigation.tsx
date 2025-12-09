import { useRouter } from 'next/router'
import {
  HomeIcon,
  ChartBarIcon,
  UserCircleIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserCircleIcon as UserCircleIconSolid,
  CreditCardIcon as CreditCardIconSolid,
} from '@heroicons/react/24/solid'

export default function UserNavigation() {
  const router = useRouter();

  // Determine active state based on current path
  const isHome = router.pathname === '/';
  const isDashboard = router.pathname === '/dashboard';
  const isProfile = router.pathname === '/profile';
  const isPricing = router.pathname === '/pricing';

  return (
    <div className="btm-nav fixed bottom-0 w-full sm:w-1/2 h-16 text-sm z-50 bg-base-100 border-t border-base-300 shadow-lg">
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

      {/* Dashboard */}
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

      {/* Pricing */}
      <button
        className={`text-primary shrink ${isPricing ? "active" : ""}`}
        onClick={() => router.push('/pricing')}
        title="แพ็คเกจ"
      >
        {isPricing ? (
          <CreditCardIconSolid className="w-6 h-6" />
        ) : (
          <CreditCardIcon className="w-6 h-6" />
        )}
        <span className="btm-nav-label">แพ็คเกจ</span>
      </button>

      {/* Profile */}
      <button
        className={`text-primary shrink ${isProfile ? "active" : ""}`}
        title="โปรไฟล์"
        onClick={() => router.push('/profile')}
      >
        {isProfile ? (
          <UserCircleIconSolid className="w-6 h-6" />
        ) : (
          <UserCircleIcon className="w-6 h-6" />
        )}
        <span className="btm-nav-label">โปรไฟล์</span>
      </button>
    </div>
  );
}
