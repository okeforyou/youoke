import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    Squares2X2Icon,
    XMarkIcon,
    ComputerDesktopIcon // Solid by default in v2 solid import
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
        <div className="relative w-full aspect-video bg-base-300 overflow-hidden select-none flex flex-col items-center justify-center">

            {/* Background Gradient Mesh - Matches System Theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-base-300 via-base-200 to-base-300"></div>
            <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[80%] bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-60"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none opacity-40"></div>

            {/* Main Content Container - Compact */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-2">

                {/* 1. Dual Screen Icon - Computer Desktop Solid */}
                <div className="relative mb-3 transform scale-90">
                    <div className="w-16 h-16 rounded-2xl bg-base-100 shadow-xl flex items-center justify-center relative z-10 border border-base-content/5">
                        <ComputerDesktopIcon className="w-8 h-8 text-primary" />

                        {/* Status Badge */}
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-base-100 animate-pulse"></div>
                    </div>
                </div>

                {/* 2. Headline Text */}
                <div className="space-y-1 mb-4">
                    <h1 className="text-2xl font-bold tracking-tight text-base-content drop-shadow-sm">
                        โหมด DJ 2 หน้าจอ
                    </h1>
                    <p className="text-xs text-base-content/60 font-medium bg-base-100/50 px-3 py-1 rounded-full inline-block backdrop-blur-sm border border-base-content/5">
                        ควบคุมการเล่นที่ห้อง <span className="text-primary font-bold">{roomCode}</span>
                    </p>
                </div>

                {/* 3. Now Playing Card (Polished with Theme Colors) */}
                <div className="w-full max-w-sm relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>

                    <div className="relative bg-base-100 rounded-xl p-2.5 flex items-center gap-3 shadow-lg border border-base-content/10">
                        {/* Thumbnail */}
                        {thumbnailUrl ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-base-300 ring-1 ring-base-content/10">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center">
                                <span className="text-[10px] opacity-50">🎵</span>
                            </div>
                        )}

                        {/* Song Info */}
                        <div className="text-left flex-1 min-w-0 pr-2">
                            <p className="text-sm font-bold text-base-content truncate leading-tight">
                                {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-primary font-bold uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Now Playing
                                </span>
                            </div>
                        </div>

                        {/* Disconnect Icon Button */}
                        <button
                            onClick={() => setIsDisconnectModalOpen(true)}
                            className="btn btn-ghost btn-xs btn-circle text-error bg-error/10 hover:bg-error hover:text-white transition-all"
                            title="ตัดการเชื่อมต่อ"
                        >
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </div>

            {/* System Footer Info (Optional) */}
            <div className="absolute bottom-2 text-[10px] text-base-content/20 font-mono">
                CONNECTED: {roomCode}
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
