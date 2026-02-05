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
      transition-all duration-200 rounded-xl group
      ${active
        ? 'bg-[#FF0000] text-white shadow-[0_0_20px_rgba(255,0,0,0.3)]'
        : 'text-white/60 hover:bg-white/5 hover:text-white'
      }
    `}
  >
    <Icon className={`w-6 h-6 flex-shrink-0 transition-transform group-active:scale-95 ${active ? 'fill-white/10' : ''}`} />
    <span className="font-semibold tracking-wide">{label}</span>
    {badge && (
      <span className={`ml-auto badge badge-sm ${active ? 'bg-white text-[#FF0000] border-none' : 'badge-primary'}`}>
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
        w-64 bg-black/40 backdrop-blur-xl border-r border-white/5
        flex flex-col h-screen z-30
        ${className}
      `}
    >
      {/* Logo Section */}
      <div className="p-8 border-b border-base-200/50">
        <button
          onClick={() => handleNavigation('/')}
          className="flex items-center gap-4 group"
        >
          <div className="w-12 h-12 bg-[#FF0000] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF0000]/20 group-hover:rotate-6 transition-transform">
            <MicrophoneIcon className="w-7 h-7 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-2xl font-black text-white tracking-tighter group-hover:text-[#FF0000] transition-colors">
              YouOke
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 leading-none">Karaoke Online</p>
          </div>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Home/Search Section */}
        <div className="mb-8">
          <p className="text-[11px] font-black text-white/30 uppercase px-4 mb-3 tracking-widest">
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
        <div className="mb-8">
          <p className="text-[11px] font-black text-white/30 uppercase px-4 mb-3 tracking-widest">
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
      <div className="p-4 border-t border-white/5 bg-black/20">
        {user?.uid ? (
          <button
            onClick={() => logOut()}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white shadow-sm transition-all font-bold text-sm"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5 text-white/40" />
            <span>ออกจากระบบ</span>
          </button>
        ) : (
          <button
            onClick={() => handleNavigation('/login')}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#FF0000] hover:bg-[#D00000] text-white shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-all font-bold text-sm"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span>เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </aside>
  );
}
