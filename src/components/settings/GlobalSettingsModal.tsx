import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    XMarkIcon, 
    UserIcon, 
    SparklesIcon,
    ChevronLeftIcon,
    CheckCircleIcon,
    CloudArrowUpIcon,
    BookOpenIcon
} from '@heroicons/react/24/outline';
import { useSystem } from '@/core/container/SystemContext';
import ProfileTab from './tabs/ProfileTab';
import CloudSyncTab from './tabs/CloudSyncTab';
import PackagesTab from './tabs/PackagesTab';
import AnnouncementsTab from './tabs/AnnouncementsTab';
import GuideTab from './tabs/GuideTab';

interface GlobalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export type SettingsTabId = 'profile' | 'packages' | 'announcements' | 'cloudsync' | 'guide';

export default function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
    const { user } = useSystem().auth();
    const [activeTab, setActiveTab] = useState<SettingsTabId>('profile');
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

    const sidebarItems = [
        { id: 'profile', label: 'บัญชีและการแสดงผล', icon: UserIcon, group: 'บัญชีผู้ใช้' },
        { id: 'packages', label: 'แพ็กเกจ VIP', icon: SparklesIcon, group: 'ระบบสมาชิก' },
        { id: 'cloudsync', label: 'การสำรองข้อมูล', icon: CloudArrowUpIcon, group: 'ข้อมูล' },
        { id: 'announcements', label: 'ประกาศข่าว', icon: CheckCircleIcon, group: 'ข่าวสาร' },
        { id: 'guide', label: 'คู่มือการใช้งาน YouOke', icon: BookOpenIcon, group: 'ช่วยเหลือ' },
    ];

    const groupedItems = sidebarItems.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof sidebarItems>);

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileTab onClose={onClose} onSwitchTab={setActiveTab} />;
            case 'packages': return <PackagesTab />;
            case 'announcements': return <AnnouncementsTab />;
            case 'cloudsync': return <CloudSyncTab />;
            case 'guide': return <GuideTab />;
            default: return null;
        }
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-0 md:p-6 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative flex w-full md:max-w-[1100px] h-[100vh] md:h-[85vh] md:max-h-[850px] transform flex-col md:flex-row overflow-hidden md:rounded-3xl bg-white dark:bg-zinc-950 text-left transition-all shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                                
                                {/* 🏛️ SIDEBAR */}
                                <aside className={`w-full md:w-[280px] bg-zinc-50 dark:bg-zinc-900/40 flex flex-col shrink-0 border-r border-zinc-100 dark:border-zinc-800/50 ${mobileView === 'detail' ? 'hidden md:flex' : 'flex h-full'}`}>
                                    {/* User Info Header */}
                                    <div className="flex items-center gap-4 p-8 pb-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-zinc-950 shadow-sm">
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-zinc-900 dark:text-zinc-400 font-bold text-lg">{user?.displayName?.charAt(0) || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden min-w-0">
                                            <span className="text-[15px] font-bold text-zinc-900 dark:text-white truncate">{user?.displayName || 'ผู้ใช้งาน'}</span>
                                            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider mt-0.5 truncate">{user?.role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}</span>
                                        </div>
                                        <button onClick={onClose} className="md:hidden ml-auto p-2 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all">
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-6 no-scrollbar mt-4">
                                        {Object.entries(groupedItems).map(([group, items]) => (
                                            <div key={group} className="space-y-2">
                                                <h4 className="px-4 text-[12px] font-bold text-zinc-400 dark:text-zinc-500">{group}</h4>
                                                <div className="space-y-1">
                                                    {items.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => {
                                                                setActiveTab(item.id as SettingsTabId);
                                                                setMobileView('detail');
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm transition-all ${
                                                                activeTab === item.id 
                                                                ? 'bg-white dark:bg-zinc-800 text-primary font-bold shadow-sm ring-1 ring-black/5 dark:ring-white/5' 
                                                                : 'bg-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 font-medium'
                                                            }`}
                                                        >
                                                            <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2px]' : 'stroke-[1.5px]'}`} />
                                                            <span className="flex-1 text-left">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </aside>

                                {/* 🏗️ CONTENT AREA */}
                                <main className={`flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-[#FAFAFA]/10 relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex h-full'}`}>
                                    
                                    {/* Header */}
                                    <header className="px-8 py-8 flex justify-between items-start shrink-0">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setMobileView('list')}
                                                className="md:hidden p-2 -ml-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                                            >
                                                <ChevronLeftIcon className="w-6 h-6" />
                                            </button>
                                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                                {sidebarItems.find(i => i.id === activeTab)?.label}
                                            </h2>
                                        </div>
                                        <button onClick={onClose} className="hidden md:flex p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 rounded-full transition-all">
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </header>

                                    {/* Content Scrollable */}
                                    <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 no-scrollbar">
                                        <div className="max-w-4xl mx-auto">
                                            {renderContent()}
                                        </div>
                                    </div>

                                </main>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
