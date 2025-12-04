import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Bars3Icon } from '@heroicons/react/24/outline';
import VideoHorizontalCard from './VideoHorizontalCard';
import { PlaylistItem } from '../types';

interface DraggablePlaylistItemProps {
  video: PlaylistItem;
  videoIndex: number;
  onPlayNow?: () => void;
  onDelete?: () => void;
}

export function DraggablePlaylistItem({
  video,
  videoIndex,
  onPlayNow,
  onDelete,
}: DraggablePlaylistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: videoIndex.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      {/* Drag Handle - ด้านซ้ายสุด */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-center cursor-grab active:cursor-grabbing touch-none p-2 hover:bg-gray-100 rounded transition-colors"
        title="ลากเพื่อเลื่อนลำดับ"
      >
        <Bars3Icon className="w-6 h-6 text-gray-400 hover:text-gray-600" />
      </div>

      {/* VideoHorizontalCard */}
      <div className="flex-1">
        <VideoHorizontalCard
          video={video}
          onPlayNow={onPlayNow}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
