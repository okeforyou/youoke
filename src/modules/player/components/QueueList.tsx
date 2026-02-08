import React from "react";
import { ListMusic, Trash2, GripVertical } from "lucide-react";
import { usePlayerStore } from "../stores/usePlayerStore";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
const SortableItem = ({ track, index, isCurrent, isPlaying, removeFromQueue, setCurrentIndex }: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: track.uuid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={`p-3 flex gap-3 group transition-colors ${isCurrent ? 'bg-red-50 border-l-4 border-primary' : 'hover:bg-gray-50 border-l-4 border-transparent bg-white'}`}
        // Do NOT put onClick on the whole LI if dragging. 
        // Better to have play button or allow click on content area.
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className="flex items-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing px-1 touch-none"
            >
                <GripVertical size={16} />
            </div>

            <div
                className="w-6 text-center text-gray-400 text-sm font-mono pt-1 cursor-pointer"
                onClick={() => setCurrentIndex(index)}
            >
                {isCurrent && isPlaying ? <div className="animate-pulse text-primary">▶</div> : index + 1}
            </div>

            <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setCurrentIndex(index)}
            >
                <h4 className={`font-semibold text-sm truncate ${isCurrent ? 'text-primary' : 'text-gray-900'}`}>
                    {track.title || "ไม่ระบุชื่อเพลง"}
                </h4>
                <p className="text-xs text-gray-600 truncate font-medium">
                    {track.author || "ไม่ระบุศิลปิน"}
                </p>
            </div>

            <button
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1"
                onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(track.uuid);
                }}
            >
                <Trash2 size={16} />
            </button>
        </li>
    );
};

export const QueueList = () => {
    const { queue, currentIndex, removeFromQueue, setCurrentIndex, reorderQueue, isPlaying, clearQueue } = usePlayerStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = queue.findIndex((item) => item.uuid === active.id);
            const newIndex = queue.findIndex((item) => item.uuid === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                // IMPORTANT: If we move the CURRENTLY PLAYING track, we must update currentIndex?
                // Actually, currentIndex is an integer index. If items shift, that index points to a different song.
                // We typically track "current Video ID" rather than Index for robustness, 
                // but Store relies on currentIndex.
                // Let's reorder first.

                const newQueue = arrayMove(queue, oldIndex, newIndex);
                reorderQueue(newQueue);

                // Adjust Current Index if needed
                // Only if the moved item was the current one, or if we moved something AHEAD/BEHIND current one.
                // Simplest: Find where currentVideo ended up.
                const currentUuid = queue[currentIndex]?.uuid;
                const newCurrentIndex = newQueue.findIndex(q => q.uuid === currentUuid);
                if (newCurrentIndex !== -1 && newCurrentIndex !== currentIndex) {
                    setCurrentIndex(newCurrentIndex);
                }
            }
        }
    };

    const scrollRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to top when queue is replaced or significantly changed
    React.useEffect(() => {
        if (queue.length > 0 && scrollRef.current) {
            // Delay to ensure Mobile Drawer animation (300ms) is fully complete
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 400);
        }
    }, [queue]); // Trigger scroll when queue updates

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            {/* Desktop/Default Header */}
            <div className="hidden lg:flex px-4 py-3 font-bold text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 justify-between items-center bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <ListMusic size={16} />
                    <span>คิวเพลงถัดไป</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => {
                            if (confirm('ต้องการลบคิวทั้งหมดใช่หรือไม่?')) clearQueue();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[10px] font-bold transition-all border border-red-500/10 shadow-sm active:scale-95"
                    >
                        <Trash2 className="w-3 h-3" />
                        <span>ลบทั้งหมด</span>
                    </button>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {(!queue || queue.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 opacity-60">
                        <ListMusic size={40} strokeWidth={1} />
                        <p className="text-sm font-medium">ยังไม่มีเพลงในคิว</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={queue.map(q => q.uuid)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="divide-y divide-gray-50">
                                {queue.map((track, index) => (
                                    <SortableItem
                                        key={track.uuid}
                                        track={track}
                                        index={index}
                                        isCurrent={index === currentIndex}
                                        isPlaying={isPlaying}
                                        removeFromQueue={removeFromQueue}
                                        setCurrentIndex={setCurrentIndex}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </div>
    );
};
