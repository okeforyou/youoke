import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    XMarkIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/solid';
import Image from 'next/image';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}

export const HostController: React.FC<HostControllerProps> = ({
    isCasting,
    isDualMode,
    roomCode,
    onDisconnect,
    currentVideoTitle
}) => {
    const { state } = useFirebaseCast();
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    const currentVideo = state.currentVideo;
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`
        : null;

    return (
        <div className="relative w-full aspect-video bg-[#050505] overflow-hidden select-none flex flex-col items-center justify-center group">

            {/* 1. BACKGROUND (DIRECT FILTER BLUR) - Guaranteed to work */}
            {thumbnailUrl ? (
                <>
                    {/* The Image Itself - Blurred heavily via CSS filter */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[#050505] z-0" />
                        <Image
                            src={thumbnailUrl}
                            alt="Background"
                            fill
                            className="object-cover opacity-60"
                            style={{ filter: 'blur(40px)', transform: 'scale(1.5)' }} // Inline style for guaranteed blur
                            unoptimized
                        />
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#050505]" />
            )}

            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 z-10 bg-black/60" />

            {/* Content Container */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 2. ANIMATION - Simplified & Robust */}
                <div className="relative mb-6">
                    <div className="h-20 px-8 rounded-2xl bg-black/40 border border-white/10 flex items-center gap-6 shadow-2xl relative overflow-hidden">

                        {/* HOST */}
                        <div className="flex flex-col items-center gap-1 z-10">
                            <ComputerDesktopIcon className="w-8 h-8 text-white/50" />
                            <span className="text-[9px] text-white/40 font-mono font-bold">HOST</span>
                        </div>

                        {/* WIRE & SIGNAL */}
                        <div className="relative w-24 h-1 bg-white/10 rounded-full flex items-center overflow-hidden">
                            {/* Moving Dot - Using Tailwind animate-ping or standard transition loop */}
                            <div className="absolute w-12 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent blur-[2px] animate-[slide_1.5s_ease-in-out_infinite]"></div>
                        </div>

                        {/* TV */}
                        <div className="flex flex-col items-center gap-1 z-10 relative">
                            <ComputerDesktopIcon className="w-8 h-8 text-white drop-shadow-md" />
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div>
                            <span className="text-[9px] text-green-400 font-mono font-bold">TV</span>
                        </div>
                    </div>
                </div>

                {/* 3. HEADLINE (High Contrast) */}
                <div className="space-y-1 mb-6">
                    <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-2xl">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <p className="text-xs text-white/70 font-medium tracking-wide bg-black/40 px-3 py-1 rounded-full border border-white/5 inline-block">
                        กำลังส่งสัญญาณไปยังห้อง <span className="text-green-400 font-bold tracking-widest ml-1">{roomCode}</span>
                    </p>
                </div>

                {/* 4. NOW PLAYING (Clear Card, No Blur on Card) */}
                <div className="w-full max-w-sm relative mt-2">
                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-xl p-2.5 flex items-center gap-3 shadow-xl">
                        {thumbnailUrl ? (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-inner border border-white/5">
                                {/* Clear Thumbnail */}
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">
                                <span className="text-lg opacity-30">🎵</span>
                            </div>
                        )}

                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-sm font-bold text-white truncate">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider mt-0.5">
                                Now Playing
                            </p>
                        </div>

                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* FORCE KEYFRAMES */}
            <style jsx global>{`
                @keyframes slide {
                    0% { transform: translateX(-100%); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(200%); opacity: 0; }
                }
            `}</style>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => {
                    setIsDisconnectModalOpen(false);
                    onDisconnect();
                }}
            />
        </div>
    );
};
