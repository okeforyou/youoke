import React from 'react';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  MicrophoneIcon,
  MusicalNoteIcon,
  TrophyIcon,
  RectangleStackIcon,
  ChatBubbleLeftIcon,
  ArrowLeftOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab?: number;
  onTabChange?: (tab: number) => void;
  className?: string;
}

interface NavLinkProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

const NavLink: React.FC<NavLinkProps> = ({ icon: Icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-3 px-4 py-3 w-full
      transition-colors rounded-lg
      ${active
        ? 'bg-primary text-primary-content'
        : 'text-base-content hover:bg-base-300'
      }
    `}
  >
    <Icon className="w-6 h-6 flex-shrink-0" />
    <span className="font-medium">{label}</span>
    {badge && (
      <span className="ml-auto badge badge-sm badge-primary">
        {badge}
      </span>
    )}
  </button>
);

export default function Sidebar({ activeTab = 0, onTabChange, className = '' }: SidebarProps) {
  const { user, logOut } = useAuth();
  const router = useRouter();
  const isHomePage = router.pathname === '/';

  const handleTabChange = (tab: number) => {
    if (onTabChange) {
      onTabChange(tab);
    }
    // Navigate to home if not already there
    if (!isHomePage) {
      router.push('/');
    }
  };

  const handleNavigation = (path: string) => {
    if (router.pathname === path) {
      // If already on the page, just scroll to top to redundant navigation error
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    router.push(path);
  };

  const handleLineContact = () => {
    window.open('https://line.me/R/ti/p/@243lercy', '_blank');
  };

  return (
    <aside
      className={`
        w-60 bg-base-200 border-r border-base-300
        flex flex-col h-screen
        ${className}
      `}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-base-300">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <MicrophoneIcon className="w-6 h-6 text-primary-content" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-base-content group-hover:text-primary transition-colors">
              YouOke
            </h1>
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {/* Home/Search Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-base-content/50 uppercase px-4 mb-2">
            เมนูหลัก
          </p>
          <NavLink
            icon={MusicalNoteIcon}
            label="แนะนำ"
            active={isHomePage && (activeTab === 0 || activeTab === 1)}
            onClick={() => handleTabChange(1)}
          />
          <NavLink
            icon={TrophyIcon}
            label="มาแรง"
            active={isHomePage && activeTab === 2}
            onClick={() => handleTabChange(2)}
          />
          <NavLink
            icon={RectangleStackIcon}
            label="เพลย์ลิสต์"
            active={isHomePage && activeTab === 3}
            onClick={() => handleTabChange(3)}
          />
        </div>

        {/* Support Section */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-base-content/50 uppercase px-4 mb-2">
            ช่วยเหลือ
          </p>
          <NavLink
            icon={ChatBubbleLeftIcon}
            label="ติดต่อ LINE"
            onClick={handleLineContact}
          />
        </div>

        {/* Account Section */}
        <div>
          {user?.uid && (
            <>
              {/* Show Admin link if user is admin */}
              {user?.role === 'admin' && (
                <NavLink
                  icon={Cog6ToothIcon}
                  label="Admin"
                  active={router.pathname.startsWith('/admin')}
                  onClick={() => handleNavigation('/admin')}
                />
              )}
            </>
          )}
        </div>
      </nav>

      {/* User Profile Card (Bottom) */}
      <div className="p-4 border-t border-base-300">
        {user?.uid ? (
          <button
            onClick={() => logOut()}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all font-medium"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>ออกจากระบบ</span>
          </button>
        ) : (
          <button
            onClick={() => handleNavigation('/login')}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 transition-all font-medium"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </aside>
  );
}
