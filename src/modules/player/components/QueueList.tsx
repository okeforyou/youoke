import React from "react";
import { ListMusic, Trash2, ChevronDown, Sparkles, Loader2 } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useAIVocalStore } from "../../../stores/useAIVocalStore";
import { useUIStore } from "../../../stores/useUIStore";
import Image from 'next/image';
import clsx from 'clsx';

export function QueueList() {
    const { queue, removeFromQueue, currentIndex, setCurrentIndex, clearQueue } = usePlayerStore();
    const { showConfirm } = useUIStore();

    // v5.3.99: Guard against stale currentIndex during queue transitions (display-only fix)
    const safeCurrentIndex = Math.min(currentIndex, Math.max(0, queue.length - 1));
    const queueItems = queue.slice(safeCurrentIndex); // Show current and upcoming
    const remainingCount = queue.length - safeCurrentIndex;

    // We also need access to jobs to show progress
    const jobs = useAIVocalStore(state => state.jobs);

    return (
        <div className="flex-1 flex flex-col h-full relative z-20 bg-white dark:bg-zinc-950 transition-colors">
            {/* Mobile Handle */}
            <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* Sticky Queue Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-md sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
                    {/* Mobile Close Button (Chevron Down) */}
                    <button
                        onClick={() => useUIStore.getState().setQueueOpen(false)}
                        className="lg:hidden w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-2xl text-gray-500 dark:text-zinc-400 active:scale-90 transition-all shadow-sm"
                    >
                        <ChevronDown size={22} />
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <ListMusic size={14} className="text-primary" />
                            <span className="text-[16px] font-black text-black dark:text-white tracking-tight">
                                คิวเพลง {remainingCount > 0 && <span className="text-gray-400 dark:text-zinc-500 font-bold ml-1 text-[13px]">({remainingCount})</span>}
                            </span>
                        </div>
                    </div>
                </div>
                {queue.length > 0 && (
                    <button
                        onClick={() => {
                            showConfirm({
                                title: 'ล้างคิวเพลง',
                                message: 'คุณต้องการลบคิวเพลงทั้งหมดที่เหลืออยู่ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนคืนได้',
                                confirmText: 'ล้างทั้งหมด',
                                cancelText: 'ยกเลิก',
                                type: 'danger',
                                onConfirm: () => clearQueue()
                            });
                        }}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-zinc-900 text-gray-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 active:scale-95 border border-gray-100 dark:border-zinc-800"
                    >
                        <Trash2 size={11} className="transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-wider">ล้างทั้งหมด</span>
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-32">
                {queueItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 min-h-[300px]">
                        <ListMusic className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-sm font-bold">คิวเพลงว่างเปล่า</p>
                        <p className="text-xs text-gray-400 mt-1">เพิ่มเพลงเข้าคิวเพื่อสัมผัสความสนุกอย่างต่อเนื่อง</p>
                    </div>
                ) : (
                    queueItems.map((video, index) => {
                        const actualIndex = safeCurrentIndex + index;
                        const isCurrent = actualIndex === currentIndex;
                        const aiJob = jobs[video.videoId || video.id];
                        
                        return (
                            <div 
                                key={video.uuid} 
                                className={clsx(
                                    "group flex items-center p-3 rounded-2xl border transition-all cursor-pointer",
                                    isCurrent 
                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500"
                                        : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                                )}
                                onClick={() => setCurrentIndex(actualIndex)}
                            >
                                {/* Thumbnail */}
                                <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 relative bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                    <img
                                        src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (!target.src.includes('icon-cover.png')) {
                                                target.src = '/icon-cover.png';
                                            }
                                        }}
                                    />
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0 ml-3">
                                    <h4 className="text-[14px] font-black text-black dark:text-white line-clamp-1 leading-snug mb-0.5 flex items-center gap-2">
                                        <span className="truncate">{video.title}</span>
                                        {video.aiVocalRequested && (
                                            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-500">
                                                <Sparkles className="w-3 h-3" />
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate font-medium">
                                        {video.author}
                                    </p>
                                    
                                    {/* AI Processing Progress */}
                                    {video.aiVocalRequested && aiJob && (
                                        <div className="mt-1.5 flex flex-col gap-1 pr-2">
                                            <div className="flex items-center justify-between text-[10px] font-bold">
                                                <span className={
                                                    aiJob.status === 'error' ? 'text-red-500' :
                                                    aiJob.status === 'ready' ? 'text-green-500' :
                                                    'text-pink-500'
                                                }>
                                                    {aiJob.status === 'processing' && <Loader2 className="w-3 h-3 inline mr-1 animate-spin" />}
                                                    {aiJob.message || (aiJob.status === 'processing' ? 'กำลังแยกเสียง...' : '')}
                                                </span>
                                                {aiJob.status === 'processing' && (
                                                    <span className="text-gray-400">{aiJob.progress.toFixed(0)}%</span>
                                                )}
                                            </div>
                                            {aiJob.status === 'processing' && (
                                                <div className="w-full bg-gray-100 dark:bg-zinc-700 h-1 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-pink-500 h-full transition-all duration-500 ease-out"
                                                        style={{ width: `${aiJob.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Actions / Status */}
                                <div className="flex flex-col items-end justify-center shrink-0 pl-2 space-y-2">
                                    {isCurrent && (
                                        <div className="px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                            PLAYING
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        {aiJob?.status === 'ready' && <span className="px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[9px] font-bold rounded uppercase">Ready</span>}
                                        {aiJob?.status === 'error' && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[9px] font-bold rounded uppercase">Error</span>}
                                        
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!aiJob || aiJob.status === 'error' || !video.aiVocalRequested) {
                                                    if (!video.aiVocalRequested) {
                                                        usePlayerStore.getState().updateQueueItem(video.uuid, { aiVocalRequested: true });
                                                    }
                                                    const vidId = video.videoId || video.id;
                                                    useAIVocalStore.getState().processAudio(vidId).catch(console.error);
                                                }
                                            }}
                                            disabled={aiJob?.status === 'processing' || aiJob?.status === 'ready'}
                                            className={clsx(
                                                "w-8 h-8 flex items-center justify-center rounded-full transition-all flex-shrink-0",
                                                (aiJob?.status === 'processing' || aiJob?.status === 'ready')
                                                    ? "bg-pink-100 text-pink-300 dark:bg-pink-900/20 dark:text-pink-700 cursor-not-allowed"
                                                    : "text-gray-400 dark:text-zinc-500 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                                            )}
                                            title={
                                                aiJob?.status === 'ready' ? "แยกเสียงแล้ว" : 
                                                aiJob?.status === 'processing' ? "กำลังแยกเสียง..." : 
                                                "แยกเสียงร้องด้วย AI"
                                            }
                                        >
                                            <Sparkles className="w-4 h-4" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFromQueue(video.uuid);
                                            }}
                                            className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all flex-shrink-0"
                                            title="ลบออกจากคิว"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
