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

            {/* 1. BACKGROUND (DIRECT FILTER BLUR) */}
            {thumbnailUrl ? (
                <>
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[#050505] z-0" />
                        <Image
                            src={thumbnailUrl}
                            alt="Background"
                            fill
                            className="object-cover opacity-50"
                            style={{ filter: 'blur(30px)', transform: 'scale(1.2)' }}
                            unoptimized
                        />
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#050505]" />
            )}

            {/* Darker Overlay for better text contrast */}
            <div className="absolute inset-0 z-10 bg-black/60" />

            {/* Content Container - Reduced spacing */}
            <div className="relative z-30 flex flex-col items-center justify-center text-center w-full max-w-sm px-4 py-2">

                {/* 2. ANIMATION & ICON - Scaled Down & Darker Card */}
                <div className="relative mb-4">
                    {/* Darker translucent background (bg-black/60) */}
                    <div className="h-14 px-5 rounded-xl bg-black/60 border border-white/10 flex items-center gap-4 shadow-xl relative overflow-hidden backdrop-blur-sm">

                        {/* HOST */}
                        <div className="flex flex-col items-center gap-0.5 z-10">
                            <ComputerDesktopIcon className="w-5 h-5 text-white/70" />
                            <span className="text-[8px] text-white/40 font-mono font-bold">HOST</span>
                        </div>

                        {/* SIGNAL WIRE - Shorter distance */}
                        <div className="relative w-16 h-1 bg-white/10 rounded-full flex items-center overflow-hidden">
                            {/* Moving Dot - Brighter and clearer animation */}
                            <div className="absolute w-8 h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent blur-[1px] animate-[slide_1.5s_linear_infinite]"></div>
                        </div>

                        {/* TV */}
                        <div className="flex flex-col items-center gap-0.5 z-10 relative">
                            <ComputerDesktopIcon className="w-5 h-5 text-white drop-shadow-md" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></div>
                            <span className="text-[8px] text-green-400 font-mono font-bold">TV</span>
                        </div>
                    </div>
                </div>

                {/* 3. HEADLINE - Smaller Font */}
                <div className="space-y-1 mb-4">
                    <h1 className="text-xl font-bold tracking-tight text-white drop-shadow-lg">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <p className="text-[10px] text-white/60 font-medium tracking-wide bg-black/60 px-2 py-0.5 rounded-full border border-white/5 inline-block backdrop-blur-sm">
                        ห้อง <span className="text-green-400 font-bold ml-0.5">{roomCode}</span>
                    </p>
                </div>

                {/* 4. NOW PLAYING - Darker Card & Compact */}
                <div className="w-full max-w-xs relative mt-1">
                    {/* Darker translucent background (bg-black/80) */}
                    <div className="relative bg-[#111111]/80 backdrop-blur-sm border border-white/10 rounded-lg p-2 flex items-center gap-3 shadow-lg hover:bg-black/90 transition-colors">
                        {thumbnailUrl ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 shadow-inner border border-white/5">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                                <span className="text-xs opacity-30">🎵</span>
                            </div>
                        )}

                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-xs font-bold text-white truncate opacity-90">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                                Now Playing
                            </p>
                        </div>

                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* Global Styles for Animation (Ensures it works) */}
            <style jsx global>{`
                @keyframes slide {
                    0% { transform: translateX(-100%); opacity: 0; }
                    50% { opacity: 1; }
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
