import React, { Fragment } from 'react';
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
    PlayCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    const { user, logOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await logOut();
            onClose();
            router.push('/login');
        } catch (error) {
            console.error(error);
        }
    };

    const menuItems = [
        {
            icon: UserCircleIcon,
            label: 'แก้ไขข้อมูลส่วนตัว',
            href: '/profile/edit', // Assuming edit page
        },
        {
            icon: BookOpenIcon,
            label: 'วิธีการใช้งาน',
            href: '/tutorial', // Assuming tutorial page
        },
        {
            icon: SparklesIcon,
            label: 'โปรโมชั่นพิเศษ',
            href: '/promotions', // Assuming promotions page
        },
        {
            icon: CreditCardIcon,
            label: 'แพ็กเกจของฉัน',
            href: '/subscription', // Assuming subscription page
        },
    ];

    if (!user) return null;

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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

                                        {/* Profile Info */}
                                        <div className="px-6 py-8 flex flex-col items-center text-center">
                                            <div className="avatar mb-4 relative">
                                                <div className="w-24 h-24 rounded-full ring-4 ring-primary/20 p-1 bg-white">
                                                    {user.photoURL ? (
                                                        <img
                                                            src={user.photoURL}
                                                            alt={user.displayName || "User"}
                                                            className="rounded-full object-cover w-full h-full"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-primary flex items-center justify-center text-white text-4xl font-bold">
                                                            {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Edit Badge (Optional, not in screenshot but common) */}
                                                {/* <button className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-gray-100 hover:bg-gray-50">
                                                    <PencilIcon className="w-4 h-4 text-gray-600" />
                                                </button> */}
                                            </div>

                                            <h2 className="text-lg font-bold text-gray-900">
                                                {user.displayName || "YouOke User"}
                                                {/* Mock Admin Badge if role exists */}
                                                {user.role === 'admin' && <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Admin</span>}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">{user.email}</p>

                                            {/* Music Service Badges */}
                                            <div className="flex gap-3 mt-6">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                                                    <MusicalNoteIcon className="w-3.5 h-3.5 text-green-600" />
                                                    Spotify
                                                </div>
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-xs font-bold border border-red-100">
                                                    <PlayCircleIcon className="w-3.5 h-3.5 text-red-600" />
                                                    YouTube
                                                </div>
                                            </div>
                                        </div>

                                        {/* Menu List */}
                                        <div className="flex-1 px-4 pb-6">
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">บัญชีผู้ใช้</p>
                                            <ul className="space-y-1">
                                                {menuItems.map((item, index) => (
                                                    <li key={index}>
                                                        <Link href={item.href} onClick={onClose} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group">
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

                                            <div className="my-6 border-b border-gray-100" />

                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">ช่วยเหลือ</p>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left group"
                                            >
                                                <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover:bg-red-100 transition-colors">
                                                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm font-medium text-red-600 group-hover:text-red-700">ออกจากระบบ</span>
                                            </button>
                                        </div>

                                        {/* Pro Banner (Bottom Sticky) */}
                                        <div className="p-4 bg-gray-50 mt-auto border-t border-gray-100">
                                            <div className="relative overflow-hidden rounded-2xl bg-gray-900 p-5 text-white shadow-lg">
                                                {/* Background decoration */}
                                                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
                                                <div className="absolute bottom-0 left-0 -ml-8 -mb-8 h-32 w-32 rounded-full bg-primary/20 blur-xl" />

                                                <div className="relative z-10">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">PRO</span>
                                                        <p className="text-xs font-medium text-gray-300 tracking-widest uppercase">Membership</p>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-white mb-3">YOUOKE PRO</h3>

                                                    <div className="flex items-end justify-between">
                                                        <div>
                                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Valid Until</p>
                                                            <p className="text-sm font-bold text-white">LIFETIME</p>
                                                        </div>
                                                        <Link href="/pricing" onClick={onClose} className="bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:bg-gray-100 transition-colors flex items-center gap-1">
                                                            อัพเกรด <ChevronRightIcon className="w-3 h-3" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
