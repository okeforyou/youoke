import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function GeneralSettingsTab() {
    const { isDarkMode, toggleDarkMode } = useUIStore();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">ทั่วไป (General)</h2>
                <p className="text-sm font-bold text-zinc-500 mt-2">จัดการการตั้งค่าพื้นฐานของระบบ</p>
            </div>

            <div className="space-y-6">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">การแสดงผล</h3>
                
                <div className="p-6 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800/50 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-zinc-900 dark:text-white">โหมดหน้าจอ (Theme)</h4>
                            <p className="text-xs font-bold text-zinc-500 mt-1">เลือกธีมที่สบายตาสำหรับคุณ</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => { if(isDarkMode) toggleDarkMode(); }}
                            className={clsx(
                                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all active:scale-95 shadow-sm",
                                isDarkMode 
                                    ? "bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
                                    : "bg-white border-primary text-primary shadow-md shadow-primary/20"
                            )}
                        >
                            <SunIcon className="w-8 h-8 mb-2" strokeWidth={2.5} />
                            <span className="text-sm font-black">สว่าง</span>
                        </button>

                        <button 
                            onClick={() => { if(!isDarkMode) toggleDarkMode(); }}
                            className={clsx(
                                "flex flex-col items-center justify-center p-6 rounded-2xl border transition-all active:scale-95 shadow-sm",
                                !isDarkMode 
                                    ? "bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
                                    : "bg-zinc-950 border-primary text-primary shadow-md shadow-primary/20"
                            )}
                        >
                            <MoonIcon className="w-8 h-8 mb-2" strokeWidth={2.5} />
                            <span className="text-sm font-black">มืด</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
