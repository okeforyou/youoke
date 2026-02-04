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
        <div className="relative w-full aspect-video bg-black overflow-hidden select-none flex flex-col items-center justify-center group">

            {/* 1. BACKGROUND LAYERS (Robust Blur) */}
            {thumbnailUrl ? (
                <>
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={thumbnailUrl}
                            alt="Background"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    {/* Darker Overlay for consistent feel */}
                    <div className="absolute inset-0 z-10 backdrop-blur-[50px] bg-black/70" />
                </>
            ) : (
                <div className="absolute inset-0 z-0 bg-neutral-900" />
            )}

            {/* Content Container */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-sm px-4 py-2">

                {/* 2. ANIMATION CARD - Balanced (Smaller Height) */}
                <div className="relative mb-3">
                    {/* Reduced height to h-14 */}
                    <div className="h-14 px-6 rounded-xl bg-black/40 border border-white/10 flex items-center gap-6 shadow-2xl relative overflow-hidden backdrop-blur-md">

                        {/* HOST */}
                        <div className="flex flex-col items-center gap-0.5 z-20">
                            <ComputerDesktopIcon className="w-5 h-5 text-white/90" />
                            {/* Thinner & Smaller */}
                            <span className="text-[7px] text-white/60 font-medium tracking-widest leading-none mt-0.5">HOST</span>
                        </div>

                        {/* SIGNAL WIRE */}
                        <div className="relative w-14 h-[1px] bg-white/10 flex items-center">
                            {/* Line */}
                            <div className="absolute inset-0 bg-white/10"></div>
                            {/* Moving Light Dot */}
                            <div className="absolute w-6 h-1 bg-green-500 rounded-full blur-[1px] animate-[slide_1.5s_linear_infinite] shadow-[0_0_6px_#4ade80]"></div>
                        </div>

                        {/* TV */}
                        <div className="flex flex-col items-center gap-0.5 z-20 relative">
                            <ComputerDesktopIcon className="w-5 h-5 text-white/90" />
                            <div className="absolute -top-0.5 -right-0.5 w-[5px] h-[5px] rounded-full bg-green-500 shadow-[0_0_6px_#22c55e] animate-pulse"></div>
                            {/* Thinner & Smaller */}
                            <span className="text-[7px] text-white/60 font-medium tracking-widest leading-none mt-0.5">TV</span>
                        </div>

                    </div>
                </div>

                {/* 3. HEADLINE */}
                <div className="space-y-1 mb-3">
                    <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-md">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-[2px] bg-white/5 rounded-full border border-white/5 backdrop-blur-sm">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[8px] text-white/70 font-medium tracking-wide">
                            ห้อง <span className="font-bold text-white/90">{roomCode}</span>
                        </p>
                    </div>
                </div>

                {/* 4. NOW PLAYING - PREMIUM OUTLINE BADGE */}
                <div className="w-full max-w-[260px] relative mt-1">
                    <div className="relative bg-black/60 border border-white/10 rounded-lg p-2 flex items-center gap-3 shadow-xl hover:bg-black/80 transition-colors backdrop-blur-md">
                        {thumbnailUrl ? (
                            <div className="relative w-9 h-9 rounded overflow-hidden flex-shrink-0 border border-white/10">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-9 h-9 rounded bg-white/5 flex items-center justify-center">
                                <span className="text-[10px] text-white/30">🎵</span>
                            </div>
                        )}

                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-xs font-bold text-white/95 truncate mb-1">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>

                            {/* PREMIUM LIVE BADGE (Outline Style) */}
                            <div className="inline-flex items-center gap-1.5 border border-red-500/50 bg-red-500/10 px-1.5 py-[1px] rounded-[3px]">
                                <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-[0_0_4px_#ef4444]"></span>
                                <span className="text-[7px] font-bold text-red-100/90 leading-none tracking-widest">NOW PLAYING</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <XMarkIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

            </div>

            {/* KEYFRAMES */}
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
