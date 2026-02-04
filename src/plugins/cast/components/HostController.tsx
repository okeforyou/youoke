import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import { TvIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}

export const HostController: React.FC<HostControllerProps> = ({
    roomCode,
    onDisconnect,
    currentVideoTitle
}) => {
    const { state } = useFirebaseCast();
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
    const currentVideo = state.currentVideo;
    const thumbnailUrl = currentVideo?.videoId
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/maxresdefault.jpg`
        : null;

    return (
        <div className="w-full aspect-video relative bg-black flex flex-col items-center justify-center text-center overflow-hidden">

            {/* Background blur */}
            {thumbnailUrl && (
                <div className="absolute inset-0">
                    <Image
                        src={thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
                        unoptimized
                    />
                    <div className="absolute inset-0 bg-black/30" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 space-y-3">

                {/* Single TV Icon (placeholder - will replace with custom image later) */}
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                    <TvIcon className="w-6 h-6 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-white drop-shadow-lg">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p className="text-white/80 text-xs drop-shadow-md">วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>

                {/* Now Playing Card */}
                {currentVideo && (
                    <div className="w-full max-w-sm bg-black/60 rounded-lg p-3 border border-white/10">
                        {/* LIVE-style badge - small red box */}
                        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-600 rounded mb-1.5">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                            <span className="text-[7px] font-bold text-white uppercase leading-none">Live</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{currentVideoTitle || currentVideo.title}</p>
                    </div>
                )}

                {/* Disconnect Button */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-full border border-white/20"
                >
                    ยกเลิกการเชื่อมต่อ
                </button>

            </div>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
