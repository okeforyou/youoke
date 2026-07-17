import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function GeneralSettingsTab() {
    const { isDarkMode, toggleDarkMode } = useUIStore();

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">ทั่วไป</h2>
                <p className="text-sm font-bold text-zinc-500 mt-2">จัดการการตั้งค่าพื้นฐานของระบบ</p>
            </div>

            <div className="space-y-4">
                <h3 className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">ลักษณะที่ปรากฏ</h3>
                
                <div className="space-y-3">
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">ธีมหลัก</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={() => { if(isDarkMode) toggleDarkMode(); }}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all active:scale-95",
                                !isDarkMode 
                                    ? "bg-zinc-50 dark:bg-zinc-800 border-primary text-primary" 
                                    : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
                            )}
                        >
                            <SunIcon className="w-8 h-8 mb-3" />
                            <span className="font-bold">แสงสว่าง</span>
                        </button>

                        <button 
                            onClick={() => { if(!isDarkMode) toggleDarkMode(); }}
                            className={cn(
                                "flex flex-col items-center justify-center p-6 rounded-[24px] border-2 transition-all active:scale-95",
                                isDarkMode 
                                    ? "bg-zinc-800 border-primary text-primary" 
                                    : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300"
                            )}
                        >
                            <MoonIcon className="w-8 h-8 mb-3" />
                            <span className="font-bold">มืด</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
