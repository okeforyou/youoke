import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeftIcon, ShoppingBagIcon, Squares2X2Icon, CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { MODULES } from '@/config/modules';
import ModuleCard from '@/modules/marketplace/components/ModuleCard';
import { useAuthStore } from '@/modules/auth/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { useUIStore } from '@/stores/useUIStore';
import { usePlayerStore } from '@/modules/player/stores/usePlayerStore';
import MainLayout from '@/layouts/MainLayout';

export default function AppsCenterPage() {
    const { user } = useAuthStore();
    const { addToast } = useToast() || {};
    const { setActiveIndex } = usePlayerStore();
    const [activeTab, setActiveTab] = useState<'browse' | 'library'>('browse');
    const [filter, setFilter] = useState<'all' | 'music' | 'utility' | 'social'>('all');

    // Filter visible modules for Store
    const storeModules = MODULES.filter(m => !m.isHidden).filter(m => {
        if (filter === 'all') return true;
        return m.category === filter;
    });

    // Filter installed modules for Library
    const myModules = MODULES.filter(m => {
        // Always include Free/Core modules? Or only explicit installs?
        // useModule logic says Free = Has Access.
        // So Library should show Free + Installed Paid.
        if (m.isHidden) return false;

        const isFree = m.pricing.tier === 'free';
        const isInstalled = user?.installed_modules?.includes(m.id);

        return isFree || isInstalled;
    });

    const handleInstall = async (moduleId: string) => {
        if (!user) {
            addToast?.('Please login to install apps.');
            return;
        }

        const moduleInfo = MODULES.find(m => m.id === moduleId);
        if (!moduleInfo) return;

        if (moduleInfo.pricing.tier === 'free') {
            return; // Already considered "installed" by logic
        }

        try {
            addToast?.('Processing Payment...');
            const res = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleId,
                    userId: user.uid,
                    userEmail: user.email
                })
            });
            const data = await res.json();

            if (data.success && data.redirectUrl) {
                addToast?.('Payment Successful! Refreshing...');
                window.location.href = data.redirectUrl;
            } else {
                addToast?.('Payment Failed: ' + data.message);
            }
        } catch (error) {
            console.error(error);
            addToast?.('Payment Error');
        }
    };

    const handleLaunch = (moduleId: string) => {
        if (moduleId === 'youtube-theme') {
            useUIStore.getState().setMusicTheme('youtube');
            useUIStore.getState().setActiveTab('home'); // Go Home
            window.location.href = '/';
        } else if (moduleId === 'remote-control') {
            // Open Modal? Current implementation is a page /remote, or modal.
            // Let's redirect to /remote for now or open QR.
            // Actually remote-control module usually implies the QR feature.
            window.location.href = '/remote';
        } else if (moduleId === 'party-system') {
            useUIStore.getState().setReceiverModalOpen(true);
        }
    };

    return (
        <MainLayout>
            <div className="min-h-screen bg-transparent font-sans pb-24 md:pb-10">
                <Head>
                    <title>YouOke Apps Center</title>
                </Head>

                {/* Header */}
                <header className="bg-white/60 backdrop-blur-md border-b border-white/20 sticky top-0 z-40 shadow-sm support-[backdrop-filter]:bg-white/60">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="btn btn-ghost btn-circle btn-sm hover:bg-white/50">
                                <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                            </Link>
                            <h1 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                <Squares2X2Icon className="w-6 h-6 text-primary" />
                                Apps <span className="text-primary">Center</span>
                            </h1>
                        </div>
                        {/* Tabs Switcher for Mobile/Desktop */}
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('browse')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'browse' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                ร้านค้า
                            </button>
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'library' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                แอพของฉัน
                            </button>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                    {/* --- BROWSE TAB --- */}
                    {activeTab === 'browse' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Filter Categories */}
                            <div className="mb-6 overflow-x-auto pb-2">
                                <div className="flex gap-2">
                                    {['all', 'music', 'utility', 'social'].map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => setFilter(cat as any)}
                                            className={`px-4 py-2 rounded-full border text-sm font-bold whitespace-nowrap transition-colors ${filter === cat
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            {cat === 'all' ? 'ทั้งหมด' : cat === 'music' ? 'ดนตรี' : cat === 'utility' ? 'เครื่องมือ' : 'โซเชียล'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {storeModules.map(module => (
                                    <ModuleCard
                                        key={module.id}
                                        module={module}
                                        onInstall={handleInstall}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- LIBRARY TAB --- */}
                    {activeTab === 'library' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                ติดตั้งแล้ว ({myModules.length})
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {myModules.map(module => (
                                    <div key={module.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="p-3 bg-primary/5 rounded-lg text-primary">
                                            {module.icon && <module.icon className="w-8 h-8" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate">{module.name}</h3>
                                            <p className="text-xs text-gray-500 truncate">{module.description}</p>
                                        </div>
                                        <button
                                            onClick={() => handleLaunch(module.id)}
                                            className="btn btn-sm btn-ghost text-primary hover:bg-primary/10"
                                        >
                                            เปิด <ArrowRightIcon className="w-4 h-4 ml-1" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {myModules.length === 0 && (
                                <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                    <p className="text-gray-400 mb-4">ยังไม่มีแอพที่ติดตั้ง</p>
                                    <button onClick={() => setActiveTab('browse')} className="btn btn-primary btn-sm">
                                        ไปที่ร้านค้า
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                </main>
            </div>
        </MainLayout>
    );
}
