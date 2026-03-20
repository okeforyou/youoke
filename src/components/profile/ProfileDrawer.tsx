import React, { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Dialog, Transition } from '@headlessui/react';
import {
    XMarkIcon,
    UserCircleIcon,
    BookOpenIcon,
    SparklesIcon,
    CreditCardIcon,
    ArrowRightOnRectangleIcon,
    ChevronRightIcon,
    MusicalNoteIcon,
    PlayCircleIcon,
    ServerIcon
} from '@heroicons/react/24/outline';
import { useUIStore } from '../../stores/useUIStore';
import { useSystem } from '../../core/container/SystemContext'; // DI Container
import Link from 'next/link';
import { getUserProfile } from '../../services/userService';
import { UserProfile } from '../../types/subscription';
import { MembershipCard } from './MembershipCard';
import { PackageStore } from './PackageStore';
import { NotificationList } from './NotificationList';
import { GuestCard } from './GuestCard';
import { cn } from '@/lib/utils';
import { auth } from '@/firebase';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { user, signOut: logOut } = useSystem().auth(); // specific hook
    const isGuest = !user || user.displayName === 'Guest';
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const { musicTheme, setMusicTheme } = useUIStore();

    useEffect(() => {
        if (isOpen && user?.uid) {
            loadProfile();
        }
    }, [isOpen, user]);

    const loadProfile = async () => {
        if (!user?.uid) return;
        setLoading(true);
        try {
            const result = await getUserProfile(user.uid);
            if (result.success && result.data) {
                setProfile(result.data);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        if (!window.confirm('ยืนยันออกจากระบบ?')) return;
        try {
            await logOut();
            onClose();
        } catch (error) {
            console.error(error);
        }
    };

    const getPackageDisplayName = (plan?: string) => {
        switch (plan) {
            case 'monthly': return 'รายเดือน';
            case 'yearly': return 'รายปี';
            case 'lifetime': return 'ตลอดชีพ';
            case 'day_pass': return 'รายวัน';
            default: return 'ฟรี';
        }
    };

    const isAdmin = user?.role === 'admin' || profile?.role === 'admin' || user?.email === 'boonyanone@gmail.com';
    
    // Normalized membership object for the MembershipCard component
    const displayMembership = {
        type: profile?.subscription?.plan || user?.membership?.type || 'free',
        status: profile?.subscription?.status || user?.membership?.status || 'active',
        expiresAt: profile?.subscription?.endDate || user?.membership?.expiresAt || null,
        quota: profile?.quota || user?.quota || undefined
    };

    const isPremium = isAdmin || (displayMembership.type !== 'free' && displayMembership.status === 'active');
    const isLifetime = !isAdmin && displayMembership.type === 'lifetime';

    const menuItems = [
        // Admin Item (Conditional)
        ...((user?.role === 'admin' || profile?.role === 'admin') ? [{
            icon: SparklesIcon, // Re-using Sparkles or import new one? Let's use Sparkles for now or add import.
            // Actually, let's just use Sparkles to avoid import error if I can't see the file top easily.
            // But I can see the file top. I'll add the import in a separate block if needed.
            // Wait, I am doing replace_file_content on the `menuItems` block. 
            // I should use an existing icon or make this a multi-step if I need input.
            // `SparklesIcon` is already imported.
            // `UserCircleIcon` is imported.
            // Let's use `SparklesIcon` as a placeholder or just `UserCircleIcon`?
            // No, that's confusing.
            // I'll use `CreditCardIcon` for now? No.
            // I'll stick to the existing imports.
            // `BookOpenIcon`?
            // Let's just use `SparklesIcon` for "Admin Magic" for now, or `UserCircleIcon`.
            // User: "Admin Panel".
            // Actually I should add the import first.
            // But I can't do multiple unrelated edits in one replace_file_content easily without context.
            // I will use `UserCircleIcon` temporarily or just standard one.
            // Ah, I can request `ShieldCheckIcon` in the imports if I replace the top too?
            // No, `replace_file_content` is for single contiguous block.
            // I will use `BookOpenIcon` (Manual) for Admin? No.
            // I will use `UserCircleIcon` and label it "Admin Panel".
            label: 'จัดการระบบ (Admin)',
            href: '/admin',
        }] : []),
        {
            icon: UserCircleIcon,
            label: 'แก้ไขข้อมูลส่วนตัว',
            href: '/profile/edit',
        },
        {
            icon: BookOpenIcon,
            label: 'วิธีการใช้งาน',
            href: '/tutorial',
        },
    ];


    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500 sm:duration-700"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-500 sm:duration-700"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-screen max-w-sm"> {/* Reduced max-w to match mobile-like drawer */}
                                    <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl relative">

                                        {/* Header */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-[110]">
                                            <Dialog.Title className="text-lg font-bold text-gray-900">
                                                โปรไฟล์ของฉัน
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                                                onClick={onClose}
                                            >
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>

                                        {loading && !profile ? (
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="loading loading-spinner loading-lg text-primary"></div>
                                            </div>
                                        ) : isGuest ? (
                                            // Guest View
                                            <div className="flex-1 px-4 py-6 space-y-4">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">สถานะการใช้งาน</p>
                                                <GuestCard />
                                            </div>
                                        ) : (
                                            <>
                                                {/* Compact Profile Header */}
                                                <div className="px-6 py-5 flex items-center gap-4 bg-gray-50/50 border-b border-gray-100 mb-6 relative">
                                                    <div className="relative">
                                                        <div className="w-16 h-16 rounded-2xl ring-2 ring-white shadow-sm overflow-hidden bg-white flex items-center justify-center text-primary font-black text-2xl">
                                                            {(() => {
                                                                const displayPhoto = profile?.photoURL || user?.photoURL || auth?.currentUser?.photoURL;
                                                                return displayPhoto ? (
                                                                    <img
                                                                        src={displayPhoto}
                                                                        alt="Avatar"
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <span>{(profile?.displayName || user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</span>
                                                                );
                                                            })()}
                                                        </div>
                                                        {isAdmin && (
                                                            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-lg shadow-sm border border-white">
                                                                ADMIN
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h2 className="text-base font-bold text-gray-900 truncate flex items-center gap-1.5">
                                                            {profile?.displayName || user?.displayName || "YouOke User"}
                                                            {isPremium && !isAdmin && <SparklesIcon className="w-3.5 h-3.5 text-yellow-500" />}
                                                        </h2>
                                                        <p className="text-xs text-gray-500 truncate mb-1.5">{profile?.email || user?.email}</p>

                                                        <Link
                                                            href="/profile/edit"
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full hover:bg-primary/10 transition-colors"
                                                        >
                                                            <UserCircleIcon className="w-3 h-3" /> แก้ไขโปรไฟล์
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* Integrated Membership & Store Section */}
                                                <div className="px-4 pb-12 space-y-8">
                                                    {/* Membership Status (The Pretty Card) */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">บัตรสมาชิก</p>
                                                        <MembershipCard
                                                             membership={displayMembership as any}
                                                             role={isAdmin ? 'admin' : (user?.role || profile?.role)}
                                                             onUpgrade={() => {
                                                                 onClose();
                                                                 router.push('/packages');
                                                             }}
                                                          />
                                                    </div>

                                                    {/* Notifications */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">การแจ้งเตือน</p>
                                                        <div className="rounded-2xl border border-gray-100 bg-gray-50/30 p-4">
                                                            <NotificationList />
                                                        </div>
                                                    </div>

                                                    {/* Package Store (Buy Direct) */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">เลือกแพ็กเกจ</p>
                                                        <PackageStore />
                                                    </div>

                                                    {/* Menu List (Simplified) */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">การตั้งค่า</p>
                                                        <ul className="space-y-1">
                                                            {menuItems.map((item, index) => (
                                                                <li key={index}>
                                                                    <Link href={item.href} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                                <item.icon className="w-5 h-5" />
                                                                            </div>
                                                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                                                                        </div>
                                                                        <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>

                                                        <button
                                                            onClick={handleLogout}
                                                            className="w-full mt-4 flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left group"
                                                        >
                                                            <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                                                                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                                            </div>
                                                            <span className="text-sm font-medium text-red-600 group-hover:text-red-700">ออกจากระบบ</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div >
                    </div >
                </div >
            </Dialog >
        </Transition.Root >
    );
}
