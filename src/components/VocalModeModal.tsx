import React, { useRef, useState } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useAIVocalStore } from '../stores/useAIVocalStore';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { Sparkles, Mic, X, AlertCircle, Upload, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export const VocalModeModal = () => {
    const { vocalModeModal, hideVocalModeModal } = useUIStore();
    const { isOpen, videoUuid, videoId } = vocalModeModal;
    const processAudio = useAIVocalStore(state => state.processAudio);
    const updateQueueItem = usePlayerStore(state => state.updateQueueItem);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const uploadAudioFile = useAIVocalStore(state => state.uploadAudioFile);
    const defaultMode = useAIVocalStore(state => state.defaultMode);

    const isPro = useAIVocalStore(state => videoId ? state.jobs[videoId]?.mode === 'pro' : false);

    if (!isOpen || !videoUuid || !videoId) return null;


    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !videoId || !videoUuid) return;
        
        setIsUploading(true);
        try {
            const success = await uploadAudioFile(videoId, file);
            if (success) {
                updateQueueItem(videoUuid, { aiVocalRequested: true });
                const songTitle = usePlayerStore.getState().queue.find(item => item.uuid === videoUuid)?.title || "Unknown Title";
                processAudio(videoId, songTitle, defaultMode, true).catch(console.error);
                hideVocalModeModal();
            } else {
                alert("การอัปโหลดไฟล์ล้มเหลว กรุณาตรวจสอบว่า Local Bridge ทำงานอยู่");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("การอัปโหลดไฟล์ล้มเหลว");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSelectMode = (mode: 'basic' | 'pro') => {
        // Update queue item
        updateQueueItem(videoUuid, { aiVocalRequested: true });
        // Find title
        const songTitle = usePlayerStore.getState().queue.find(item => item.uuid === videoUuid)?.title || "Unknown Title";
        // Start processing
        processAudio(videoId, songTitle, mode, false).catch(console.error);
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
                                    : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            <div className={clsx(
                                "p-2 rounded-lg transition-colors",
                                isPro 
                                    ? "bg-gray-200 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500" 
                                    : "bg-white dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 group-hover:text-gray-800 dark:group-hover:text-white"
                            )}>
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className={clsx("font-bold text-sm mb-1", isPro ? "text-gray-400 dark:text-zinc-500" : "text-gray-900 dark:text-white")}>
                                    โหมด 2CH
                                </h4>
                                <p className={clsx("text-xs line-clamp-2 leading-relaxed", isPro ? "text-gray-400 dark:text-zinc-600" : "text-gray-500 dark:text-zinc-400")}>
                                    แยก 2 แทร็ก: เสียงร้อง และ ดนตรี (รวดเร็ว ใช้ทรัพยากรน้อย)
                                </p>
                            </div>
                        </button>

                        <button
                            onClick={() => handleSelectMode('pro')}
                            className={clsx(
                                "flex items-start gap-4 p-4 rounded-xl text-left transition-all group",
                                "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                            )}
                        >
                            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-orange-500 text-white shadow-sm">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-black dark:text-white mb-1 flex items-center gap-2">
                                    โหมด 4CH (แยกชิ้นดนตรี)
                                </h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    แยก 4 แทร็ก: ร้อง, กลอง, เบส, ดนตรีอื่นๆ (ปรับแต่งอิสระได้ทุกชิ้นดนตรี)
                                </p>
                            </div>
                        </button>
                    </div>


                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="audio/*,video/*" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 text-sm font-bold text-gray-700 dark:text-zinc-300 transition-colors border border-dashed border-gray-200 dark:border-zinc-700"
                        >
                            {isUploading ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                                <Upload className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
                            )}
                            {isUploading ? "กำลังอัปโหลดไฟล์..." : "อัปโหลดไฟล์เพลงเอง (แก้ปัญหาดาวน์โหลดไม่ได้)"}
                        </button>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-800/60 flex justify-center">
                        <button
                            onClick={() => {
                                useUIStore.getState().showDownloadHistoryModal();
                            }}
                            className="text-xs font-bold text-gray-500 hover:text-primary dark:text-zinc-400 dark:hover:text-white flex items-center gap-1.5 transition-colors"
                        >
                            <AlertCircle className="w-3.5 h-3.5" />
                            ดูประวัติการแยกเสียงร้อง AI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
