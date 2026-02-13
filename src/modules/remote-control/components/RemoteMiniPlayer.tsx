
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
    theme?: 'light' | 'dark';
}

export const RemoteMiniPlayer: React.FC<RemoteMiniPlayerProps> = ({
    currentVideo,
    isPlaying,
    onTogglePlay,
    onNext,
    onToggleQueue,
    theme = 'dark'
}) => {
    if (!currentVideo) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 border-t pb-safe-area z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-stone-900 border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
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
                    background-color: #E50914;
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

            <div className="h-24 flex items-center px-5 gap-5">
                {/* Artwork (Super Rounded) */}
                <div className={`w-16 h-16 rounded-[1.5rem] overflow-hidden shrink-0 relative shadow-xl flex items-center justify-center ${theme === 'dark' ? 'bg-black border border-white/5' : 'bg-white border border-gray-100'}`}>
                    {currentVideo?.thumbnail ? (
                        <Image
                            unoptimized
                            src={currentVideo.thumbnail}
                            fill
                            className="object-cover"
                            alt={currentVideo.title}
                        />
                    ) : (
                        <ListMusic className={`w-6 h-6 ${theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`} />
                    )}

                    {isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                            <div className="music-bars playing">
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                                <div className="bar"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Text (Thai Bold Typography) */}
                <div className="flex-1 min-w-0 pr-1">
                    <h4 className={`font-black truncate text-[16px] leading-tight tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {currentVideo?.title}
                    </h4>
                    <p className={`text-[12px] font-bold uppercase truncate mt-1 tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                        {currentVideo?.author}
                    </p>
                </div>

                {/* Controls (Super Rounded Play Button) */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onTogglePlay}
                        className="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_8px_20px_rgba(229,9,20,0.5)] active:scale-90 transition-all"
                    >
                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                    </button>
                    <button
                        onClick={onNext}
                        className={`p-1.5 transition-all active:scale-75 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-black'}`}
                    >
                        <SkipForward size={28} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        </div>
    );
};
