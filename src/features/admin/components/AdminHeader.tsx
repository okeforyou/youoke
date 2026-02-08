import {
    BellIcon,
    MagnifyingGlassIcon,
    Cog6ToothIcon,
    ChevronDownIcon,
    Bars3Icon,
    ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";
import { cn } from "../../../utils/cn";
import { useAuth } from "../../../../context/AuthContext";
import { useRouter } from "next/router";
import Link from "next/link";
import React from "react";

interface AdminHeaderProps {
    onMenuClick?: () => void;
}

export const AdminHeader = ({ onMenuClick }: AdminHeaderProps) => {
    const { user, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6 shadow-sm transition-all duration-300">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden p-2 text-muted-foreground hover:text-foreground rounded-md transition-colors"
                    onClick={onMenuClick}
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>

                <div className="relative w-64 lg:w-96 hidden md:block group">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="search"
                        placeholder="ค้นหา (Command + K)..."
                        className="w-full pl-10 pr-4 py-2 bg-secondary/50 border border-transparent rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-background transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 pointer-events-none">
                        <kbd className="kbd kbd-sm h-5 min-h-0 bg-background border border-border text-[10px] text-muted-foreground font-mono">⌘</kbd>
                        <kbd className="kbd kbd-sm h-5 min-h-0 bg-background border border-border text-[10px] text-muted-foreground font-mono">K</kbd>
                    </div>
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                        <div className="indicator">
                            <BellIcon className="h-6 w-6" />
                            <span className="badge badge-xs badge-primary indicator-item border-background"></span>
                        </div>
                    </label>
                    <div tabIndex={0} className="dropdown-content z-[1] card card-compact w-80 p-0 shadow-xl bg-popover border border-border mt-2 rounded-xl animate-in zoom-in-95 duration-200">
                        <div className="card-body p-0">
                            <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                                <h3 className="font-semibold text-foreground">การแจ้งเตือน</h3>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Coming Soon</span>
                            </div>
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>ยังไม่มีการแจ้งเตือนใหม่</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Menu Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 px-1 hover:bg-secondary/80 border-none normal-case h-auto py-1 flex items-center rounded-full pr-3 transition-colors">
                        <div className="avatar placeholder ring-2 ring-background ring-offset-2 ring-offset-secondary/20 rounded-full">
                            <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg shadow-primary/20">
                                <span className="text-sm font-bold text-white">{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-start gap-0.5 text-left ml-1.5">
                            <span className="text-sm font-semibold text-foreground leading-none">{user?.displayName || 'Admin'}</span>
                            <span className="text-[10px] text-muted-foreground leading-none font-medium">Administrator</span>
                        </div>
                        <ChevronDownIcon className="h-3 w-3 text-muted-foreground ml-1 hidden md:block" />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-popover rounded-xl w-60 border border-border mt-2 animate-in zoom-in-95 duration-200">
                        <li className="menu-title px-3 py-2 border-b border-border/50 mb-1">
                            <span className="text-foreground font-semibold block p-0 text-sm">บัญชีผู้ใช้</span>
                            <span className="text-xs text-muted-foreground font-normal block lowercase p-0 mt-0.5 truncate">{user?.email}</span>
                        </li>
                        <li className="mt-1">
                            <Link href="/admin/config" className="text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg py-2 font-medium">
                                <Cog6ToothIcon className="h-4 w-4" /> ตั้งค่าระบบ
                            </Link>
                        </li>
                        <div className="divider my-1 border-border/50 h-px p-0"></div>
                        <li>
                            <button onClick={handleLogout} className="text-destructive hover:bg-destructive/10 hover:text-destructive active:bg-destructive/20 rounded-lg py-2 font-medium">
                                <ArrowRightOnRectangleIcon className="h-4 w-4" /> ออกจากระบบ
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};
