import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useShallow } from 'zustand/react/shallow';

export const ToastNotification = () => {
    const { isPassive, isPlaying, currentVideo, queue, currentIndex, duration, currentTime } = usePlayerStore(useShallow(state => ({
        isPassive: false, // In SidebarPlayer it's a prop, we should pass it or ignore
        isPlaying: state.isPlaying,
        currentVideo: state.currentVideo,
        queue: state.queue,
        currentIndex: state.currentIndex,
        duration: state.duration,
        currentTime: state.currentTime
    })));

    const [showToast, setShowToast] = useState(false);
    const [toastType, setToastType] = useState<'added' | 'upnext'>('added');
    const [activeToastVideo, setActiveToastVideo] = useState<any>(null);
    const [upNextVideo, setUpNextVideo] = useState<any>(null);
    const [hasShownUpNext, setHasShownUpNext] = useState<string | null>(null);

    // Update active toast video when showToast becomes true
    useEffect(() => {
        if (showToast) {
            const v = (toastType === 'added' ? currentVideo : upNextVideo);
            if (v) setActiveToastVideo(v);
        } else {
            // Keep the content for 1 second to allow exit animation to finish
            const timer = setTimeout(() => {
                setActiveToastVideo(null);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [showToast, toastType, currentVideo, upNextVideo]);

    // Track "Up Next" logic
    useEffect(() => {
        if (!isPlaying || duration <= 0) return;

        // Show Up Next toast 20 seconds before end
        const timeLeft = duration - currentTime;
        if (timeLeft > 5 && timeLeft < 20 && queue.length > currentIndex + 1) {
            const nextVideo = queue[currentIndex + 1];
            if (hasShownUpNext !== nextVideo.uuid) {
                setUpNextVideo(nextVideo);
                setToastType('upnext');
                setShowToast(true);
                setHasShownUpNext(nextVideo.uuid);

                // Broadcast to Store
                usePlayerStore.getState().setNotification({
                    type: 'upnext',
                    video: nextVideo,
                    timestamp: Date.now()
                });

                // Hide after 10 seconds
                setTimeout(() => setShowToast(false), 10000);
            }
        }
    }, [currentTime, duration, isPlaying, queue, currentIndex, hasShownUpNext]);

    // Clear notification when starting new video
    useEffect(() => {
        if (currentVideo) {
            setToastType('added');
            setShowToast(true);

            // Broadcast added notification
            usePlayerStore.getState().setNotification({
                type: 'added',
                video: currentVideo,
                timestamp: Date.now()
            });

            const timer = setTimeout(() => setShowToast(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [currentVideo?.uuid]);

    if (!activeToastVideo) return null;
    
    const thumb = activeToastVideo.thumbnail || (activeToastVideo.videoId ? `https://i.ytimg.com/vi/${activeToastVideo.videoId}/mqdefault.jpg` : "/icon-cover.png");

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[110] transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] ${showToast ? 'opacity-100 translate-y-0 scale-100 blur-0' : 'opacity-0 -translate-y-12 scale-[0.8] pointer-events-none blur-sm'}`}>
            <div className="flex items-center gap-3 bg-black/85 backdrop-blur-2xl rounded-full py-2 px-3 pl-2 min-w-[260px] max-w-[90vw]">
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0 relative bg-stone-900 group">
                    <img
                        src={thumb}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt="Cover"
                    />
                </div>

                {/* Info */}
                <div className="flex flex-col min-w-0 flex-1 pr-2">
                    <div className="flex items-center justify-between gap-3 overflow-hidden">
                        <h3 className="text-[13px] font-black text-white leading-tight truncate">
                            {activeToastVideo.title || "Unknown Title"}
                        </h3>
                        {toastType === 'upnext' && (
                            <span className="text-[9px] font-black uppercase tracking-tighter shrink-0 px-2 py-0.5 rounded-full bg-amber-500 text-black border border-amber-600/20">
                                ถัดไป
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] font-bold text-white/50 truncate mt-1">
                        {activeToastVideo.author || "Unknown"}
                    </p>
                </div>
            </div>
        </div>
    );
};
