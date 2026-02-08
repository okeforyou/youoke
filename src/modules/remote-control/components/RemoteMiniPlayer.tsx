
import React from 'react';
import Image from 'next/image';
import { Play, Pause, SkipForward, ListMusic } from 'lucide-react';
import { QueueItem } from '../../../modules/player/types';

interface RemoteMiniPlayerProps {
    currentVideo: QueueItem | null;
    isPlaying: boolean;
    onTogglePlay: () => void;
    onNext: () => void;
    onToggleQueue: () => void;
}

export const RemoteMiniPlayer: React.FC<RemoteMiniPlayerProps> = ({
    currentVideo,
    isPlaying,
    onTogglePlay,
    onNext,
    onToggleQueue
}) => {
    if (!currentVideo && !isPlaying) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe-area z-50">
            <div className="h-20 flex items-center px-4 gap-4">
                {/* Artwork */}
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative shadow-sm">
                    {currentVideo?.thumbnail ? (
                        <Image
                            unoptimized
                            src={currentVideo.thumbnail}
                            fill
                            className="object-cover"
                            alt={currentVideo.title}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <ListMusic className="w-5 h-5 text-gray-400" />
                        </div>
                    )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-sm leading-tight">{currentVideo?.title}</h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{currentVideo?.author}</p>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onTogglePlay}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button onClick={onNext} className="p-2 text-gray-400 hover:text-gray-900 active:scale-95">
                        <SkipForward size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};
