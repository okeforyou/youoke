import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
    XMarkIcon, 
    Cog6ToothIcon, 
    UserIcon, 
    SparklesIcon
} from '@heroicons/react/24/outline';
import { useSystem } from '@/core/container/SystemContext';
import GeneralSettingsTab from './tabs/GeneralSettingsTab';
import ProfileTab from './tabs/ProfileTab';
import AIVocalSettingsTab from './tabs/AIVocalSettingsTab';

interface GlobalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export type SettingsTabId = 'general' | 'profile' | 'line' | 'aivocal';

export default function GlobalSettingsModal({ isOpen, onClose }: GlobalSettingsModalProps) {
    const { user } = useSystem().auth();
    const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralSettingsTab />;
            case 'profile': return <ProfileTab onClose={onClose} />;
            case 'aivocal': return <AIVocalSettingsTab />;
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
                    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative flex w-full max-w-5xl h-[85vh] max-h-[800px] transform flex-col sm:flex-row overflow-hidden rounded-[32px] bg-white dark:bg-zinc-950 text-left shadow-2xl transition-all border border-zinc-200 dark:border-zinc-800">
                                
                                {/* Sidebar Navigation */}
                                <div className="w-full sm:w-[280px] bg-zinc-50/50 dark:bg-zinc-900/50 border-r border-zinc-100 dark:border-zinc-800 flex flex-col">
                                    {/* User Info Header */}
                                    <div className="p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-zinc-200 dark:bg-zinc-800 overflow-hidden flex items-center justify-center shrink-0">
                                                {user?.photoURL ? (
                                                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-zinc-500 font-bold text-lg">{user?.displayName?.charAt(0) || 'U'}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-zinc-900 dark:text-white truncate">
                                                    {user?.displayName || 'ผู้ใช้งาน'}
                                                </h3>
                                                <p className="text-[10px] font-bold text-zinc-500 truncate">{user?.role === 'admin' ? 'ADMINISTRATOR' : 'MEMBER'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Menu Items */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
                                        
                                        {/* Group: Account */}
                                        <div className="space-y-1">
                                            <p className="px-3 pb-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">บัญชี</p>
                                            <button 
                                                onClick={() => setActiveTab('general')}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                            >
                                                <Cog6ToothIcon className="w-5 h-5" /> ทั่วไป
                                            </button>
                                            <button 
                                                onClick={() => setActiveTab('profile')}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                            >
                                                <UserIcon className="w-5 h-5" /> โปรไฟล์บัญชี
                                            </button>
                                        </div>

                                        {/* Group: AI Vocal */}
                                        <div className="space-y-1">
                                            <p className="px-3 pb-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">AI Vocal</p>
                                            <button 
                                                onClick={() => setActiveTab('aivocal')}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'aivocal' ? 'bg-white dark:bg-zinc-800 text-primary shadow-sm border border-zinc-200/50 dark:border-zinc-700' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                                            >
                                                <SparklesIcon className="w-5 h-5" /> ที่เก็บไฟล์เพลง
                                            </button>
                                        </div>

                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 relative overflow-hidden">
                                    <div className="absolute top-4 right-4 z-10">
                                        <button
                                            type="button"
                                            className="rounded-full p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                                            onClick={onClose}
                                        >
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-8 sm:p-12 no-scrollbar">
                                        {renderContent()}
                                    </div>
                                </div>

                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
