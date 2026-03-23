import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  PlayCircle,
  Package,
  CreditCard,
  Banknote,
  FileText,
  Shield,
  Menu
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from "../../../firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "../../../utils/cn";

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const mainMenuItems = [
  { title: "ภาพรวมระบบ", icon: LayoutDashboard, path: "/admin" },
  { title: "จัดการผู้ใช้", icon: Users, path: "/admin/users", id: 'users' },
  { title: "จัดการเพลย์ลิสต์", icon: PlayCircle, path: "/admin/playlists" },
  { title: "แพ็กเกจ", icon: Package, path: "/admin/packages" },
  { title: "รายการสั่งซื้อ", icon: CreditCard, path: "/admin/payments", id: 'orders', badgeColor: "warning" },
  { title: "ตั้งค่าระบบ", icon: Settings, path: "/admin/config" },
  { title: "สิทธิ์การใช้งาน", icon: Banknote, path: "/admin/plans" },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<{ users: number; pendingOrders: number }>({ users: 0, pendingOrders: 0 });
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    // Real-time listener for Users
    if (!db) {
      console.log("📊 AdminSidebar: db is null, waiting...");
      return;
    }

    console.log("📊 AdminSidebar: Starting real-time listeners...");
    const usersRef = collection(db, 'users');
    const unsubscribeUsers = onSnapshot(usersRef, (snapshot) => {
      // console.log("📊 AdminSidebar: Users Count Update:", snapshot.size);
      setStats(prev => ({ ...prev, users: snapshot.size }));
    }, (error) => {
      console.error("Error watching users:", error);
    });

    // Real-time listener for Pending Orders
    const ordersQuery = query(collection(db, 'payment_proofs'), where('status', '==', 'pending'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      // console.log("📊 AdminSidebar: Pending Orders Update:", snapshot.size);
      setStats(prev => ({ ...prev, pendingOrders: snapshot.size }));
    }, (error) => {
      console.error("Error watching orders:", error);
    });

    return () => {
      // console.log("📊 AdminSidebar: Cleaning up listeners...");
      unsubscribeUsers();
      unsubscribeOrders();
    };
  }, [user?.uid]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 leading-none tracking-tight">YouOke</h1>
            <p className="text-xs text-primary font-medium tracking-wide opacity-90">แผงควบคุมหลัก</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent flex flex-col">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            เมนูหลัก
          </p>
          <div className="space-y-1">
            {mainMenuItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 mb-1 rounded-2xl transition-all duration-200 font-bold text-sm",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/25 translate-x-1"
                      : "text-gray-700 hover:bg-gray-100/50 hover:text-gray-900 border border-transparent hover:border-gray-200"
                  )}
                  onClick={() => {
                    if (window.innerWidth < 1024 && onToggle) {
                      onToggle();
                    }
                  }}
                >
                  <item.icon className={cn("h-[22px] w-[22px]", isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700")} />
                  <span>{item.title}</span>
                  {item.id === 'users' && stats.users > 0 && (
                    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-100 px-1.5 text-xs font-bold text-blue-600">
                      {stats.users}
                    </span>
                  )}
                  {item.id === 'orders' && stats.pendingOrders > 0 && (
                    <span className="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white shadow-lg shadow-orange-200 animate-pulse border border-white/20">
                      {stats.pendingOrders}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-6">
            <div className="px-3 mb-2 text-xs font-black text-gray-400 uppercase tracking-wider">บัญชี</div>
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-3 mb-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    user?.email?.[0]?.toUpperCase() || 'A'
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate">
                    {user?.displayName || 'Admin User'}
                  </span>
                  <span className="text-[10px] flex items-center gap-1 font-bold text-primary uppercase">
                    <Shield size={10} />
                    <span>ผู้ดูแลระบบ</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/admin/content/profile-pages"
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors border",
                    router.pathname.startsWith("/admin/content")
                      ? "bg-white border-primary/20 text-primary shadow-sm"
                      : "bg-white border-transparent text-gray-500 hover:bg-white hover:text-gray-900 hover:border-gray-200"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  <span>CMS</span>
                </Link>

                {!confirmLogout ? (
                  <button
                    onClick={() => setConfirmLogout(true)}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-xs font-medium transition-colors border border-transparent bg-white text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>ออกระบบ</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await logout();
                      } catch (e) {
                        console.error("Logout failed", e);
                        setConfirmLogout(false);
                      }
                    }}
                    onMouseLeave={() => setConfirmLogout(false)}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl text-[10px] font-black transition-all bg-red-600 text-white shadow-lg animate-pulse"
                  >
                    <Shield className="h-4 w-4" />
                    <span>กดยืนยัน?</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
};
