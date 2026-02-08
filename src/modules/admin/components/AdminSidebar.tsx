import {
    UsersIcon,
    PlayCircleIcon,
    Cog6ToothIcon,
    HomeIcon,
    ArchiveBoxIcon, // Replaces Package
    CreditCardIcon,
    ArrowLeftOnRectangleIcon, // Replaces LogOut
    BanknotesIcon,
    PuzzlePieceIcon,
    DocumentTextIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";
import { cn } from "@/lib/utils";

import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthStore } from "@/modules/auth/useAuthStore";

const mainMenuItems = [
    { title: "ภาพรวมระบบ", icon: HomeIcon, path: "/admin" },
    { title: "จัดการผู้ใช้", icon: UsersIcon, path: "/admin/users", id: 'users' },
    { title: "จัดการเพลย์ลิสต์", icon: PlayCircleIcon, path: "/admin/playlists" },
    { title: "แพ็กเกจ", icon: ArchiveBoxIcon, path: "/admin/packages" },
    { title: "รายการสั่งซื้อ", icon: CreditCardIcon, path: "/admin/orders", id: 'orders', badgeColor: "warning" },
    { title: "ตั้งค่าระบบ", icon: Cog6ToothIcon, path: "/admin/config" },
    { title: "สิทธิ์การใช้งาน", icon: BanknotesIcon, path: "/admin/plans" },
    { title: "เนื้อหาโปรไฟล์", icon: DocumentTextIcon, path: "/admin/content/profile-pages" },
];

export const AdminSidebar = () => {
    const router = useRouter();
    const { user, signOut } = useAuthStore();
    const [stats, setStats] = useState({ users: 0, pendingOrders: 0 });

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
            console.error("Error watching orders:", error);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeOrders();
        };
    }, []);

    return (
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col bg-sidebar border-r border-sidebar-border hidden lg:flex">
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5 bg-sidebar">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
                    <PlayCircleIcon className="h-5 w-5 text-sidebar-primary-foreground" />
                </div>
                <div className="flex flex-col">
                    <h1 className="text-base font-semibold text-sidebar-foreground">YouOke</h1>
                    <p className="text-xs text-sidebar-primary">Admin</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 bg-sidebar">
                <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-sidebar-muted">
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
                                        "flex items-center gap-3 px-4 py-2.5 rounded-md text-sidebar-foreground transition-colors duration-150 whitespace-nowrap",
                                        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                    )}
                                >
                                    <item.icon className="h-5 w-5 flex-shrink-0" />
                                    <span className="flex-1 truncate">{item.title}</span>
                                    {badgeContent && (
                                        <span className={cn(
                                            "rounded px-1.5 py-0.5 text-xs font-medium",
                                            (item as any).badgeColor === "warning"
                                                ? "bg-warning text-warning-foreground"
                                                : "bg-sidebar-accent text-sidebar-accent-foreground"
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

            {/* User */}
            <div className="mt-auto border-t border-sidebar-border p-3 bg-sidebar">
                <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium shrink-0">
                        {user?.displayName?.charAt(0) || 'A'}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
                            {user?.displayName || 'Admin'}
                        </p>
                        <p className="truncate text-xs text-sidebar-muted">
                            {user?.email || 'admin@youoke.com'}
                        </p>
                    </div>
                    <button
                        onClick={async () => {
                            try {
                                await signOut();
                                router.push('/login');
                            } catch (e) {
                                console.error("Logout failed", e);
                            }
                        }}
                        className="shrink-0 rounded p-1.5 text-sidebar-muted hover:bg-sidebar-border hover:text-sidebar-accent-foreground cursor-pointer"
                        title="Logout"
                    >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    </button>
                </div>

            </div>
        </aside>
    );
};
