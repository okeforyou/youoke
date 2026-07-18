import React from "react";
import { ListMusic, Trash2, ChevronDown, Loader2, AudioLines, AudioWaveform, GripVertical } from "lucide-react";
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
                                {/* Drag Handle Placeholder (visible on hover) */}
                                <div className="opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 w-5 flex items-center justify-center text-gray-300 hover:text-gray-500 shrink-0">
                                    <GripVertical size={16} />
                                </div>

                                {/* Thumbnail */}
                                <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 relative bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                    <img
                                        src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId || video.id}/mqdefault.jpg`}
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
                                    </h4>
                                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-500 font-medium w-full">
                                        {video.aiVocalRequested && aiJob && aiJob.status !== 'ready' ? (
                                            <div className={clsx("flex items-center gap-2 w-full", aiJob.status === 'error' ? 'text-red-500' : 'text-blue-500')}>
                                                {aiJob.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                                                <span className="shrink-0">{aiJob.status === 'error' ? 'เกิดข้อผิดพลาด' : `กำลังแยกเสียง ${aiJob.progress.toFixed(0)}%`}</span>
                                                {aiJob.status === 'processing' && (
                                                    <div className="flex-1 h-1.5 bg-blue-500/20 rounded-full overflow-hidden mr-2">
                                                        <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${aiJob.progress}%` }} />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="truncate">{video.author}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions / Status */}
                                <div className="flex flex-col items-end justify-center shrink-0 pl-2 space-y-2">
                                    <div className="flex items-center gap-1">
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
                                                aiJob?.status === 'ready'
                                                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 cursor-default"
                                                    : aiJob?.status === 'processing'
                                                        ? "text-blue-400 cursor-wait"
                                                        : "text-gray-400 dark:text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                                            )}
                                            title={
                                                aiJob?.status === 'ready' ? "แยกแทร็กเสียงสำเร็จพร้อมใช้งาน" : 
                                                aiJob?.status === 'processing' ? "กำลังแยกแทร็กเสียง..." : 
                                                "สั่งแยกแทร็กเสียงร้องด้วย AI"
                                            }
                                        >
                                            {aiJob?.status === 'ready' ? (
                                                <AudioWaveform className="w-4 h-4" />
                                            ) : aiJob?.status === 'processing' ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <AudioLines className="w-4 h-4" />
                                            )}
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
