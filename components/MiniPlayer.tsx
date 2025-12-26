import Image from 'next/image';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  QueueListIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';

interface MiniPlayerProps {
  currentVideo?: {
    videoId: string;
    title: string;
    author?: string;
    videoThumbnails?: Array<{ url: string; quality: string }>;
  };
  isPlaying?: boolean;
  progress?: number; // 0-100
  currentTime?: string; // e.g. "2:45"
  duration?: string; // e.g. "4:20"
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onExpand?: () => void;
  onOpenQueue?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
  className?: string;
}

export default function MiniPlayer({
  currentVideo,
  isPlaying = false,
  progress = 0,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrevious,
  onExpand,
  onOpenQueue,
  hasNext = false,
  hasPrevious = false,
  className = '',
}: MiniPlayerProps) {
  // Don't render if no video is playing
  if (!currentVideo) {
    return null;
  }

  // Get thumbnail URL
  const getThumbnailUrl = () => {
    if (currentVideo.videoThumbnails && currentVideo.videoThumbnails.length > 0) {
      // Try to get medium quality thumbnail
      const mediumThumb = currentVideo.videoThumbnails.find(t => t.quality === 'medium');
      if (mediumThumb) return mediumThumb.url;
      // Fallback to first available
      return currentVideo.videoThumbnails[0].url;
    }
    // Final fallback to YouTube CDN
    return `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`;
  };

  return (
    <div
      className={`fixed bottom-16 left-0 right-0 xl:hidden z-[45] bg-base-200 border-t border-base-300 shadow-lg ${className}`}
      onClick={(e) => {
        // Prevent click propagation to controls
        if ((e.target as HTMLElement).tagName !== 'BUTTON') {
          onExpand?.();
        }
      }}
    >
      {/* Progress Bar */}
      {progress > 0 && (
        <div className="w-full h-1 bg-base-300">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Thumbnail */}
        <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-base-300">
          <Image
            src={getThumbnailUrl()}
            alt={currentVideo.title}
            fill
            className="object-cover"
            sizes="56px"
            unoptimized
          />
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onExpand?.()}>
          <h3 className="font-semibold text-sm truncate text-base-content">
            {currentVideo.title}
          </h3>
          {currentVideo.author && (
            <p className="text-xs text-base-content/60 truncate">
              {currentVideo.author}
            </p>
          )}
          {/* Time Display - Mobile Only */}
          {currentTime && duration && (
            <p className="text-xs text-base-content/50 mt-0.5">
              {currentTime} / {duration}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Previous Button - Only show if has previous */}
          {hasPrevious && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious?.();
              }}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Previous"
            >
              <BackwardIcon className="w-5 h-5" />
            </button>
          )}

          {/* Play/Pause Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause?.();
            }}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>

          {/* Next Button - Only show if has next */}
          {hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Next"
            >
              <ForwardIcon className="w-5 h-5" />
            </button>
          )}

          {/* Queue Button - Hidden on very small screens */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenQueue?.();
            }}
            className="btn btn-ghost btn-sm btn-circle hidden sm:flex"
            aria-label="Queue"
          >
            <QueueListIcon className="w-5 h-5" />
          </button>

          {/* Expand Button - Hidden on very small screens */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand?.();
            }}
            className="btn btn-ghost btn-sm btn-circle hidden sm:flex"
            aria-label="Expand"
          >
            <ChevronUpIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
