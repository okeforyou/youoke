import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { QueueItem } from '../../../modules/player/types';

interface DraggableQueueItemProps {
    video: {
        videoId?: string;
        title: string;
        author: string;
        addedBy?: {
            name?: string;
            displayName?: string;
        };
    };
    index: number;
    uniqueId: string; // Stable ID for drag & drop
}

export function DraggableQueueItem({ video, index, uniqueId }: DraggableQueueItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: uniqueId });

    const style = {
        transform: CSS.Transform.toString(transform),
        // Removed transition for smooth, direct movement (no bounce)
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-3 items-center ${isDragging ? 'shadow-lg' : ''
                }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
                aria-label="Drag to reorder"
            >
                <GripVertical size={20} />
            </div>

            {/* Queue Number */}
            <span className="font-bold text-gray-300 w-6 text-center text-sm">
                {index + 1}
            </span>

            {/* Song Info */}
            <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{video.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-500 truncate">{video.author}</p>
                    {video.addedBy && (
                        <span className="text-[10px] bg-gray-100 px-1.5 rounded text-gray-500 border border-gray-200">
                            {(video.addedBy as any).name || video.addedBy.displayName || 'Guest'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
