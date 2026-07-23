import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    XMarkIcon, 
    Cog6ToothIcon, 
    UserIcon, 
    SparklesIcon,
    ChevronLeftIcon,
    CheckCircleIcon,
    CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { useSystem } from '@/core/container/SystemContext';
import GeneralSettingsTab from './tabs/GeneralSettingsTab';
import ProfileTab from './tabs/ProfileTab';
import CloudSyncTab from './tabs/CloudSyncTab';
import PackagesTab from './tabs/PackagesTab';
import AnnouncementsTab from './tabs/AnnouncementsTab';

interface GlobalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export type SettingsTabId = 'general' | 'profile' | 'packages' | 'announcements' | 'cloudsync';

export default function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
    const { user } = useSystem().auth();
    const [activeTab, setActiveTab] = useState<SettingsTabId>('general');
    const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

    const sidebarItems = [
        { id: 'general', label: 'ทั่วไป', icon: Cog6ToothIcon, group: 'บัญชี' },
        { id: 'profile', label: 'โปรไฟล์บัญชี', icon: UserIcon, group: 'บัญชี' },
        { id: 'cloudsync', label: 'การสำรองข้อมูล', icon: CloudArrowUpIcon, group: 'ข้อมูล' },
        { id: 'packages', label: 'แพ็กเกจ VIP', icon: SparklesIcon, group: 'คุณสมบัติ' },
        { id: 'announcements', label: 'ประกาศข่าว', icon: CheckCircleIcon, group: 'ระบบ' },
    ];

    const groupedItems = sidebarItems.reduce((acc, item) => {
        if (!acc[item.group]) acc[item.group] = [];
        acc[item.group].push(item);
        return acc;
    }, {} as Record<string, typeof sidebarItems>);

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettingsTab />;
            case 'profile': return <ProfileTab onClose={onClose} />;
            case 'packages': return <PackagesTab />;
            case 'announcements': return <AnnouncementsTab />;
            case 'cloudsync': return <CloudSyncTab />;
            default: return null;
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        setStatus({ type: null, message: '' });
        // Simulate save
        setTimeout(() => {
            setIsSaving(false);
            setStatus({ type: 'success', message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' });
            setTimeout(() => setStatus({ type: null, message: '' }), 3000);
        }, 800);
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
                    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" />
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
                            <Dialog.Panel className="relative flex w-full md:max-w-[1100px] h-[100vh] md:h-[85vh] md:max-h-[850px] transform flex-col md:flex-row overflow-hidden md:rounded-[32px] bg-white dark:bg-zinc-950 text-left transition-all shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                                
                                {/* 🏛️ SIDEBAR */}
                                <aside className={`w-full md:w-[280px] bg-[#F9FAFB] dark:bg-zinc-900/40 flex flex-col shrink-0 ${mobileView === 'detail' ? 'hidden md:flex' : 'flex h-full'}`}>
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
                                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
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
                                <main className={`flex-1 flex flex-col min-w-0 min-h-0 bg-white dark:bg-zinc-950 relative ${mobileView === 'list' ? 'hidden md:flex' : 'flex h-full'}`}>
                                    
                                    {/* Header */}
                                    <header className="px-8 py-8 flex justify-between items-start shrink-0">
                                        <div className="flex items-center gap-3">
                                            <button 
                                                onClick={() => setMobileView('list')}
                                                className="md:hidden p-2 -ml-3 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all"
                                            >
                                                <ChevronLeftIcon className="w-6 h-6" />
                                            </button>
                                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                                {sidebarItems.find(i => i.id === activeTab)?.label}
                                            </h2>
                                        </div>
                                        <button onClick={onClose} className="hidden md:flex p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 rounded-full transition-all">
                                            <XMarkIcon className="w-6 h-6" />
                                        </button>
                                    </header>

                                    {/* Content Scrollable */}
                                    <div className="flex-1 overflow-y-auto px-8 pb-32 no-scrollbar">
                                        <div className="max-w-4xl">
                                            {renderContent()}
                                        </div>
                                    </div>

                                    {/* Footer (Floating Save/Close) */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent dark:from-zinc-950 dark:via-zinc-950 pt-12 pointer-events-none">
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pointer-events-auto">
                                            <div className="w-full sm:w-auto flex-1 h-10 flex items-center">
                                                {status.message && (
                                                    <div className={`flex items-center justify-center sm:justify-start gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border ${status.type === 'success' ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
                                                        {status.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
                                                        <span>{status.message}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center justify-end gap-3 w-full sm:w-auto shrink-0">
                                                <button 
                                                    onClick={onClose}
                                                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 text-sm font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all text-center"
                                                >
                                                    ปิดหน้าต่าง
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="flex-[2] sm:flex-none px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-md"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                                    </svg>
                                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                                                </button>
                                            </div>
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
