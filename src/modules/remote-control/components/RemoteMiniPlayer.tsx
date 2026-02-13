
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
    if (!currentVideo) return null; // Only hide if NO video is selected at all

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe-area z-50">
            {/* Visualizer Style */}
            <style jsx>{`
                .music-bars {
                    display: flex;
                    align-items: flex-end;
                    gap: 2px;
                    height: 14px;
                }
                .bar {
                    width: 3px;
                    background-color: #E50914; /* System Primary Red (V1 Parity) */
                    border-radius: 1px;
                }
                .playing .bar {
                    animation: music-bounce 1s ease-in-out infinite;
                }
                .bar:nth-child(2) { animation-delay: 0.2s !important; height: 60%; }
                .bar:nth-child(3) { animation-delay: 0.4s !important; height: 80%; }
                .bar:nth-child(4) { animation-delay: 0.1s !important; height: 50%; }
                
                @keyframes music-bounce {
                    0%, 100% { height: 30%; }
                    50% { height: 100%; }
                }
            `}</style>

            <div className="h-20 flex items-center px-4 gap-4">
                {/* Artwork with Animation Overlay */}
                <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0 relative shadow-sm border border-gray-100 flex items-center justify-center">
                    {currentVideo?.thumbnail ? (
                        <Image
                            unoptimized
                            src={currentVideo.thumbnail}
                            fill
                            className="object-cover"
                            alt={currentVideo.title}
                        />
                    ) : (
                        <ListMusic className="w-5 h-5 text-gray-300" />
                    )}

                    {/* Music Bars Animation Overlay */}
                    {isPlaying && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="music-bars playing">
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-sm leading-tight">
                        {currentVideo?.title}
                    </h4>
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
