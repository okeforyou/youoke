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
    ServerIcon,
    ChatBubbleLeftRightIcon
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

    const { showConfirm } = useUIStore();

    const handleLogout = () => {
        showConfirm({
            title: 'ออกจากระบบ',
            message: 'คุณต้องการออกจากระบบใช่หรือไม่? คุณจะยังสามารถฟังเพลงฟรีได้ตามโควต้าที่มี',
            confirmText: 'ออกจากระบบ',
            cancelText: 'ยกเลิก',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await logOut();
                    onClose();
                } catch (error) {
                    console.error(error);
                }
            }
        });
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
                                        ) : !user ? (
                                            // 🛡️ STRICT AUTH REDIRECT (No Guest Invite Drawer)
                                            <div className="flex-1 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
                                                <div className="loading loading-spinner loading-lg text-primary opacity-20"></div>
                                                <script dangerouslySetInnerHTML={{ __html: `window.location.href = '/login';` }} />
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

                                                            {/* 🔍 VIP LINE@ IDENTITY BRIDGE SECTION (v4.2.8) */}
                                                            <div className="mt-3 bg-gray-50 border border-gray-100 rounded-3xl p-4 flex flex-col gap-3 shadow-sm transition-all hover:border-[#00B900]/30 group">
                                                                <div className="flex items-center justify-between px-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="bg-[#00B900] p-1.5 rounded-lg shadow-lg shadow-green-500/10">
                                                                            <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <p className="text-[11px] font-black text-gray-900 uppercase">LINE Connection</p>
                                                                    </div>
                                                                    {profile?.lineUserId || (profile as any)?.lineUserId ? (
                                                                        <span className="flex items-center gap-1 text-[9px] font-black text-[#00B900] bg-[#00B900]/10 px-2 py-0.5 rounded-full border border-[#00B900]/20 uppercase tracking-tighter animate-pulse">
                                                                            Linked
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Not Linked</span>
                                                                    )}
                                                                </div>

                                                                {(profile as any)?.lineUserId ? (
                                                                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-100">
                                                                        <div className="w-8 h-8 rounded-full bg-[#00B900]/10 flex items-center justify-center text-[#00B900] font-bold text-xs">
                                                                             {(profile as any).lineDisplayName?.charAt(0) || 'L'}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs font-bold text-gray-800 truncate">{(profile as any).lineDisplayName || 'LINE Linked Account'}</p>
                                                                            <p className="text-[9px] text-gray-400 font-medium">เชื่อมต่อกับ Gmail สำเร็จแล้ว</p>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="space-y-2">
                                                                        <p className="text-[10px] font-medium text-gray-500 px-1 leading-relaxed">
                                                                            * เชื่อมต่อ LINE เพื่อรับแจ้งเตือนสถานะสมาชิกและยอดโอนเงินแบบ Real-time
                                                                        </p>
                                                                        <Link 
                                                                            href="/profile/line-connect" // Or your LIFF bridge URL
                                                                            className="w-full bg-[#00B900] hover:bg-[#009e00] text-white py-2.5 rounded-xl font-black text-center text-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                                                                        >
                                                                            <span>🟢 เชื่อมต่อ LINE (Sync ข้อมูล)</span>
                                                                            <ChevronRightIcon className="w-3.5 h-3.5" />
                                                                        </Link>
                                                                    </div>
                                                                )}
                                                                
                                                                <a 
                                                                    href="https://line.me/R/ti/p/@243lercy" 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="w-full bg-white border border-gray-100 text-gray-400 py-2 rounded-xl font-bold text-center text-[10px] hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
                                                                >
                                                                    <span>แจ้งปัญหา / คุยกับแอดมิน</span>
                                                                </a>
                                                            </div>

                                                     </div>

                                                     {/* System News Feed */}
                                                     <div>
                                                         <div className="flex items-center justify-between px-2 mb-3">
                                                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ข่าวสารและประกาศ</p>
                                                             <Link href="/profile/notifications" onClick={onClose} className="text-[10px] font-bold text-primary hover:underline uppercase tracking-tight">อ่านทั้งหมด</Link>
                                                         </div>
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
