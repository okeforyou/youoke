import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import clsx from 'clsx';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { UniversalPlayer } from '../modules/player/components/UniversalPlayer';
import { QueueItem } from '../modules/player/types';

// Icons ported from dual.tsx
import { MusicalNoteIcon, TvIcon } from '@heroicons/react/24/solid';
import { useShallow } from 'zustand/react/shallow';

const CAST_NAMESPACE = 'urn:x-cast:com.youoke.cast';

export default function ChromecastReceiver() {
    const [isReceiverReady, setIsReceiverReady] = useState(false);
    const [time, setTime] = useState(new Date());

    const {
        queue, currentIndex, currentVideo, currentSource, isPlaying,
        play, pause, playVideo, reorderQueue, setCurrentIndex, playNext
    } = usePlayerStore(useShallow(state => ({
        queue: state.queue,
        currentIndex: state.currentIndex,
        currentVideo: state.currentVideo,
        currentSource: state.currentSource,
        isPlaying: state.isPlaying,
        play: state.play,
        pause: state.pause,
        playVideo: state.playVideo,
        reorderQueue: state.reorderQueue,
        setCurrentIndex: state.setCurrentIndex,
        playNext: state.playNext
    })));

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        // Initialize Cast Receiver
        const initCast = () => {
            if (typeof window === 'undefined' || !(window as any).cast) return;

            const cast = (window as any).cast;
            const context = cast.framework.CastReceiverContext.getInstance();

            context.addCustomMessageListener(CAST_NAMESPACE, (event: any) => {
                try {
                    const message = event.data;
                    console.log('📡 [Chromecast] Received Message:', message);

                    switch (message.type) {
                        case 'LOAD_VIDEO':
                            playVideo(message.videoId);
                            break;
                        case 'PLAY':
                            play();
                            break;
                        case 'PAUSE':
                            pause();
                            break;
                        case 'UPDATE_QUEUE':
                            if (message.videos && Array.isArray(message.videos)) {
                                const newQueue: QueueItem[] = message.videos.map((v: any, index: number) => ({
                                    uuid: `cc-${Date.now()}-${index}`,
                                    id: v.videoId,
                                    videoId: v.videoId,
                                    title: v.title || 'Unknown Title',
                                    author: v.author || 'Unknown Artist',
                                    thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
                                    sourceType: 'youtube'
                                }));
                                reorderQueue(newQueue);
                                if (typeof message.currentIndex === 'number') {
                                    setCurrentIndex(message.currentIndex);
                                }
                            }
                            break;
                    }
                } catch (err) {
                    console.error('📡 [Chromecast] Message parsing error:', err);
                }
            });

            const options = new cast.framework.CastReceiverOptions();
            options.disableIdleTimeout = true; // Prevent timeout
            options.maxInactivity = 3600; // 1 hr timeout

            context.start(options);
            setIsReceiverReady(true);
            console.log('📺 [Chromecast] Receiver Started!');
        };

        // Load Script if not loaded
        if (!(window as any).cast) {
            const script = document.createElement('script');
            script.src = '//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js';
            script.async = false;
            script.onload = initCast;
            document.body.appendChild(script);
        } else {
            initCast();
        }

    }, [playVideo, play, pause, reorderQueue, setCurrentIndex]);

    const handlePlayerEnded = () => {
        console.log('🏁 [Chromecast] Media ended, playing next in local queue.');
        playNext();
    };

    const isIdle = !currentSource;

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative font-sans text-white">
            <Head>
                <title>YouOke Chromecast Receiver</title>
                {/* Ensure scaling is disabled for TVs */}
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            </Head>

            {/* 1. Fullscreen Player Layer */}
            <div className={clsx(
                "absolute inset-0 z-0 transition-all duration-1000",
                isIdle ? "opacity-0 scale-105 blur-2xl" : "opacity-100 scale-100 blur-0"
            )}>
                <div className="w-full h-full relative">
                    <UniversalPlayer
                        showControls={false}
                        onEnded={handlePlayerEnded}
                        className="w-full h-full pointer-events-none"
                    />
                </div>
            </div>

            {/* 2. Idle Layer */}
            <div className={clsx(
                "absolute inset-0 z-10 transition-all duration-1000 bg-[#0a0a0a]",
                !isIdle && "opacity-0 pointer-events-none scale-110"
            )}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center p-12">
                    <div className="w-24 h-24 bg-primary/20 rounded-3xl flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
                        <TvIcon className="w-12 h-12 text-primary animate-pulse" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tight mb-4">YouOke <span className="text-primary">Cast</span></h1>
                    <p className="text-xl text-white/50 font-medium tracking-wide">รอรับคำสั่งจากโทรศัพท์มือถือของคุณ...</p>

                    {!isReceiverReady && (
                        <div className="mt-12 flex flex-col items-center">
                            <div className="loading loading-spinner text-primary loading-lg"></div>
                            <p className="text-sm font-bold text-white/30 uppercase tracking-widest mt-4">Initializing Framework...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 3. Sidebar Area (Ported from dual.tsx) */}
            {!isIdle && (
                <div className="absolute top-0 right-0 h-full w-80 lg:w-96 z-40 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md p-8 overflow-y-auto transition-all duration-700">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between border-b border-white/10 pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter">YouOke <span className="text-primary">Cast</span></h3>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    <span className="text-[10px] text-white/40 font-bold uppercase">Connected</span>
                                </div>
                            </div>
                        </div>

                        {/* Now Playing */}
                        {currentVideo && (
                            <div className="animate-in slide-in-from-right-4 duration-700">
                                <p className="text-xs text-white/40 mb-3 uppercase font-black tracking-widest">กำลังเล่น</p>
                                <div className="bg-primary/20 border border-primary/30 rounded-2xl p-6 shadow-xl">
                                    <h2 className="text-3xl font-black text-white leading-tight mb-4 line-clamp-2">{currentVideo.title}</h2>
                                    {currentVideo.author && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                                            <p className="text-xl text-white/60 font-medium truncate">{currentVideo.author}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Next in Queue */}
                        {queue.length > currentIndex + 1 && (
                            <div className="animate-in slide-in-from-right-4 duration-700 delay-200">
                                <p className="text-xs text-white/40 mb-4 uppercase font-black tracking-widest flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <MusicalNoteIcon className="w-4 h-4 text-primary" />
                                        คิวถัดไป
                                    </span>
                                    <span className="bg-white/5 px-2 py-0.5 rounded-md text-[10px]">{queue.length - currentIndex - 1}</span>
                                </p>
                                <div className="space-y-3">
                                    {queue.slice(currentIndex + 1, currentIndex + 8).map((video, index) => (
                                        <div key={video.uuid || index} className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 transition-all border border-white/5">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                                                    <span className="text-primary font-black text-xs">{currentIndex + index + 2}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-lg text-white/90 line-clamp-2 mb-1 group-hover:text-white transition-colors">
                                                        {video.title}
                                                    </p>
                                                    {video.author && <p className="text-sm text-white/40 truncate">{video.author}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
