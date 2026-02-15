import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  PlayCircleIcon,
  ArchiveBoxIcon,
  CreditCardIcon,
  BanknotesIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from "../../../../firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "../../../utils/cn";

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

const mainMenuItems = [
  { title: "ภาพรวมระบบ", icon: HomeIcon, path: "/admin" },
  { title: "จัดการผู้ใช้", icon: UsersIcon, path: "/admin/users", id: 'users' },
  { title: "จัดการเพลย์ลิสต์", icon: PlayCircleIcon, path: "/admin/playlists" },
  { title: "แพ็กเกจ", icon: ArchiveBoxIcon, path: "/admin/packages" },
  { title: "รายการสั่งซื้อ", icon: CreditCardIcon, path: "/admin/payments", id: 'orders', badgeColor: "warning" },
  { title: "ตั้งค่าระบบ", icon: Cog6ToothIcon, path: "/admin/config" },
  { title: "สิทธิ์การใช้งาน", icon: BanknotesIcon, path: "/admin/plans" },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onToggle }) => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<{ users: number; pendingOrders: number }>({ users: 0, pendingOrders: 0 });

  useEffect(() => {
    // Real-time listener for Users
    if (!db) return;
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, users: snapshot.size }));
    }, (error) => {
      console.error("Error watching users:", error);
    });

    // Real-time listener for Pending Orders
    const ordersQuery = query(collection(db, 'payment_proofs'), where('status', '==', 'pending'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setStats(prev => ({ ...prev, pendingOrders: snapshot.size }));
    }, (error) => {
      // console.warn("Orders collection might be missing or permission denied.");
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
    };
  }, []);

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
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
            <PlayCircleIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-sidebar-foreground leading-none tracking-tight">YouOke</h1>
            <p className="text-xs text-primary font-medium tracking-wide opacity-90">แผงควบคุมหลัก</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
            เมนูหลัก
          </p>
          <ul className="space-y-1.5">
            {mainMenuItems.map((item) => {
              const isActive = router.pathname === item.path;

              // Determine Badge Content
              let badgeContent = null;
              if ((item as any).id === 'users') {
                badgeContent = stats?.users ? stats.users.toLocaleString() : "0";
              } else if ((item as any).id === 'orders') {
                badgeContent = stats?.pendingOrders ? stats.pendingOrders.toLocaleString() : null;
              }

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024 && onToggle) {
                        onToggle();
                      }
                    }}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isActive ? "text-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground")} />
                    <span className="flex-1 truncate">{item.title}</span>
                    {badgeContent && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm",
                        (item as any).badgeColor === "warning"
                          ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/20"
                          : "bg-sidebar-border text-sidebar-foreground/80"
                      )}>
                        {badgeContent}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Profile Content Section (Moved to Bottom) */}
          <div className="mt-6 px-3">
            <Link
              href="/admin/content/profile-pages"
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border border-sidebar-border/50",
                router.pathname === "/admin/content/profile-pages"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              onClick={() => {
                if (window.innerWidth < 1024 && onToggle) {
                  onToggle();
                }
              }}
            >
              <DocumentTextIcon className={cn("h-5 w-5 flex-shrink-0 transition-colors", router.pathname === "/admin/content/profile-pages" ? "text-primary" : "text-sidebar-muted group-hover:text-sidebar-foreground")} />
              <span className="flex-1 truncate">เนื้อหาโปรไฟล์</span>
            </Link>
          </div>
        </nav>

        {/* Bottom User Section */}
        <div className="mt-auto border-t border-sidebar-border bg-sidebar/50 backdrop-blur-xl relative overflow-hidden group">
          {/* Cover Photo / Premium Gradient Background */}
          <div className="absolute inset-0 h-16 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent z-0 opacity-50" />
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0" />

          <div className="relative z-10 p-4 pt-8">
            <div className="flex items-center gap-3">
              {/* Avatar with Glow */}
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-md group-hover:bg-primary/30 transition-all" />
                {user?.photoURL ? (
                  <img src={user.photoURL} className="relative h-10 w-10 rounded-full object-cover ring-2 ring-sidebar-border shadow-sm" alt="" />
                ) : (
                  <div className="relative h-10 w-10 flex items-center justify-center rounded-full bg-sidebar-accent text-primary text-sm font-bold ring-2 ring-sidebar-border shadow-sm">
                    {(user?.displayName || user?.email || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info with Fallback */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-bold text-sidebar-foreground group-hover:text-primary transition-colors">
                  {user?.displayName || (user?.email ? user.email.split('@')[0] : 'ผู้ใช้งาน')}
                </p>
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <p className="truncate text-[10px] text-sidebar-muted font-bold uppercase tracking-wider">
                    {(user?.role === 'admin' || user?.role === 'owner') ? 'ผู้ดูแลระบบ' : 'สมาชิกทั่วไป'}
                  </p>
                  <span className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                  <p className="truncate text-[9px] text-sidebar-muted/70 font-mono">
                    {user?.uid?.substring(0, 6)}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={async () => {
                  try {
                    await logout();
                    router.push('/login');
                  } catch (e) {
                    console.error("Logout failed", e);
                  }
                }}
                className="shrink-0 rounded-xl p-2.5 text-sidebar-muted hover:bg-destructive/10 hover:text-destructive transition-all cursor-pointer group/btn active:scale-95"
                title="ออกจากระบบ"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
