import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { useFullscreen, useToggle } from 'react-use';
import {
    ArrowsPointingOutIcon,
    ArrowsPointingInIcon,
    PlayIcon,
    PauseIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    ForwardIcon,
    BackwardIcon,
    MusicalNoteIcon,
    ListBulletIcon
} from '@heroicons/react/24/outline';

interface UnifiedPlayerInterfaceProps {
    videoId: string;
    queue: any[];
    isPlaying: boolean;
    isMuted: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrevious?: () => void;
    onMuteToggle: () => void;
    onToggleFullscreen?: () => void; // Optional Fullscreen toggle
    isFullscreen?: boolean;
    title?: string; // Optional override
    roomCode?: string; // For TV display
    showQrCode?: boolean; // For TV idle state? No, usually separate.
    forceShowQueue?: boolean; // Force queue to show (for TV debugging or persistent mode)
    hidePlaybackControls?: boolean; // Hide Play/Pause/Next/Prev for Passive Mode
    isReceiver?: boolean; // Optimized for TV/Cast Receiver
}

export default function UnifiedPlayerInterface({
    videoId,
    queue,
    isPlaying,
    isMuted,
    onPlayPause,
    onNext,
    onPrevious,
    onMuteToggle,
    onToggleFullscreen,
    isFullscreen,
    roomCode,
    forceShowQueue = false,
    hidePlaybackControls = false,
    isReceiver = false,
}: UnifiedPlayerInterfaceProps) {
    // UI State
    const [showQueue, setShowQueue] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const queueTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastQueueLengthRef = useRef(0);

    // Auto-Show Queue on Update
    useEffect(() => {
        if (!queue) return;
        const currentLength = queue.length;
        // Show if queue changed (and not empty)
        if (JSON.stringify(queue) !== JSON.stringify(lastQueueRef.current)) {
            setShowQueue(true);
            if (queueTimeoutRef.current) clearTimeout(queueTimeoutRef.current);
            queueTimeoutRef.current = setTimeout(() => setShowQueue(false), 5000);
        }
    }, [queue]);

    // Use a ref to track prev queue for comparison to avoid dep loops if object changes
    const lastQueueRef = useRef<any[]>([]);
    useEffect(() => {
        lastQueueRef.current = queue || [];
    }, [queue]);


    // Mouse Move - Show Controls
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    const currentVideo = queue?.find(v => v.videoId === videoId) || { title: 'Loading...', videoId };

    return (
        <>
            {/* Queue Display (Modern Widget Style from Dual) */}
            {queue && queue.length > 0 && (
                <div className={`absolute top-8 right-8 w-96 bg-black/80 backdrop-blur-xl rounded-3xl p-6 z-40 shadow-2xl transition-all duration-500 pointer-events-none transform ${(showQueue || forceShowQueue) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>

                    {/* Styles for Infinite Marquee */}
                    <style>{`
              @keyframes marquee-infinite {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-infinite {
                animation: marquee-infinite 20s linear infinite;
                display: flex;
                width: max-content;
                will-change: transform;
              }
            `}</style>

                    {/* Header: Now Playing */}
                    <div className="mb-4 overflow-hidden relative">
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <MusicalNoteIcon className="w-5 h-5 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest">Now Playing</span>
                        </div>

                        {(() => {
                            const title = currentVideo.title || "";
                            const isLong = title.length > 30;
                            return (
                                <div className="relative w-full overflow-hidden">
                                    {isLong ? (
                                        <div className="animate-marquee-infinite">
                                            {/* Render text twice for seamless loop */}
                                            <h1 className="text-white font-medium text-sm whitespace-nowrap mr-16">
                                                {title}
                                            </h1>
                                            <h1 className="text-white font-medium text-sm whitespace-nowrap mr-16">
                                                {title}
                                            </h1>
                                        </div>
                                    ) : (
                                        <h1 className="text-white font-medium text-sm truncate">
                                            {title}
                                        </h1>
                                    )}
                                </div>
                            );
                        })()
                        }
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-white/10 w-full mb-3"></div>

                    {/* Up Next List */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-gray-400 mb-2">
                            <ListBulletIcon className="w-3 h-3" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Up Next</span>
                        </div>

                        {/* Filter logic: Show next 3 songs after current */}
                        {(() => {
                            const currentIndex = queue.findIndex(v => v.videoId === videoId);
                            const nextSongs = currentIndex !== -1 ? queue.slice(currentIndex + 1, currentIndex + 4) : queue.slice(0, 3);

                            if (nextSongs.length === 0) return <p className="text-xs text-gray-500 italic">No more songs.</p>;

                            return (
                                <>
                                    {nextSongs.map((v, i) => (
                                        <div key={i} className="flex gap-3 text-sm text-gray-300 items-center">
                                            <span className="text-xs text-gray-500 font-mono">{(currentIndex + 1) + (i + 1)}</span>
                                            <span className="line-clamp-1 opacity-80">{v.title}</span>
                                        </div>
                                    ))}
                                    {(queue.length - (currentIndex + 1 + nextSongs.length) > 0) && (
                                        <p className="text-xs text-gray-500 mt-2 pl-6">+ อีก {queue.length - (currentIndex + 1 + nextSongs.length)} เพลง</p>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Room Code Badge (TV Only mostly) */}
            {roomCode && (
                <div className="absolute top-8 left-8 z-40">
                    <div className="bg-black/60 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10">
                        <p className="text-xs text-gray-400 mb-1">Room Code</p>
                        <p className="text-2xl font-bold text-primary tracking-widest">{roomCode}</p>
                    </div>
                </div>
            )}


            {/* Custom Control Pill (Unified UI - Bottom Center) */}
            <div className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="bg-black/60 backdrop-blur-md rounded-full px-6 py-3 flex items-center gap-6 border border-white/10 shadow-2xl">

                    {/* Previous Song (Optional) */}
                    {!hidePlaybackControls && onPrevious && (
                        <button onClick={onPrevious} className="p-1 hover:bg-white/20 rounded-full transition-colors order-1 block">
                            <BackwardIcon className="w-6 h-6 text-white hover:scale-110 transition-transform" />
                        </button>
                    )}

                    {/* Play/Pause */}
                    {!hidePlaybackControls && (
                        <button onClick={onPlayPause} className="p-1 hover:bg-white/20 rounded-full transition-colors group order-2">
                            {isPlaying ? (
                                <PauseIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                            ) : (
                                <PlayIcon className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
                            )}
                        </button>
                    )}

                    {/* Next Song */}
                    {!hidePlaybackControls && (
                        <button onClick={onNext} className="p-1 hover:bg-white/20 rounded-full transition-colors order-3 block">
                            <ForwardIcon className="w-8 h-8 text-white hover:scale-110 transition-transform" />
                        </button>
                    )}

                    {/* Separator */}
                    {!hidePlaybackControls && <div className="w-px h-6 bg-white/20 order-4"></div>}

                    {/* Mute (Dynamic Icon) */}
                    <button onClick={onMuteToggle} className="p-1 hover:bg-white/20 rounded-full transition-colors order-5">
                        {isMuted ? <SpeakerXMarkIcon className="w-6 h-6 text-white/80" /> : <SpeakerWaveIcon className="w-6 h-6 text-white/80" />}
                    </button>

                    {/* Fullscreen (Seamless) - Optional */}
                    {onToggleFullscreen && (
                        <button
                            onClick={onToggleFullscreen}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors group order-6"
                            title="Seamless Fullscreen"
                        >
                            {isFullscreen ? (
                                <ArrowsPointingInIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            ) : (
                                <ArrowsPointingOutIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
                            )}
                        </button>
                    )}

                </div>
            </div>
        </>
    );
}
