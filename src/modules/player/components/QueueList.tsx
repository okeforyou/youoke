import React from "react";
import { ListMusic, Trash2, ChevronDown, Loader2, AudioLines, AudioWaveform, GripVertical, MicVocal, Music, Drum, Guitar, Piano } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useAIVocalStore } from "../../../stores/useAIVocalStore";
import { useUIStore } from "../../../stores/useUIStore";
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
    const { removeFromQueue, setCurrentIndex, isKaraoke } = usePlayerStore();
    
    return (
        <div 
            ref={setNodeRef}
            style={style}
            {...dragAttributes}
            {...dragListeners}
            className={clsx(
                "group flex items-center p-3 rounded-2xl border transition-colors relative",
                !isCurrent && "cursor-grab active:cursor-grabbing touch-none",
                isCurrent 
                    ? "bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary/40 cursor-pointer"
                    : "bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 hover:border-gray-200 dark:hover:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
            )}
            onClick={() => setCurrentIndex(actualIndex)}
        >
            {/* Drag Handle Indicator */}
            {isCurrent ? (
                <div className="w-7 pr-2 shrink-0" />
            ) : (
                <div 
                    className="w-7 pr-2 flex items-center justify-center text-gray-300 group-hover:text-gray-400 shrink-0 transition-colors"
                >
                    <GripVertical size={16} />
                </div>
            )}

            {/* Thumbnail */}
            <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0 relative bg-black/5 dark:border-white/5 border border-black/5 dark:bg-white/5">
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
            <div className="flex-1 min-w-0 ml-3 mr-1">
                <div className="flex items-start gap-2 mb-1">
                    <h4 className="text-[14px] font-black text-black dark:text-white line-clamp-1 leading-snug">
                        {video.title}
                    </h4>
                    {isCurrent && (
                        <div className="flex items-end gap-[2px] h-3 shrink-0 mt-1">
                            <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={{ animation: 'eq 0.8s infinite alternate ease-in-out', height: '40%' }} />
                            <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={{ animation: 'eq 0.8s infinite alternate ease-in-out 0.2s', height: '100%' }} />
                            <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={{ animation: 'eq 0.8s infinite alternate ease-in-out 0.4s', height: '60%' }} />
                            <div className="w-[2px] bg-black dark:bg-white rounded-t-[1px]" style={{ animation: 'eq 0.8s infinite alternate ease-in-out 0.1s', height: '80%' }} />
                        </div>
                    )}
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
                                            className={`px-2 py-0.5 rounded flex items-center justify-center transition-colors ${
                                                aiJob.mode === 'pro' 
                                                    ? 'bg-yellow-500 text-white cursor-default' 
                                                    : 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600'
                                            }`}
                                            title={aiJob.mode === 'pro' ? 'แยกเสียงแล้ว (4 แทร็ก)' : 'แยกเสียงแล้ว (2 แทร็ก) - คลิกเพื่ออัปเกรดเป็น 4 แทร็ก'}
                                        >
                                            <span className="text-[9.5px] font-black uppercase tracking-wide">
                                                {aiJob.mode === 'pro' ? 'แยกเสียงแล้ว 4CH' : 'แยกเสียงแล้ว 2CH'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {aiJob.mode === 'pro' ? (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center" title="เสียงร้อง">
                                                        <MicVocal size={11} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center" title="เสียงกลอง">
                                                        <Drum size={11} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center" title="เสียงเบส">
                                                        <Guitar size={11} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center" title="เสียงดนตรีอื่นๆ">
                                                        <Piano size={11} strokeWidth={2.5} />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="w-5 h-5 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center" title="เสียงร้อง">
                                                        <MicVocal size={11} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center" title="เสียงดนตรี">
                                                        <Music size={11} strokeWidth={2.5} />
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

