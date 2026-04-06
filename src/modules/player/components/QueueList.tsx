import React from "react";
import { ListMusic, Trash2, Menu, ChevronDown } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { useUIStore } from "../../../stores/useUIStore";
import Image from 'next/image';
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

// Sortable Item with smooth drag (no swap animation)
interface SortableItemProps {
    video: any;
    index: number;
    actualIndex: number;
    onRemove: (uuid: string) => void;
    onPlay: (index: number) => void;
}

function SortableQueueItem({ video, index, actualIndex, onRemove, onPlay }: SortableItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useSortable({ id: video.uuid });

    const style = {
        transform: CSS.Transform.toString(transform),
        // No opacity change to prevent gray tint from showing through
        opacity: isDragging ? 0.95 : 1,
        zIndex: isDragging ? 50 : 'auto',
        backgroundColor: isDragging ? '#18181b' : 'transparent', // Zinc-900 during drag
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-2 py-2 px-3 bg-transparent dark:bg-transparent transition-colors"
        >
            {/* Drag Handle - Outside the card */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-zinc-600 hover:text-primary transition-colors flex-shrink-0 touch-none px-2"
            >
                <Menu className="w-5 h-5 opacity-40 group-hover:opacity-100" />
            </div>

            {/* Card Content - V1 Style with red border on hover (No Shadow - Flat Design) */}
            <div className="flex-1 flex items-center gap-4 rounded-xl transition-all overflow-hidden hover:bg-zinc-100 dark:hover:bg-zinc-800/50 bg-transparent dark:bg-transparent">
                <div
                    className="relative w-36 h-20 flex-shrink-0 bg-black cursor-pointer group/thumb"
                    onClick={() => onPlay(actualIndex)}
                >
                    <Image
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                        unoptimized
                        src={video.thumbnail || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target) {
                                target.src = '/icon-cover.png';
                            }
                        }}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-3 cursor-pointer" onClick={() => onPlay(actualIndex)}>
                    <h4 className="text-[14px] font-black text-black dark:text-white line-clamp-1 leading-snug mb-0.5">
                        {video.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 truncate font-medium">
                        {video.author}
                    </p>
                </div>

                {/* Remove Button - Inside the card (Gray to Red logic) */}
                <div className="pr-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(video.uuid);
                        }}
                        className="w-9 h-9 flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all flex-shrink-0"
                        aria-label="ลบออกจากคิว"
                    >
                        <Trash2 className="w-4.5 h-4.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export function QueueList() {
    const { queue, removeFromQueue, currentIndex, setCurrentIndex, reorderQueue, clearQueue } = usePlayerStore();
    const { showConfirm, isSidebarCollapsed, setSidebarCollapsed } = useUIStore();

    // Derived State
    const queueItems = queue.slice(currentIndex + 1);
    const remainingCount = Math.max(0, queue.length - (currentIndex + 1));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
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

                const currentUuid = queue[currentIndex]?.uuid;
                let newCurrentIndex = currentIndex;

                if (currentUuid) {
                    const foundIndex = newQueue.findIndex(q => q.uuid === currentUuid);
                    if (foundIndex !== -1) {
                        newCurrentIndex = foundIndex;
                    }
                }

                // Atomic update: Reorder queue AND update index without triggering side effects like setCurrentIndex does
                reorderQueue(newQueue, newCurrentIndex);
            }
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full relative z-20 bg-white dark:bg-zinc-950 transition-colors">
            {/* Mobile Handle */}
            <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* Sticky Queue Header (Restored from SidebarControls) */}
            <div className={clsx(
                "h-20 flex items-center shrink-0 z-40 transition-all duration-300",
                isSidebarCollapsed ? "px-0 justify-center" : "px-6"
            )}>
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
            <div className={clsx(
                "flex-1 overflow-y-auto pt-2 pb-24 lg:pb-6 relative z-10 bg-white dark:bg-zinc-950 transition-colors",
                isSidebarCollapsed ? "p-2" : "p-4"
            )}>
                {queueItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400 min-h-[300px]">
                        <ListMusic className="w-12 h-12 mb-3 opacity-30" />
                        <p className="text-sm font-medium">ยังไม่มีคิวเพลง</p>
                        <p className="text-xs text-gray-400 mt-1 text-center">เพิ่มเพลงเข้าคิวเพื่อสัมผัสความสนุกอย่างต่อเนื่อง</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={queueItems.map(v => v.uuid)}
                            strategy={verticalListSortingStrategy}
                        >
                            {queueItems.map((video, index) => {
                                // v4.10.109: Use 0-based index for consumed queue items
                                return (
                                    <div key={video.uuid}>
                                        <SortableQueueItem
                                            video={video}
                                            index={index}
                                            actualIndex={index}
                                            onRemove={removeFromQueue}
                                            onPlay={setCurrentIndex}
                                        />
                                    </div>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
}
