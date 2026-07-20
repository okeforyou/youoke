import React from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useAIVocalStore } from '../stores/useAIVocalStore';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { Sparkles, Mic, X } from 'lucide-react';
import clsx from 'clsx';

export const VocalModeModal = () => {
    const { vocalModeModal, hideVocalModeModal } = useUIStore();
    const { isOpen, videoUuid, videoId } = vocalModeModal;
    const processAudio = useAIVocalStore(state => state.processAudio);
    const updateQueueItem = usePlayerStore(state => state.updateQueueItem);
    
    const isPro = useAIVocalStore(state => videoId ? state.jobs[videoId]?.mode === 'pro' : false);

    if (!isOpen || !videoUuid || !videoId) return null;

    const handleSelectMode = (mode: 'basic' | 'pro') => {
        // Update queue item
        updateQueueItem(videoUuid, { aiVocalRequested: true });
        // Start processing
        processAudio(videoId, mode).catch(console.error);
        hideVocalModeModal();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={hideVocalModeModal}
            />
            
            {/* Modal */}
            <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-5">
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            เลือกระบบแยกเสียงร้อง AI
                        </h3>
                        <button 
                            onClick={hideVocalModeModal}
                            className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {/* Basic Mode */}
                        <button
                            onClick={() => handleSelectMode('basic')}
                            disabled={isPro}
                            className={clsx(
                                "flex items-start gap-4 p-4 rounded-xl text-left transition-all border group",
                                isPro 
                                    ? "bg-gray-50 dark:bg-zinc-800/50 border-gray-100 dark:border-zinc-800 opacity-50 cursor-not-allowed" 
                                    : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-blue-400 hover:shadow-sm"
                            )}
                        >
                            <div className={clsx(
                                "p-2 rounded-lg transition-colors",
                                isPro 
                                    ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500" 
                                    : "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 group-hover:bg-blue-100 group-hover:text-blue-500"
                            )}>
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={clsx("font-bold text-sm mb-1", isPro ? "text-gray-400 dark:text-zinc-500" : "text-gray-900 dark:text-white")}>
                                    Basic Mode
                                </h4>
                                <p className={clsx("text-xs line-clamp-2 leading-relaxed", isPro ? "text-gray-400 dark:text-zinc-600" : "text-gray-500 dark:text-zinc-400")}>
                                    แยก 2 แทร็ก: เสียงร้อง และ ดนตรี (รวดเร็ว ใช้ทรัพยากรน้อย)
                                </p>
                            </div>
                        </button>

                        {/* Pro Mode */}
                        <button
                            onClick={() => handleSelectMode('pro')}
                            className={clsx(
                                "flex items-start gap-4 p-4 rounded-xl text-left transition-all border group",
                                "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30",
                                "border-indigo-100 dark:border-indigo-800/50 hover:border-indigo-400 hover:shadow-md"
                            )}
                        >
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1 flex items-center gap-2">
                                    Pro Mode 
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded-sm">
                                        Multi-track
                                    </span>
                                </h4>
                                <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 line-clamp-2 leading-relaxed">
                                    แยก 4 แทร็ก: ร้อง, กลอง, เบส, ดนตรี (ปรับละเอียดได้แบบ Moises)
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
