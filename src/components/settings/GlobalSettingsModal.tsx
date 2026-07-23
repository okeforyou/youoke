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
        { id: 'general', label: 'ทั่วไป (General)', icon: Cog6ToothIcon, group: 'บัญชีและการแสดงผล' },
        { id: 'profile', label: 'โปรไฟล์บัญชี (Profile)', icon: UserIcon, group: 'บัญชีและการแสดงผล' },
        { id: 'packages', label: 'แพ็กเกจ VIP (Packages)', icon: SparklesIcon, group: 'ระบบและข้อมูล' },
        { id: 'announcements', label: 'ประกาศข่าว (News)', icon: CheckCircleIcon, group: 'ระบบและข้อมูล' },
        { id: 'cloudsync', label: 'พื้นที่จัดเก็บและคลาวด์', icon: CloudArrowUpIcon, group: 'ระบบและข้อมูล' },
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
                {/* Backdrop - Pure Flat styling */}
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-zinc-900/60 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-0 md:p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative flex w-full md:max-w-5xl h-[100vh] md:h-[85vh] md:max-h-[800px] transform flex-col md:flex-row overflow-hidden md:rounded-3xl bg-zinc-50 dark:bg-zinc-950 text-left transition-all border-0 md:border-2 border-zinc-900 dark:border-zinc-800 shadow-none">
                                
                                {/* 🏛️ SIDEBAR / TABS */}
                                <aside className={`w-full md:w-72 bg-zinc-100 dark:bg-zinc-900 border-b md:border-b-0 md:border-r-2 border-zinc-900 dark:border-zinc-800 flex flex-col shrink-0 ${mobileView === 'detail' ? 'hidden md:flex' : 'flex h-full'}`}>
                                    {/* User Info Header */}
                                    <div className="flex items-center gap-3 p-4 md:p-6 border-b-2 border-zinc-900 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
                                            {user?.photoURL ? (
                                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-zinc-900 dark:text-zinc-400 font-bold text-sm">{user?.displayName?.charAt(0) || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden min-w-0">
                                            <span className="text-[14px] font-black text-zinc-900 dark:text-white truncate">{user?.displayName || 'ผู้ใช้งาน'}</span>
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5 truncate">{user?.role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}</span>
                                        </div>
                                        <button onClick={onClose} className="md:hidden ml-auto p-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded-xl text-zinc-900 dark:text-white border-2 border-zinc-900 dark:border-zinc-700 transition-all">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                                        {Object.entries(groupedItems).map(([group, items]) => (
                                            <div key={group} className="space-y-2">
                                                <h4 className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest">{group}</h4>
                                                <div className="space-y-1">
                                                    {items.map(item => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => {
                                                                setActiveTab(item.id as SettingsTabId);
                                                                setMobileView('detail');
                                                            }}
                                                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all border-2 ${activeTab === item.id ? 'bg-primary border-primary text-white' : 'bg-transparent border-transparent text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'}`}
                                                        >
                                                            <item.icon className="w-5 h-5" />
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
                                    {/* Header Mobile / Title */}
                                    <header className="px-4 md:px-8 py-4 border-b-2 border-zinc-900 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center shrink-0">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => setMobileView('list')}
                                                className="md:hidden p-2 -ml-2 active:bg-zinc-200 dark:active:bg-zinc-800 rounded-xl text-zinc-900 dark:text-white border-2 border-zinc-900 dark:border-zinc-700 transition-all flex items-center bg-white dark:bg-zinc-950"
                                            >
                                                <ChevronLeftIcon className="w-5 h-5" />
                                            </button>
                                            <h2 className="text-[18px] md:text-2xl font-black text-zinc-900 dark:text-white">
                                                {sidebarItems.find(i => i.id === activeTab)?.label}
                                            </h2>
                                        </div>
                                        <button onClick={onClose} className="hidden md:block p-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white transition-all">
                                            <XMarkIcon className="w-5 h-5" />
                                        </button>
                                    </header>

                                    {/* Content Scrollable */}
                                    <div className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-white dark:bg-zinc-950">
                                        <div className="max-w-3xl">
                                            {renderContent()}
                                        </div>
                                    </div>

                                    {/* Footer (Save/Close) */}
                                    <footer className="p-4 md:p-6 border-t-2 border-zinc-900 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                                        <div className="w-full sm:w-auto flex-1 h-10 flex items-center">
                                            {status.message && (
                                                <div className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-2 rounded-xl text-[12px] font-bold text-center sm:text-left border-2 ${status.type === 'success' ? 'text-primary border-primary bg-primary/10' : 'text-red-600 border-red-600 bg-red-50'}`}>
                                                    {status.type === 'success' ? <CheckCircleIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                                                    <span>{status.message}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto shrink-0">
                                            <button 
                                                onClick={onClose}
                                                className="flex-1 sm:flex-none px-6 py-3 rounded-xl border-2 border-zinc-900 dark:border-zinc-700 text-zinc-900 dark:text-white bg-white dark:bg-zinc-950 text-sm font-black hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all text-center"
                                            >
                                                ปิดหน้าต่าง
                                            </button>
                                            <button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="flex-[2] sm:flex-none px-8 py-3 rounded-xl border-2 border-primary bg-primary text-white text-sm font-black hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                                            >
                                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                                            </button>
                                        </div>
                                    </footer>
                                </main>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
