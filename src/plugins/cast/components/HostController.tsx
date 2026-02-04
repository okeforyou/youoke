import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    Squares2X2Icon,
    XMarkIcon,
    ComputerDesktopIcon
} from '@heroicons/react/24/outline';
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
        <div className="relative w-full aspect-video bg-[#181921] flex flex-col items-center justify-center text-white overflow-hidden select-none">

            {/* Background Red Glow (Top - Subtle) */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Main Content Container - Compact */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 1. Dual Screen Icon */}
                <div className="relative mb-3 transform scale-90">
                    <div className="w-16 h-16 rounded-full bg-[#23242f] border border-white/5 flex items-center justify-center shadow-lg relative z-10">
                        <ComputerDesktopIcon className="w-7 h-7 text-red-500/80 stroke-1" />
                        <div className="absolute -bottom-1 -right-1 bg-[#181921] rounded-full p-0.5">
                            <Squares2X2Icon className="w-3.5 h-3.5 text-white/40" />
                        </div>
                    </div>
                </div>

                {/* 2. Headline Text (Compact & Bold) */}
                <div className="space-y-0.5 mb-4">
                    <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">
                        โหมด DJ 2 หน้าจอ ทำงานอยู่
                    </h1>
                    <p className="text-xs text-white/40 font-light">
                        วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})
                    </p>
                </div>

                {/* 3. Now Playing Card (Compact) */}
                <div className="w-full max-w-sm relative group">
                    {/* Gradient Border/Glow */}
                    <div className="absolute -inset-px bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-lg opacity-40"></div>

                    <div className="relative bg-[#23242f] border border-white/5 rounded-lg p-2.5 flex items-center gap-3 shadow-lg">
                        {/* Thumbnail */}
                        {thumbnailUrl ? (
                            <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-black/50 shadow-inner">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover opacity-80"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center">
                                <span className="text-[10px] grayscale opacity-50">🎵</span>
                            </div>
                        )}

                        {/* Song Info */}
                        <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-medium text-white/90 truncate pr-2 leading-tight">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Now Playing</span>
                            </div>
                        </div>

                        {/* Disconnect Icon Button */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="p-1.5 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-full transition-all"
                            title="ตัดการเชื่อมต่อ"
                        >
                            <XMarkIcon className="w-4 h-4" />
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
