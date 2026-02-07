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
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <PlayCircleIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 leading-none">YouOke</h1>
            <p className="text-xs text-primary font-medium">Admin</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Menu
          </p>
          <ul className="space-y-1">
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
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024 && onToggle) {
                        onToggle();
                      }
                    }}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-gray-400 group-hover:text-gray-500")} />
                    <span className="flex-1 truncate">{item.title}</span>
                    {badgeContent && (
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        (item as any).badgeColor === "warning"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
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
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-sm font-medium shrink-0">
              {user?.displayName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="truncate text-sm font-medium text-gray-900">
                {user?.displayName || 'Admin'}
              </p>
              <p className="truncate text-xs text-gray-500">
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
              className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors cursor-pointer"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
