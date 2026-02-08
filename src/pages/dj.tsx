import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { usePlayerStore } from '../modules/player/stores/usePlayerStore';
import { SidebarPlayer } from '../modules/player/components/SidebarPlayer';

// DJ Page: Clean Feed Monitor (Passive Mode)
export default function DjPage() {
    const [mounted, setMounted] = useState(false);
    const { currentVideo, currentSource } = usePlayerStore();
    const [djStarted, setDjStarted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return (
        <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center gap-4">
            <div className="loading loading-ring loading-lg text-primary"></div>
            <p className="text-xl font-light tracking-widest uppercase">Connecting to Console...</p>
        </div>
    );

    const isIdle = !currentSource;
    const currentThumbnail = currentVideo?.thumbnail || `https://i.ytimg.com/vi/${currentVideo?.videoId}/maxresdefault.jpg`;

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative font-sans text-white selection:bg-primary selection:text-white">
            <Head>
                <title>YouOke DJ Monitor</title>
            </Head>

            {/* BACKGROUND LAYER (Ambient) */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {/* Idle Gradient */}
                <div className={`absolute inset-0 transition-opacity duration-1000 ${isIdle ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-black to-pink-900"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10"></div>
                </div>

                {/* Playing Blur */}
                <div className={`absolute inset-0 transition-opacity duration-1000 transform scale-110 ${!isIdle ? 'opacity-100' : 'opacity-0'}`}>
                    {currentVideo && (
                        <Image
                            unoptimized
                            src={currentThumbnail}
                            alt="Background"
                            fill
                            className="object-cover blur-3xl opacity-60 brightness-50"
                        />
                    )}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
                </div>
            </div>

            {/* CLICK TO START OVERLAY (Fix Autoplay) */}
            {!djStarted && (
                <div
                    onClick={() => setDjStarted(true)}
                    className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer hover:bg-black/70 transition-colors"
                >
                    <div className="text-center animate-pulse">
                        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(79,70,229,0.5)]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 text-white ml-1">
                                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-white tracking-widest uppercase">Click to Activate DJ Screen</h2>
                        <p className="text-white/50 mt-2 text-lg">Initialize Audio & Video Engine</p>
                    </div>
                </div>
            )}

            {/* PLAYER CONTAINER (Only Render after Activation to Guarantee Autoplay) */}
            {djStarted && (
                <div className={`absolute inset-0 z-10 flex transition-all duration-1000 ${!isIdle ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                    <div className="w-full h-full relative bg-black">
                        {/* isPassive=false means this player IS the Master (triggers next song)
                     isDjMode=true means this player broadcast presence to mute the Main tab */}
                        <SidebarPlayer isPassive={false} isDjMode={true} />
                    </div>
                </div>
            )}

            {/* NO SONG INDICATOR */}
            {isIdle && djStarted && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 mx-auto rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-white/50">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">System Ready</h1>
                        <p className="text-white/40">Waiting for tracks from controller...</p>
                    </div>
                </div>
            )}

        </div>
    );
}
