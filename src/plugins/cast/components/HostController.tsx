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
                    {/* Layer A: Image */}
                    <div className="absolute inset-0 z-0">
                        <Image
                            src={thumbnailUrl}
                            alt="Background"
                            fill
                            className="object-cover"
                            unoptimized
                        />
                    </div>
                    {/* Layer B: Heavy Blur Overlay */}
                    <div className="absolute inset-0 z-10 backdrop-blur-[50px] bg-black/60" />
                </>
            ) : (
                <div className="absolute inset-0 z-0 bg-neutral-900" />
            )}

            {/* Content Container */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-sm px-4 py-2">

                {/* 2. ANIMATION CARD */}
                <div className="relative mb-3">
                    <div className="h-14 px-6 rounded-xl bg-black/80 border border-white/20 flex items-center gap-5 shadow-2xl relative overflow-hidden backdrop-blur-md">

                        {/* HOST */}
                        <div className="flex flex-col items-center gap-0.5 z-20">
                            <ComputerDesktopIcon className="w-5 h-5 text-white" />
                            {/* Adjusted Size: Smaller (7px) */}
                            <span className="text-[7px] text-white font-bold tracking-wider leading-none">HOST</span>
                        </div>

                        {/* SIGNAL WIRE */}
                        <div className="relative w-16 h-0.5 bg-white/20 rounded-full flex items-center">
                            <div className="absolute w-8 h-1.5 bg-green-500 rounded-full blur-[1px] animate-[slide_1.5s_linear_infinite] shadow-[0_0_8px_#4ade80]"></div>
                        </div>

                        {/* TV */}
                        <div className="flex flex-col items-center gap-0.5 z-20 relative">
                            <ComputerDesktopIcon className="w-5 h-5 text-white" />
                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 border border-black shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                            {/* Adjusted Size: Smaller (7px) */}
                            <span className="text-[7px] text-white font-bold tracking-wider leading-none">TV</span>
                        </div>

                    </div>
                </div>

                {/* 3. HEADLINE - Smaller Font */}
                <div className="space-y-1 mb-3">
                    {/* Adjusted Size: text-lg (was 2xl) */}
                    <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-md">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-black/40 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <p className="text-[9px] text-white font-medium tracking-wide">
                            ห้อง <span className="font-bold text-green-400">{roomCode}</span>
                        </p>
                    </div>
                </div>

                {/* 4. NOW PLAYING - LIVE BADGE STYLE */}
                <div className="w-full max-w-[280px] relative mt-1">
                    <div className="relative bg-black/80 border border-white/10 rounded-xl p-2 flex items-center gap-3 shadow-xl hover:bg-black/90 transition-colors">
                        {thumbnailUrl ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 border border-white/20">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center">
                                <span className="text-xs text-white/50">🎵</span>
                            </div>
                        )}

                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-xs font-bold text-white truncate mb-1">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>

                            {/* LIVE BADGE (Red Box Style) */}
                            <div className="inline-flex items-center gap-1 bg-red-600 px-1.5 py-0.5 rounded-[2px]">
                                <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                                <span className="text-[8px] font-bold text-white leading-none tracking-wider">NOW PLAYING</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-red-500/20 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
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
