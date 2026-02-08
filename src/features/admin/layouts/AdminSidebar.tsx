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
import { useAuth } from "../../../../context/AuthContext";
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
  { title: "เนื้อหาโปรไฟล์", icon: DocumentTextIcon, path: "/admin/content/profile-pages" },
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
            <p className="text-xs text-primary font-medium tracking-wide opacity-90">ADMIN DASHBOARD</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-muted">
            Main Menu
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
        </nav>

        {/* Bottom User Section */}
        <div className="border-t border-sidebar-border p-4 bg-sidebar-accent/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-border text-sidebar-foreground text-sm font-medium shrink-0 shadow-sm ring-2 ring-sidebar-border">
              {user?.displayName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.displayName || 'Admin'}
              </p>
              <p className="truncate text-xs text-sidebar-muted">
                {user?.email || 'admin@youoke.com'}
              </p>
            </div>
            <button
              onClick={async () => {
                try {
                  await logout();
                  router.push('/login');
                } catch (e) {
                  console.error("Logout failed", e);
                }
              }}
              className="shrink-0 rounded-lg p-2 text-sidebar-muted hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer group"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
