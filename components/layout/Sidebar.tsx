import React from 'react';
import { useRouter } from 'next/router';
import {
  HomeIcon,
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
  const { user } = useAuth();
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
            <MusicalNoteIcon className="w-6 h-6 text-primary-content" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-base-content group-hover:text-primary transition-colors">
              YouOke
            </h1>
            <p className="text-xs text-base-content/60">Karaoke Online</p>
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
            icon={HomeIcon}
            label="หน้าหลัก"
            active={isHomePage && activeTab === 0}
            onClick={() => handleTabChange(0)}
          />
          <NavLink
            icon={MusicalNoteIcon}
            label="แนะนำ"
            active={isHomePage && activeTab === 1}
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
          <p className="text-xs font-semibold text-base-content/50 uppercase px-4 mb-2">
            บัญชี
          </p>
          {user?.uid ? (
            <>
              <NavLink
                icon={UserCircleIcon}
                label="โปรไฟล์"
                active={router.pathname === '/account'}
                onClick={() => handleNavigation('/account')}
              />
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
          ) : (
            <NavLink
              icon={ArrowLeftOnRectangleIcon}
              label="เข้าสู่ระบบ"
              active={router.pathname === '/login'}
              onClick={() => handleNavigation('/login')}
            />
          )}
        </div>
      </nav>

      {/* User Profile Card (Bottom) */}
      {user?.uid && (
        <div className="p-4 border-t border-base-300">
          <button
            onClick={() => handleNavigation('/account')}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-base-300 transition-colors"
          >
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10">
                <span className="text-lg">
                  {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="font-semibold text-sm truncate">
                {user.displayName || 'ผู้ใช้'}
              </p>
              <p className="text-xs text-base-content/60 truncate">
                {user.email}
              </p>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
