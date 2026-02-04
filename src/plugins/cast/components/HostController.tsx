import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    Squares2X2Icon,
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
        <div className="relative w-full aspect-video bg-[#121212] overflow-hidden select-none flex flex-col items-center justify-center group">

            {/* Dynamic Ambient Background */}
            {thumbnailUrl ? (
                <>
                    {/* The Image itself heavily blurred */}
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-black/40 z-10" /> {/* Dark overlay for readability */}
                        <Image
                            src={thumbnailUrl}
                            alt="Ambient Background"
                            fill
                            className="object-cover blur-2xl scale-125 opacity-60"
                            unoptimized
                        />
                    </div>
                </>
            ) : (
                /* Fallback Dark Background */
                <div className="absolute inset-0 bg-[#121212] z-0" />
            )}

            {/* Content Container (z-10 to sit above background) */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 1. Computer Icon */}
                <div className="relative mb-3 transform scale-95">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center border border-white/20">
                        <ComputerDesktopIcon className="w-8 h-8 text-white drop-shadow-md" />

                        {/* Status Dot */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white/20 animate-pulse shadow-lg"></div>
                    </div>
                </div>

                {/* 2. Headline */}
                <div className="space-y-1 mb-5">
                    <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-lg shadow-black">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                        <span className="text-xs text-white/90 font-medium">
                            ห้อง {roomCode}
                        </span>
                    </div>
                </div>

                {/* 3. Now Playing Card (Glassmorphism) */}
                <div className="w-full max-w-sm relative mt-2 group/card">
                    {/* Glass Container */}
                    <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 shadow-2xl transition-all duration-300 hover:bg-black/70">

                        {/* Thumbnail (Sharp) */}
                        {thumbnailUrl ? (
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 shadow-md border border-white/10">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
                                <span className="text-[10px] opacity-50">🎵</span>
                            </div>
                        )}

                        {/* Text Info */}
                        <div className="text-left flex-1 min-w-0 mr-1">
                            <p className="text-sm font-semibold text-white/95 truncate leading-tight drop-shadow-sm">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium mt-0.5">
                                Now Playing
                            </p>
                        </div>

                        {/* Disconnect Button (Subtle) */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 rounded-full hover:bg-white/20 text-white/50 hover:text-white transition-colors"
                            title="ตัดการเชื่อมต่อ"
                        >
                            <XMarkIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

            </div>

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
