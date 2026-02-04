import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
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

    const songTitle = currentVideoTitle || currentVideo?.title || '';

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
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-4 space-y-2">

                {/* Custom dual screen icon */}
                <div className="w-12 h-12 flex items-center justify-center">
                    <Image
                        src="/img/computer.png"
                        alt="Dual Screen"
                        width={40}
                        height={40}
                        className="invert opacity-80"
                    />
                </div>

                {/* Title */}
                <h3 className="text-sm font-bold text-white drop-shadow-lg">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p className="text-white/70 text-[10px] drop-shadow-md">วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>

                {/* Now Playing Card */}
                {currentVideo && (
                    <div className="w-full max-w-xs bg-black/50 rounded-lg p-2 border border-white/10">
                        {/* Song title + marquee */}
                        <div className="overflow-hidden">
                            <p className={`text-[11px] font-medium text-white whitespace-nowrap ${songTitle.length > 30 ? 'animate-marquee' : ''}`}>
                                {songTitle}
                            </p>
                        </div>
                        {/* Tiny badge */}
                        <div className="flex items-center gap-0.5 mt-1">
                            <span className="w-[3px] h-[3px] bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-[6px] text-red-400 font-medium">กำลังเล่น</span>
                        </div>
                    </div>
                )}

                {/* Disconnect Button */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium rounded-full border border-white/20"
                >
                    ยกเลิกการเชื่อมต่อ
                </button>

            </div>

            {/* Marquee animation */}
            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 8s linear infinite;
                }
            `}</style>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
