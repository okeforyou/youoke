import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { QueueItem } from '../../../modules/player/types';

interface DraggableQueueItemProps {
    video: any;
    index: number;
    uniqueId: string;
    onRemove: (uuid: string) => void;
    theme?: 'light' | 'dark';
    isOverlay?: boolean;
}

export const DraggableQueueItem: React.FC<DraggableQueueItemProps> = ({
    video,
    index,
    uniqueId,
    onRemove,
    theme = 'dark',
    isOverlay = false
}) => {
    // CRITICAL: only call useSortable if NOT an overlay. 
    // hook conflicts with duplicate IDs are a major cause of crashes.
    const sortable = useSortable({ id: uniqueId, disabled: isOverlay });
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = sortable;

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1, // High transparency for placeholder
    };

    // Overlay styles (when being dragged)
    const overlayStyle = isOverlay ? {
        opacity: 1,
        cursor: 'grabbing',
        touchAction: 'none'
    } : style;

    return (
        <div
            ref={setNodeRef}
            style={overlayStyle}
            className={`p-3.5 rounded-2xl border flex gap-3.5 items-center ${isOverlay
                ? 'shadow-2xl border-primary bg-stone-900 z-50'
                : isDragging
                    ? 'border-primary/20 bg-transparent'
                    : 'shadow-xl shadow-black/[0.03]'
                } ${theme === 'dark'
                    ? 'bg-stone-900 border-white/5 text-white shadow-black/40'
                    : 'bg-white border-gray-100 text-gray-900'
                } transition-all duration-300`}
        >
            {/* Drag Handle (V1 Style) */}
            <div
                {...attributes}
                {...listeners}
                className={`p-2 rounded-xl active:scale-95 transition-all cursor-grab active:cursor-grabbing ${theme === 'dark' ? 'bg-white/5 text-gray-500 hover:text-white' : 'bg-gray-50 text-gray-400 hover:text-black'}`}
                aria-label="Drag to reorder"
            >
                <GripVertical size={20} strokeWidth={3} />
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
