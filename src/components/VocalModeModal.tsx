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
                        {/* Basic Mode (2CH) */}
                        <button
                            onClick={() => handleSelectMode('basic')}
                            disabled={isPro}
                            className={clsx(
                                "flex items-start gap-4 p-4 rounded-xl text-left transition-all group",
                                isPro 
                                    ? "bg-gray-100 dark:bg-zinc-800/50 opacity-50 cursor-not-allowed" 
                                    : "bg-gray-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            )}
                        >
                            <div className={clsx(
                                "p-2 rounded-lg transition-colors",
                                isPro 
                                    ? "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500" 
                                    : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 group-hover:text-blue-500"
                            )}>
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={clsx("font-bold text-sm mb-1", isPro ? "text-gray-400 dark:text-zinc-500" : "text-gray-900 dark:text-white")}>
                                    โหมด 2CH (ดั้งเดิม)
                                </h4>
                                <p className={clsx("text-xs line-clamp-2 leading-relaxed", isPro ? "text-gray-400 dark:text-zinc-600" : "text-gray-500 dark:text-zinc-400")}>
                                    แยก 2 แทร็ก: เสียงร้อง และ ดนตรี (รวดเร็ว ใช้ทรัพยากรน้อย)
                                </p>
                            </div>
                        </button>

                        {/* Pro Mode (4CH) */}
                        <button
                            onClick={() => handleSelectMode('pro')}
                            className={clsx(
                                "flex items-start gap-4 p-4 rounded-xl text-left transition-all group",
                                "bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                            )}
                        >
                            <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-indigo-900 dark:text-indigo-100 mb-1 flex items-center gap-2">
                                    โหมด 4CH (อัปเกรด)
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white px-1.5 py-0.5 rounded-sm">
                                        Pro
                                    </span>
                                </h4>
                                <p className="text-xs text-indigo-700/80 dark:text-indigo-200/80 line-clamp-2 leading-relaxed">
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
