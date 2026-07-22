import React from "react";
import { ListMusic, Trash2, ChevronDown, Loader2, AudioLines, AudioWaveform, GripVertical, MicVocal, Music, Drum, Guitar, Piano, Sparkles } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useAIVocalStore } from "../../../stores/useAIVocalStore";
import { useUIStore } from "../../../stores/useUIStore";
import { useMixerStore } from "../stores/useMixerStore";
import clsx from 'clsx';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QueueItemProps {
    video: any;
    actualIndex: number;
    isCurrent: boolean;
    aiJob: any;
    dragAttributes?: any;
    dragListeners?: any;
    setNodeRef?: (node: HTMLElement | null) => void;
    style?: React.CSSProperties;
}

const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

function QueueItem({ video, actualIndex, isCurrent, aiJob, dragAttributes, dragListeners, setNodeRef, style }: QueueItemProps) {
    const { removeFromQueue, setCurrentIndex, isKaraoke, isPlaying } = usePlayerStore();
    const { trackStates, toggleMute } = useMixerStore();
    
    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...dragAttributes}
            {...dragListeners}
            className={`
                group relative flex items-center p-2 rounded-xl border mb-2
                ${isCurrent 
                    ? 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 shadow-sm' 
                    : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700'
                }
                transition-all cursor-pointer select-none touch-none
            `}
            onClick={() => setCurrentIndex(actualIndex)}
        >
            {/* Drag Handle Indicator */}
            {isCurrent ? (
                <div className="w-7 pr-2 shrink-0 flex items-center justify-center">
                    <div className="flex items-end gap-[2px] h-3 shrink-0">
                        <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={isPlaying ? { animation: 'eq 0.8s infinite alternate ease-in-out', height: '40%' } : { height: '2px' }} />
                        <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={isPlaying ? { animation: 'eq 0.8s infinite alternate ease-in-out 0.2s', height: '100%' } : { height: '2px' }} />
                        <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={isPlaying ? { animation: 'eq 0.8s infinite alternate ease-in-out 0.4s', height: '60%' } : { height: '2px' }} />
                        <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={isPlaying ? { animation: 'eq 0.8s infinite alternate ease-in-out 0.1s', height: '80%' } : { height: '2px' }} />
                    </div>
                </div>
            ) : (
                <div 
                    className="relative group/drag w-7 pr-2 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                    <GripVertical className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity" />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/drag:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        ลากเพื่อจัดลำดับ
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                    </div>
                </div>
            )}

            {/* Thumbnail */}
            <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 relative bg-black/5 dark:border-white/5 border border-black/5 dark:bg-white/5">
                <img
                    src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId || video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('icon-cover.png')) {
                            target.src = '/icon-cover.png';
                        }
                    }}
                />
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0 ml-3 mr-1">
                <div className="flex items-start gap-2 mb-1">
                    <h4 className="text-[14px] font-black text-black dark:text-white line-clamp-1 leading-snug">
                        {video.title}
                    </h4>
                </div>
                {video.aiVocalRequested && aiJob && aiJob.status === 'processing' ? (
                    <div className="flex items-center gap-2 w-full shrink-0">
                        <span className="shrink-0 text-[11px] text-blue-500 font-bold flex items-center gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            กำลังแยกเสียง
                        </span>
                        <div className="flex-1 h-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 transition-all duration-500 ease-out" style={{ width: `${aiJob.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-blue-500 w-7 text-right">{aiJob.progress.toFixed(0)}%</span>
                    </div>
                ) : (
                    <div className="flex items-center w-full">
                        {!isKaraoke && (
                            <div className="shrink-0 flex items-center">
                                {aiJob?.status === 'ready' ? (
                                    <div className="flex items-center gap-2">
                                        <div 
                                            onClick={(e) => {
                                                if (aiJob.mode === 'pro') return;
                                                e.stopPropagation();
                                                import('../../../stores/useUIStore').then(({ useUIStore }) => {
                                                    useUIStore.getState().showVocalModeModal(video.uuid || video.id, video.videoId || video.id);
                                                });
                                            }}
                                            className={`relative group/badge pl-1.5 pr-2 py-0.5 rounded-md flex items-center justify-center transition-all ${
                                                aiJob.mode === 'pro' 
                                                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 text-amber-600 dark:text-amber-400 cursor-default' 
                                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 text-blue-600 dark:text-blue-400 cursor-pointer hover:shadow-sm'
                                            }`}
                                        >
                                            <Sparkles className={`w-[10px] h-[10px] mr-1 shrink-0 ${aiJob.mode === 'pro' ? 'text-amber-500' : 'text-blue-500'}`} />
                                            <span className="text-[9.5px] font-bold uppercase tracking-wide">
                                                {aiJob.mode === 'pro' ? 'แยกเสียงแล้ว 4CH' : 'แยกเสียงแล้ว 2CH'}
                                            </span>
                                            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[10px] font-medium rounded opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                {aiJob.mode === 'pro' ? 'แยกเสียงแล้ว (4 แทร็ก)' : 'แยกเสียงแล้ว (2 แทร็ก) - คลิกเพื่ออัปเกรดเป็น 4 แทร็ก'}
                                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {aiJob.mode === 'pro' ? (
                                                <>
                                                    <div className="relative group/btn flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if (isCurrent) toggleMute('vocals'); }}
                                                            className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCurrent && trackStates.vocals.muted ? 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 opacity-60' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100'} ${isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`} 
                                                        >
                                                            <MicVocal size={11} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {isCurrent && trackStates.vocals.muted ? 'เปิดเสียงร้อง (Vocals)' : 'ปิดเสียงร้อง (Vocals)'}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                                        </div>
                                                    </div>
                                                    <div className="relative group/btn flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if (isCurrent) toggleMute('drums'); }}
                                                            className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCurrent && trackStates.drums.muted ? 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 opacity-60' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100'} ${isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`} 
                                                        >
                                                            <Drum size={11} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {isCurrent && trackStates.drums.muted ? 'เปิดเสียงกลอง (Drums)' : 'ปิดเสียงกลอง (Drums)'}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                                        </div>
                                                    </div>
                                                    <div className="relative group/btn flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if (isCurrent) toggleMute('bass'); }}
                                                            className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCurrent && trackStates.bass.muted ? 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 opacity-60' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-500 hover:bg-purple-100'} ${isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`} 
                                                        >
                                                            <Guitar size={11} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {isCurrent && trackStates.bass.muted ? 'เปิดเสียงเบส (Bass)' : 'ปิดเสียงเบส (Bass)'}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                                        </div>
                                                    </div>
                                                    <div className="relative group/btn flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if (isCurrent) toggleMute('other'); }}
                                                            className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCurrent && trackStates.other.muted ? 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 opacity-60' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100'} ${isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`} 
                                                        >
                                                            <Piano size={11} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {isCurrent && trackStates.other.muted ? 'เปิดดนตรีอื่นๆ (Other)' : 'ปิดดนตรีอื่นๆ (Other)'}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="relative group/btn flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if (isCurrent) toggleMute('vocals'); }}
                                                            className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCurrent && trackStates.vocals.muted ? 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 opacity-60' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-500 hover:bg-pink-100'} ${isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`} 
                                                        >
                                                            <MicVocal size={11} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {isCurrent && trackStates.vocals.muted ? 'เปิดเสียงร้อง (Vocals)' : 'ปิดเสียงร้อง (Vocals)'}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                                        </div>
                                                    </div>
                                                    <div className="relative group/btn flex items-center justify-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); if (isCurrent) toggleMute('instrumental'); }}
                                                            className={`relative w-5 h-5 rounded-full flex items-center justify-center transition-all ${isCurrent && trackStates.instrumental.muted ? 'bg-gray-50 dark:bg-zinc-800/50 text-gray-400 dark:text-gray-500 opacity-60' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-500 hover:bg-blue-100'} ${isCurrent ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`} 
                                                        >
                                                            <Music size={11} strokeWidth={2.5} />
                                                        </button>
                                                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[9px] font-medium rounded opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                                            {isCurrent && trackStates.instrumental.muted ? 'เปิดเสียงดนตรี (Instrumental)' : 'ปิดเสียงดนตรี (Instrumental)'}
                                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-[3px] border-r-[3px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : aiJob?.status === 'error' ? (
                                    <div className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded flex items-center gap-1 border border-red-100 dark:border-red-800/50">
                                        <span className="text-[9px] font-black uppercase tracking-wide mt-0.5">ล้มเหลว</span>
                                    </div>
                                ) : !aiJob?.status ? (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!video.aiVocalRequested) {
                                                const vidId = video.videoId || video.id;
                                                useUIStore.getState().showVocalModeModal(video.uuid, vidId);
                                            }
                                        }}
                                        className="group px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-primary/10 hover:text-primary active:scale-95 rounded flex items-center gap-1 border border-transparent transition-all"
                                    >
                                        <AudioLines className="w-2.5 h-2.5 group-hover:animate-pulse" />
                                        <span className="text-[9px] font-black uppercase tracking-wide mt-0.5 group-hover:text-primary">ตัดเสียงร้อง</span>
                                    </button>
                                ) : null}
                            </div>
                        )}
                        {video.duration ? (
                            <div className="ml-auto text-[10px] font-medium text-gray-400 dark:text-zinc-500">
                                {formatDuration(video.duration)}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {/* Actions / Status */}
            <div className="flex flex-col items-center justify-start self-stretch shrink-0 pl-1 pt-0.5">
                <div className="relative group/delete flex items-center justify-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeFromQueue(video.uuid);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all flex-shrink-0"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="absolute -top-7 right-0 px-2 py-1 bg-black/80 dark:bg-white/90 text-white dark:text-black text-[10px] font-medium rounded opacity-0 group-hover/delete:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        ลบออกจากคิว
                        <div className="absolute -bottom-1 right-3 border-l-[4px] border-r-[4px] border-t-[4px] border-l-transparent border-r-transparent border-t-black/80 dark:border-t-white/90"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SortableQueueItem(props: QueueItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({ id: props.video.uuid });

    const style = {
        transform: CSS.Transform.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <QueueItem 
            {...props}
            dragAttributes={attributes}
            dragListeners={listeners}
            setNodeRef={setNodeRef}
            style={style}
        />
    );
}

export function QueueList() {
    const { queue, currentIndex, setCurrentIndex, clearQueue, reorderQueue } = usePlayerStore();
    const { showConfirm } = useUIStore();
    const jobs = useAIVocalStore(state => state.jobs);

    const safeCurrentIndex = Math.min(currentIndex, Math.max(0, queue.length - 1));
    const remainingCount = queue.length - safeCurrentIndex;

    const currentPlayingVideo = queue[safeCurrentIndex];
    const upcomingQueue = queue.slice(safeCurrentIndex + 1);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = queue.findIndex((v) => v.uuid === active.id);
            const newIndex = queue.findIndex((v) => v.uuid === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newQueue = arrayMove(queue, oldIndex, newIndex);

                // Update current index if needed
                const currentUuid = queue[safeCurrentIndex]?.uuid;
                const newCurrentIndex = newQueue.findIndex(q => q.uuid === currentUuid);

                reorderQueue(newQueue);

                if (newCurrentIndex !== -1 && newCurrentIndex !== safeCurrentIndex) {
                    setCurrentIndex(newCurrentIndex);
                }
            }
        }
    };

    React.useEffect(() => {
        if (queue.length > 0) {
            const checkCachedStatus = useAIVocalStore.getState().checkCachedStatus;
            const videoIds = queue.map(v => v.videoId || v.id).filter(Boolean);
            checkCachedStatus(videoIds);
        }
    }, [queue]);

    return (
        <div className="flex-1 flex flex-col h-full relative z-20 bg-white dark:bg-zinc-950 transition-colors">
            {/* Mobile Handle */}
            <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* Sticky Queue Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 backdrop-blur-md sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4">
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
                {remainingCount === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 min-h-[300px]">
                        <ListMusic className="w-12 h-12 mb-4 text-gray-300" />
                        <p className="text-sm font-bold">คิวเพลงว่างเปล่า</p>
                        <p className="text-xs text-gray-400 mt-1">เพิ่มเพลงเข้าคิวเพื่อสัมผัสความสนุกอย่างต่อเนื่อง</p>
                    </div>
                ) : (
                    <>
                        {/* Currently Playing (Not Draggable) */}
                        {currentPlayingVideo && (
                            <QueueItem
                                key={`playing-${currentPlayingVideo.uuid}`}
                                video={currentPlayingVideo}
                                actualIndex={safeCurrentIndex}
                                isCurrent={true}
                                aiJob={jobs[currentPlayingVideo.videoId || currentPlayingVideo.id]}
                            />
                        )}

                        {/* Upcoming Queue (Draggable) */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={upcomingQueue.map(v => v.uuid)}
                                strategy={verticalListSortingStrategy}
                            >
                                {upcomingQueue.map((video, index) => {
                                    const actualIndex = safeCurrentIndex + 1 + index;
                                    return (
                                        <SortableQueueItem
                                            key={video.uuid}
                                            video={video}
                                            actualIndex={actualIndex}
                                            isCurrent={false}
                                            aiJob={jobs[video.videoId || video.id]}
                                        />
                                    );
                                })}
                            </SortableContext>
                        </DndContext>
                    </>
                )}
            </div>
        </div>
    );
}

