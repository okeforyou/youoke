import React from "react";
import { ListMusic, Trash2, Menu } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import Image from 'next/image';
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
        backgroundColor: '#ffffff',
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, backgroundColor: '#ffffff' }}
            className="group flex items-center gap-2 py-2 px-3 bg-white"
        >
            {/* Drag Handle - Outside the card */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-primary transition-colors flex-shrink-0 touch-none px-2"
            >
                <Menu className="w-5 h-5 opacity-50" />
            </div>

            {/* Card Content - V1 Style with red border on hover (No Gray, No Shadow) */}
            <div className="flex-1 flex items-center gap-4 rounded-xl border border-gray-300 transition-all overflow-hidden hover:border-primary bg-white">
                {/* Thumbnail - Flush with the card's left side (Enlarged) */}
                <div
                    className="relative w-36 h-20 flex-shrink-0 bg-black cursor-pointer group/thumb"
                    onClick={() => onPlay(actualIndex)}
                >
                    <Image
                        src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                        unoptimized
                        onError={(e) => {
                            if (e.currentTarget) {
                                e.currentTarget.src = '/icon-cover.png';
                            }
                        }}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-3 cursor-pointer" onClick={() => onPlay(actualIndex)}>
                    <h4 className="text-[14px] font-black text-black line-clamp-1 leading-snug mb-0.5">
                        {video.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate font-medium">
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
                        className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all flex-shrink-0"
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

    // Derived State
    const queueItems = queue.slice(currentIndex + 1);
    const remainingCount = Math.max(0, queue.length - (currentIndex + 1));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Require 5px movement to start dragging, differentiating from click
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
                const currentUuid = queue[currentIndex]?.uuid;
                const newCurrentIndex = newQueue.findIndex(q => q.uuid === currentUuid);

                reorderQueue(newQueue);

                if (newCurrentIndex !== -1 && newCurrentIndex !== currentIndex) {
                    setCurrentIndex(newCurrentIndex);
                }
            }
        }
    };

    if (queueItems.length === 0) {
        return (
            <div className="h-full flex-1 flex flex-col items-center justify-center p-8 text-gray-400 min-h-[400px] relative z-20 bg-white" style={{ backgroundColor: '#ffffff' }}>
                <ListMusic className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">ยังไม่มีคิวเพลง</p>
                <p className="text-xs text-gray-400 mt-1">เพิ่มเพลงเข้าคิวเพื่อเล่นต่อ</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full relative z-20 bg-white" style={{ backgroundColor: '#ffffff' }}>
            {/* Sticky Queue Header (Restored from SidebarControls) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-30" style={{ backgroundColor: '#ffffff' }}>
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-gray-50 flex items-center justify-center">
                        <ListMusic size={12} className="text-gray-900" />
                    </div>
                    <span className="text-[14px] font-black text-black tracking-tight">
                        คิวเพลง <span className="ml-0.5 text-black">({remainingCount})</span>
                    </span>
                </div>
                {queue.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ต้องการลบคิวเพลงทั้งหมดหรือไม่?')) {
                                clearQueue();
                            }
                        }}
                        className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all duration-300 active:scale-95 border border-gray-100"
                    >
                        <Trash2 size={11} className="transition-transform group-hover:scale-110" />
                        <span className="text-[10px] font-black uppercase tracking-wider">ล้างทั้งหมด</span>
                    </button>
                )}
            </div>
            {/* Queue Items with Drag & Drop - Content starts immediately */}
            <div className="flex-1 overflow-y-auto pt-2 pb-6 relative z-10 bg-white" style={{ backgroundColor: '#ffffff' }}>
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
                            const actualIndex = currentIndex + 1 + index;
                            return (
                                <SortableQueueItem
                                    key={video.uuid}
                                    video={video}
                                    index={index}
                                    actualIndex={actualIndex}
                                    onRemove={removeFromQueue}
                                    onPlay={setCurrentIndex}
                                />
                            );
                        })}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
