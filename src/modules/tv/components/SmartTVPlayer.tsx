import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import Image from 'next/image';
import clsx from 'clsx';
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline';
import { PlayCircleIcon } from '@heroicons/react/24/solid';
import { VideoItem } from '../types';
import { QueueList } from './QueueList';
import { SongSplash } from './SongSplash';
import { NotificationToast } from './NotificationToast';
import { ConnectionBadge } from './ConnectionBadge';

export interface SmartTVPlayerProps {
    currentVideo: VideoItem | null;
    nextVideo: VideoItem | null;
    isPlaying: boolean;
    isMuted: boolean;
    onStateChange: (state: number) => void;
    onError: (error: any) => void;
    onReady: (player: YouTubePlayer) => void;
    onPlay?: (index: number) => void;
    // New Props for Queue & Notification
    queue?: VideoItem[];
    isQueueVisible?: boolean;
    notification?: { type: 'added' | 'upnext', video: VideoItem, timestamp: number } | null;
    syncMode?: 'local' | 'remote';
    isPassive?: boolean;
}

export const SmartTVPlayer: React.FC<SmartTVPlayerProps> = ({
    currentVideo,
    nextVideo,
    isPlaying,
    isMuted,
    onStateChange,
    onError,
    onReady,
    onPlay,
    // New Props
    queue = [],
    isQueueVisible = false,
    notification = null,
    syncMode = 'remote',
    isPassive = false
}) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [showInfoToast, setShowInfoToast] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [activeNotification, setActiveNotification] = useState<{ message: string, sub: string, type: 'added' | 'upnext' } | null>(null);
    const [hasInteracted, setHasInteracted] = useState(false);

    // Effect: Handle Song Splash on Video Change
    useEffect(() => {
        if (currentVideo) {
            setShowSplash(true);
            const timer = setTimeout(() => setShowSplash(false), 5000); // Splash for 5s
            return () => clearTimeout(timer);
        }
    }, [currentVideo?.videoId]);

    // Effect: Handle Notification
    useEffect(() => {
        if (notification && notification.timestamp > (Date.now() - 5000)) {
            setActiveNotification({
                message: notification.type === 'added' ? 'เพิ่มเพลงใหม่แล้ว' : 'เพลงถัดไป',
                sub: notification.video.title,
                type: notification.type
            });
            const timer = setTimeout(() => setActiveNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

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

        if (isPlaying && currentVideo) {
            event.target.playVideo().catch(() => {
                console.warn('📺 TV: Autoplay blocked. Waiting for interaction.');
            });
        }
    };

    const handleInteraction = () => {
        setHasInteracted(true);
        if (playerRef.current && isPlaying) {
            playerRef.current.unMute();
            playerRef.current.playVideo();
        }
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

    // Effect: Show Info Toast on Video Change or Pause
    useEffect(() => {
        if (currentVideo) {
            if (!isPlaying) {
                // Paused: Always show info
                setShowInfoToast(true);
            } else {
                // Playing: Show for 8s then hide
                setShowInfoToast(true);
                const timer = setTimeout(() => setShowInfoToast(false), 8000);
                return () => clearTimeout(timer);
            }
        }
    }, [currentVideo?.videoId, isPlaying]);

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
            <div className={clsx(
                "absolute inset-x-0 bottom-0 h-96 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none transition-opacity duration-1000",
                showInfoToast ? "opacity-100" : "opacity-0"
            )} />

            {/* 3. Info Toast (Now Playing) */}
            <div className={clsx(
                "absolute bottom-0 left-0 right-0 z-30 transition-all duration-700 ease-out p-12",
                showInfoToast ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            )}>
                <div className="flex items-end gap-6 max-w-5xl">
                    <div className="w-24 h-24 rounded-2xl shadow-2xl overflow-hidden border border-white/10 relative shrink-0 bg-zinc-900">
                        {currentVideo.videoId ? (
                            <Image
                                unoptimized
                                src={`https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`}
                                fill
                                className="object-cover"
                                alt="Album Art"
                                onError={(e) => {
                                    e.currentTarget.src = "https://placehold.co/400x400/101010/FFF?text=Music";
                                }}
                            />
                        ) : (
                            <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                                <MusicalNoteIcon className="w-8 h-8 text-white/20" />
                            </div>
                        )}
                    </div >
                    <div className="pb-1 min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-primary px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider text-white shadow-lg shadow-primary/40 animate-pulse">กำลังเล่น</span>
                            {currentVideo.addedBy && (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-white/70 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                                    <UserIcon className="w-3 h-3 text-white/50" />
                                    {currentVideo.addedBy.displayName || currentVideo.addedBy.name || 'แขก'}
                                </span>
                            )}
                        </div>
                        <h2 className="text-3xl font-black text-white leading-tight drop-shadow-2xl truncate pr-10 tracking-tighter">{currentVideo.title}</h2>
                        <p className="text-lg text-white/60 mt-2 font-medium truncate drop-shadow-md">{currentVideo.author || ''}</p>
                    </div>
                </div >
            </div >

            {/* 3.1 Connection Badge */}
            <div className="absolute top-8 right-8 z-50">
                <ConnectionBadge mode={syncMode} />
            </div>

            {/* 4. Next Up (Dynamic) */}
            {
                nextVideo && showInfoToast && (
                    <div
                        className="absolute bottom-12 right-12 bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl max-w-sm opacity-0 translate-x-10 transition-all duration-1000 delay-500"
                        ref={(el) => {
                            if (el) setTimeout(() => {
                                el.classList.remove('opacity-0', 'translate-x-10');
                            }, 100);
                        }}
                    >
                        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">คิวถัดไป</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-zinc-800 relative overflow-hidden shrink-0">
                                {nextVideo.videoId ? (
                                    <Image
                                        unoptimized
                                        src={`https://i.ytimg.com/vi/${nextVideo.videoId}/mqdefault.jpg`}
                                        fill
                                        className="object-cover opacity-80"
                                        alt="Next"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://placehold.co/100x100/101010/FFF?text=Next";
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <MusicalNoteIcon className="w-4 h-4 text-white/20" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-white font-medium text-sm truncate">{nextVideo.title}</p>
                                <p className="text-white/40 text-xs truncate">{nextVideo.addedBy?.displayName || 'แขก'}</p>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* 5. Queue Overlay (Beautiful List with Glassmorphism) */}
            <QueueList queue={queue} isVisible={isQueueVisible} onPlay={onPlay} isPassive={isPassive} />

            {/* 6. Song Splash Screen (Beautiful Transition) */}
            <SongSplash video={currentVideo} isVisible={showSplash} />

            {/* 7. Notification Toast (New Song Added) */}
            <NotificationToast
                isVisible={!!activeNotification}
                message={activeNotification?.message}
                sub={activeNotification?.sub}
            />

        </div>
    );
};
