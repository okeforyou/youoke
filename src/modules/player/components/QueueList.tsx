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
        // NO transition - smooth drag without jumping/swapping
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
        backgroundColor: '#ffffff',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
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

            {/* Card Content - V1 Style with border and rounding */}
            <div className="flex-1 flex items-center gap-3 p-2 rounded-xl border border-gray-100 transition-all" style={{ backgroundColor: '#f8f8f8' }}>
                {/* Thumbnail - Flush with the card's left side (mostly) */}
                <div
                    className="relative w-28 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm cursor-pointer group/thumb"
                    onClick={() => onPlay(actualIndex)}
                >
                    <Image
                        src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                        alt={video.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover/thumb:scale-110"
                        unoptimized
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/icon-cover.png';
                        }}
                    />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(actualIndex)}>
                    <h4 className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight mb-1">
                        {video.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 truncate font-semibold flex items-center gap-1">
                        {video.author}
                    </p>
                </div>

                {/* Remove Button - Also inside the card */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(video.uuid);
                    }}
                    className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-white hover:bg-red-500 rounded-full transition-all flex-shrink-0 bg-red-50"
                    aria-label="ลบออกจากคิว"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

export function QueueList() {
    const { queue, removeFromQueue, currentIndex, setCurrentIndex, reorderQueue } = usePlayerStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts
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

    // Skip first item (currently playing)
    const queueItems = queue.slice(currentIndex + 1);

    if (queueItems.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400 min-h-[400px]" style={{ backgroundColor: '#ffffff', background: '#ffffff' }}>
                <ListMusic className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">ยังไม่มีคิวเพลง</p>
                <p className="text-xs text-gray-400 mt-1">เพิ่มเพลงเข้าคิวเพื่อเล่นต่อ</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full" style={{ backgroundColor: '#ffffff', background: '#ffffff' }}>
            {/* Header */}
            {/* SIMPLE WHITE HEADER v5 */}
            <div className="px-6 pt-4 pb-3 flex items-center justify-between" style={{ backgroundColor: '#ffffff', background: '#ffffff' }}>
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-normal text-gray-500">
                        รายการคิวเพลง ({queueItems.length})
                    </span>
                </div>
                {queueItems.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ต้องการลบคิวเพลงทั้งหมดหรือไม่?')) {
                                usePlayerStore.getState().clearQueue();
                            }
                        }}
                        className="text-[11px] font-normal text-gray-400 hover:text-red-500 transition-colors"
                    >
                        ล้างทั้งหมด
                    </button>
                )}
            </div>

            {/* Queue Items with Drag & Drop */}
            <div className="flex-1 overflow-y-auto pt-1 pb-6" style={{ backgroundColor: '#ffffff', background: '#ffffff' }}>
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
