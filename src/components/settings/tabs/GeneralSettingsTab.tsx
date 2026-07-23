import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

export default function GeneralSettingsTab() {
    const { isDarkMode, toggleDarkMode } = useUIStore();

    return (
        <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/50">
                <div className="p-4 sm:p-5 flex items-center justify-between transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            <ComputerDesktopIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">โหมดหน้าจอ (Theme)</h4>
                            <p className="text-xs font-medium text-zinc-500 mt-0.5">เลือกรูปแบบการแสดงผล</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 rounded-xl p-1 shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-inner">
                        <button 
                            onClick={() => { if(isDarkMode) toggleDarkMode(); }}
                            className={cn(
                                "flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                !isDarkMode 
                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" 
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <SunIcon className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} /> สว่าง
                        </button>
                        <button 
                            onClick={() => { if(!isDarkMode) toggleDarkMode(); }}
                            className={cn(
                                "flex items-center justify-center px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                isDarkMode 
                                    ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200/50 dark:border-zinc-700/50" 
                                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            )}
                        >
                            <MoonIcon className="w-3.5 h-3.5 mr-1.5" strokeWidth={2.5} /> มืด
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
