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
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-xl px-6 shadow-sm">
            {/* Left side - Search */}
            <div className="flex items-center gap-4">
                <button
                    className="lg:hidden p-2 text-gray-500 hover:text-gray-900 rounded-md"
                    onClick={onMenuClick}
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>

                <div className="relative w-64 lg:w-80 hidden md:block">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        placeholder="ค้นหา..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle text-gray-500 hover:text-gray-900">
                        <div className="indicator">
                            <BellIcon className="h-6 w-6" />
                            <span className="badge badge-xs badge-error indicator-item">3</span>
                        </div>
                    </label>
                    <div tabIndex={0} className="dropdown-content z-[1] card card-compact w-80 p-0 shadow-xl bg-white border border-gray-100 mt-2 rounded-xl">
                        <div className="card-body p-0">
                            <div className="px-4 py-3 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900">การแจ้งเตือน</h3>
                                <p className="text-xs text-gray-500">คุณมี 3 การแจ้งเตือนใหม่</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {/* Mock Notifications */}
                                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">คำสั่งซื้อใหม่</p>
                                            <p className="text-xs text-gray-500 mt-0.5">ผู้ใช้สั่งซื้อแพ็กเกจ VIP - 2 นาทีที่แล้ว</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className="h-2 w-2 mt-2 rounded-full bg-green-500 shrink-0" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">ผู้ใช้ใหม่ลงทะเบียน</p>
                                            <p className="text-xs text-gray-500 mt-0.5">John Doe เข้าร่วม YouOke - 15 นาทีที่แล้ว</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 border-t border-gray-100">
                                <button className="btn btn-ghost btn-sm w-full text-blue-600 normal-case">
                                    ดูทั้งหมด
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Menu Dropdown (DaisyUI) */}
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 px-2 hover:bg-gray-100 border-none normal-case h-auto py-1.5 flex items-center">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center">
                                <span className="text-sm font-bold">{user?.email?.charAt(0).toUpperCase() || 'A'}</span>
                            </div>
                        </div>
                        <div className="hidden md:flex flex-col items-start gap-0.5 text-left ml-1">
                            <span className="text-sm font-medium text-gray-900 leading-none">{user?.displayName || 'Admin'}</span>
                            <span className="text-[10px] text-gray-500 leading-none">Admin</span>
                        </div>
                        <ChevronDownIcon className="h-4 w-4 text-gray-400 ml-1 hidden md:block" />
                    </label>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-xl bg-white rounded-xl w-56 border border-gray-100 mt-2">
                        <li className="menu-title px-4 py-2 border-b border-gray-100 mb-2">
                            <span className="text-gray-900 font-semibold block p-0">บัญชีผู้ใช้</span>
                            <span className="text-xs text-gray-500 font-normal block lowercase p-0 mt-0.5 truncate">{user?.email}</span>
                        </li>
                        <li>
                            <Link href="/admin/settings" className="text-gray-700 hover:bg-gray-100 active:bg-gray-200">
                                <Cog6ToothIcon className="h-4 w-4" /> ตั้งค่า
                            </Link>
                        </li>
                        <div className="divider my-1 border-gray-100 h-px p-0"></div>
                        <li>
                            <button onClick={handleLogout} className="text-red-600 hover:bg-red-50 active:bg-red-100">
                                <ArrowRightOnRectangleIcon className="h-4 w-4" /> ออกจากระบบ
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
};
