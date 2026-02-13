import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
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
    uniqueId: string;
    onRemove?: (id: string) => void;
    theme?: 'light' | 'dark';
}

export function DraggableQueueItem({ video, index, uniqueId, onRemove, theme = 'dark' }: DraggableQueueItemProps) {
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
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.6 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-3.5 rounded-2xl border flex gap-3.5 items-center ${isDragging
                    ? 'shadow-xl border-primary/40 z-10 transition-none'
                    : 'transition-all duration-300 shadow-lg shadow-gray-200/50'
                } ${theme === 'dark'
                    ? 'bg-stone-900 border-white/5 text-white'
                    : 'bg-white border-gray-100 text-gray-900'
                }`}
        >
            {/* Drag Handle (V1 Style) */}
            <div
                {...attributes}
                {...listeners}
                className={`flex items-center transition-colors ${theme === 'dark' ? 'text-gray-600 hover:text-primary' : 'text-gray-300 hover:text-primary'} cursor-grab active:cursor-grabbing touch-none`}
                aria-label="Drag to reorder"
            >
                <GripVertical size={22} strokeWidth={2.5} />
            </div>

            {/* Queue Number (Bold V1) */}
            <span className={`font-black text-xs w-6 text-center ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`}>
                {(index + 1).toString().padStart(2, '0')}
            </span>

            {/* Song Info (High Contrast) */}
            <div className="flex-1 min-w-0">
                <h4 className="font-black text-[14px] truncate leading-tight tracking-tight uppercase">{video.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                    <p className={`text-[10px] font-bold truncate tracking-wide ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {video.author}
                    </p>
                    {video.addedBy && (
                        <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${theme === 'dark' ? 'bg-white/5 text-gray-500' : 'bg-gray-100 text-gray-400 border border-gray-100'}`}>
                            {(video.addedBy as any).name || video.addedBy.displayName || 'Guest'}
                        </span>
                    )}
                </div>
            </div>

            {/* Remove Button (V1 Minimalist) */}
            {onRemove && (
                <button
                    onClick={() => onRemove(uniqueId)}
                    className={`p-2 rounded-lg transition-all active:scale-90 ${theme === 'dark' ? 'text-gray-600 hover:text-red-500 hover:bg-red-500/10' : 'text-gray-300 hover:text-red-500 hover:bg-red-50'}`}
                >
                    <Trash2 size={18} strokeWidth={2.5} />
                </button>
            )}
        </div>
    );
}
