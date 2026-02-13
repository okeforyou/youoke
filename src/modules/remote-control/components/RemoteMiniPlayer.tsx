
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
                    height: 16px;
                }
                .bar {
                    width: 3px;
                    background-color: #ec4899; /* primary color */
                    border-radius: 2px;
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
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative shadow-sm border border-gray-100">
                    {currentVideo?.thumbnail ? (
                        <Image
                            unoptimized
                            src={currentVideo.thumbnail}
                            fill
                            className={`object-cover transition-opacity duration-300 ${isPlaying ? 'opacity-40' : 'opacity-100'}`}
                            alt={currentVideo.title}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                            <ListMusic className="w-5 h-5 text-gray-400" />
                        </div>
                    )}

                    {/* Music Bars Animation */}
                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                        <div className={`music-bars ${isPlaying ? 'playing' : ''}`}>
                            <div className="bar h-[40%]"></div>
                            <div className="bar h-[70%]"></div>
                            <div className="bar h-[90%]"></div>
                            <div className="bar h-[50%]"></div>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-sm leading-tight">
                        {isPlaying && <span className="inline-block w-2 h-2 bg-pink-500 rounded-full animate-ping mr-2"></span>}
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
