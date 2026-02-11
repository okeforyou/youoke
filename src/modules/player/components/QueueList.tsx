import React from "react";
import { ListMusic, Trash2, GripVertical } from "lucide-react";
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
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group flex items-center gap-3 px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 bg-white"
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 touch-none"
            >
                <GripVertical className="w-5 h-5" />
            </div>

            {/* Thumbnail */}
            <div
                className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm cursor-pointer"
                onClick={() => onPlay(actualIndex)}
            >
                <Image
                    src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt={video.title}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/icon-cover.png';
                    }}
                />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onPlay(actualIndex)}>
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
                    {video.title}
                </h4>
                <p className="text-xs text-gray-500 truncate">
                    {video.author}
                </p>
            </div>

            {/* Remove Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onRemove(video.uuid);
                }}
                className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                aria-label="ลบออกจากคิว"
            >
                <Trash2 className="w-4 h-4" />
            </button>
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
            <div className="h-full flex flex-col items-center justify-center p-8 text-gray-400">
                <ListMusic className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">ยังไม่มีคิวเพลง</p>
                <p className="text-xs text-gray-400 mt-1">เพิ่มเพลงเข้าคิวเพื่อเล่นต่อ</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 bg-white">
                <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-semibold text-gray-700">
                        คิวเพลง ({queueItems.length})
                    </span>
                </div>
                {queueItems.length > 0 && (
                    <button
                        onClick={() => {
                            if (confirm('ลบคิวทั้งหมด?')) {
                                usePlayerStore.getState().clearQueue();
                            }
                        }}
                        className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
                    >
                        ล้างทั้งหมด
                    </button>
                )}
            </div>

            {/* Queue Items with Drag & Drop */}
            <div className="flex-1 overflow-y-auto">
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
