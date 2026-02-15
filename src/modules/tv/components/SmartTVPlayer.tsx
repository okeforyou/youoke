import React, { useEffect, useRef, useState } from 'react';
import YouTube, { YouTubePlayer } from 'react-youtube';
import Image from 'next/image';
import clsx from 'clsx';
import { MusicalNoteIcon, UserIcon } from '@heroicons/react/24/outline';

export interface VideoItem {
    videoId: string;
    title: string;
    author?: string | null; // Changed type to allow null
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
    // New Props for Queue & Notification
    queue?: VideoItem[];
    isQueueVisible?: boolean;
    notification?: { type: 'added' | 'upnext', video: VideoItem, timestamp: number } | null;
}

export const SmartTVPlayer: React.FC<SmartTVPlayerProps> = ({
    currentVideo,
    nextVideo,
    isPlaying,
    isMuted,
    onStateChange,
    onError,
    onReady,
    // New Props
    queue = [],
    isQueueVisible = false,
    notification = null
}) => {
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [showInfoToast, setShowInfoToast] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [activeNotification, setActiveNotification] = useState<{ message: string, sub: string, type: 'added' | 'upnext' } | null>(null);

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
            <div className={clsx(
                "absolute top-0 right-0 bottom-0 w-[450px] bg-black/80 backdrop-blur-[40px] border-l border-white/5 p-10 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-40 flex flex-col shadow-[-40px_0_80px_rgba(0,0,0,0.5)]",
                isQueueVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
            )}>
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-2 h-8 bg-primary rounded-full shadow-[0_0_20px_rgba(229,9,20,0.8)]"></div>
                    <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white">คิวเพลง</h2>
                    <div className="ml-auto bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                        <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Total: </span>
                        <span className="text-xs font-black text-primary">{queue.length > 0 ? queue.length - 1 : 0}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-4 custom-scrollbar -mr-4">
                    {queue.slice(1).map((video, idx) => (
                        <div key={idx} className="flex gap-6 items-center group animate-in slide-in-from-right-10 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                            <div className="relative">
                                <span className="absolute -left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-white/5 italic">{idx + 1}</span>
                                <div className="w-20 h-20 rounded-2xl bg-zinc-900 relative overflow-hidden shrink-0 border border-white/10 group-hover:border-primary/50 transition-all duration-300 group-hover:scale-105 shadow-xl">
                                    {video.videoId ? (
                                        <Image
                                            unoptimized
                                            src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                                            fill
                                            className="object-cover opacity-60 group-hover:opacity-100 transition-all duration-500"
                                            alt="Thumbnail"
                                            onError={(e) => { e.currentTarget.src = "https://placehold.co/200x200/101010/FFF?text=Queue"; }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><MusicalNoteIcon className="w-8 h-8 text-white/10" /></div>
                                    )}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-white font-black text-lg truncate leading-tight group-hover:text-primary transition-colors tracking-tight">{video.title}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                                        <UserIcon className="w-2.5 h-2.5 text-white/30" />
                                    </div>
                                    <p className="text-white/30 text-[10px] font-bold truncate tracking-wide">{video.addedBy?.displayName || 'แขก'}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {queue.length <= 1 && (
                        <div className="text-center py-24 bg-white/[0.02] rounded-[3rem] border border-white/5">
                            <MusicalNoteIcon className="w-16 h-16 mx-auto mb-6 text-white/10 animate-bounce" />
                            <p className="text-lg font-black text-white/20 uppercase tracking-[0.2em]">ไม่มีเพลงในคิว</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 6. Song Splash Screen (Beautiful Transition) */}
            <div className={clsx(
                "fixed inset-0 z-50 flex items-center justify-center transition-all duration-1000",
                showSplash ? "opacity-100 scale-100" : "opacity-0 scale-110 pointer-events-none"
            )}>
                {/* Background Artwork (Blurred) */}
                <div className="absolute inset-0 bg-black">
                    {currentVideo.videoId && (
                        <div className="absolute inset-0 opacity-40 blur-[80px] scale-125">
                            <Image unoptimized src={`https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`} fill className="object-cover" alt="BG" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                </div>

                <div className="relative text-center max-w-4xl px-12 animate-in zoom-in-95 fade-in duration-1000">
                    <div className="w-64 h-64 mx-auto mb-12 rounded-[3.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-4 border-white/10 relative transform -rotate-3 hover:rotate-0 transition-transform duration-700">
                        <Image
                            unoptimized
                            src={`https://i.ytimg.com/vi/${currentVideo.videoId}/maxresdefault.jpg`}
                            fill
                            className="object-cover"
                            alt="Splash"
                            onError={(e) => { e.currentTarget.src = `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 bg-primary px-6 py-2 rounded-full shadow-2xl shadow-primary/40 animate-pulse">
                            <MusicalNoteIcon className="w-5 h-5 text-white" />
                            <span className="text-sm font-black uppercase tracking-[0.3em] text-white">กำลังเตรียมพร้อม</span>
                        </div>
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tighter drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">{currentVideo.title}</h1>
                        <div className="flex items-center justify-center gap-4 text-xl text-white/60 font-medium">
                            <p>{currentVideo.author}</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                            <p className="flex items-center gap-2">
                                <span className="text-white/30 text-base">โดย</span>
                                <span className="text-primary font-bold italic">{currentVideo.addedBy?.displayName || 'แขก'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 7. Notification Toast (New Song Added) */}
            <div className={clsx(
                "absolute top-8 right-8 z-50 transition-all duration-500 ease-out",
                activeNotification ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0 pointer-events-none"
            )}>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 animate-bounce">
                        <MusicalNoteIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">{activeNotification?.message}</p>
                        <p className="text-white font-bold text-lg leading-none truncate max-w-[200px]">{activeNotification?.sub}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
