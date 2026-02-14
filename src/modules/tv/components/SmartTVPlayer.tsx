import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import Image from 'next/image';
import clsx from 'clsx';
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline';

export interface VideoItem {
    videoId: string;
    title: string;
    author: string;
    addedBy?: {
        name?: string;
        displayName?: string;
        photoURL?: string;
    };
    uuid?: string;
}

export interface SmartTVPlayerProps {
    currentVideo: VideoItem | null;
    nextVideo: VideoItem | null;
    isPlaying: boolean;
    isMuted: boolean;
    onStateChange: (state: number) => void;
    onError: (error: any) => void;
    onReady: (player: YouTubePlayer) => void;
}

export const SmartTVPlayer: React.FC<SmartTVPlayerProps> = ({
    currentVideo,
    nextVideo,
    isPlaying,
    isMuted,
    onStateChange,
    onError,
    onReady
}) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [showInfoToast, setShowInfoToast] = useState(false);

    // YouTube Options
    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1 as const,
            controls: 0 as const, // Hide controls for TV experience
            modestbranding: 1 as const,
            rel: 0 as const,
            showinfo: 0 as const,
            iv_load_policy: 3 as const, // Hide annotations
        },
    };

    // Handle Ready
    const handleReady = (event: { target: YouTubePlayer }) => {
        playerRef.current = event.target;
        onReady(event.target);

        // Initial Sync
        if (isMuted) event.target.mute();
        else event.target.unMute();

        if (isPlaying && currentVideo) event.target.playVideo();
    };

    // Effect: Sync Play/Pause
    useEffect(() => {
        if (!playerRef.current) return;
        const player = playerRef.current;

        if (isPlaying) player.playVideo();
        else player.pauseVideo();
    }, [isPlaying]);

    // Effect: Sync Mute
    useEffect(() => {
        if (!playerRef.current) return;
        const player = playerRef.current;

        if (isMuted) player.mute();
        else player.unMute();
    }, [isMuted]);

    // Effect: Show Info Toast on Video Change
    useEffect(() => {
        if (currentVideo) {
            setShowInfoToast(true);
            const timer = setTimeout(() => setShowInfoToast(false), 8000); // Show for 8s
            return () => clearTimeout(timer);
        }
    }, [currentVideo?.videoId]);

    if (!currentVideo) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white/20">
                <MusicalNoteIcon className="w-20 h-20 animate-pulse" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-black overflow-hidden group">
            {/* 1. YouTube Player */}
            <div className="absolute inset-0 pointer-events-none">
                <YouTube
                    videoId={currentVideo.videoId}
                    opts={opts}
                    onReady={handleReady}
                    onStateChange={(e) => onStateChange(e.data)}
                    onError={onError}
                    className="w-full h-full"
                    iframeClassName="w-full h-full object-cover"
                />
            </div>

            {/* 2. Gradients for Readability */}
            <div className="absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

            {/* 3. Info Toast (Now Playing) */}
            <div className={clsx(
                "absolute bottom-0 left-0 right-0 z-30 transition-all duration-700 ease-out p-12",
                showInfoToast ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}>
                <div className="flex items-end gap-6 max-w-5xl">
                    <div className="w-24 h-24 rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative shrink-0 bg-zinc-900">
                        <Image
                            unoptimized
                            src={`https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`}
                            fill
                            className="object-cover"
                            alt="Album Art"
                            onError={(e) => {
                                e.currentTarget.srcset = "https://placehold.co/400x400/101010/FFF?text=Music";
                            }}
                        />
                    </div>
                    <div className="pb-1 min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-primary px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/40 animate-pulse">Now Playing</span>
                            {currentVideo.addedBy && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-white/70 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                                    <UserIcon className="w-3 h-3 text-white/50" />
                                    {currentVideo.addedBy.displayName || currentVideo.addedBy.name || 'Guest'}
                                </span>
                            )}
                        </div>
                        <h2 className="text-5xl font-black text-white leading-tight drop-shadow-2xl truncate pr-10 tracking-tighter">{currentVideo.title}</h2>
                        <p className="text-2xl text-white/60 mt-2 font-medium truncate drop-shadow-md">{currentVideo.author}</p>
                    </div>
                </div>
            </div>

            {/* 4. Next Up (Dynamic) */}
            {nextVideo && showInfoToast && (
                <div
                    className="absolute bottom-12 right-12 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl max-w-sm opacity-0 translate-x-10 transition-all duration-1000 delay-500"
                    ref={(el) => {
                        if (el) setTimeout(() => {
                            el.classList.remove('opacity-0', 'translate-x-10');
                        }, 100);
                    }}
                >
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Up Next</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-zinc-800 relative overflow-hidden shrink-0">
                            <Image
                                unoptimized
                                src={`https://i.ytimg.com/vi/${nextVideo.videoId}/mqdefault.jpg`}
                                fill
                                className="object-cover opacity-80"
                                alt="Next"
                            />
                        </div>
                        <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{nextVideo.title}</p>
                            <p className="text-white/40 text-xs truncate">{nextVideo.addedBy?.displayName || 'Guest'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
