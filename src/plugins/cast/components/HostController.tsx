import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';

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
                    <img
                        src={thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{ filter: 'blur(20px)', transform: 'scale(1.1)' }}
                    />
                    <div className="absolute inset-0 bg-black/30" />
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-3 space-y-1">

                {/* Icon - from public folder */}
                <img src="/computer.png" alt="" className="w-6 h-6 invert opacity-80" />

                {/* Title - smaller */}
                <h3 className="text-xs font-bold text-white drop-shadow-lg">โหมด DJ 2 หน้าจอ ทำงานอยู่</h3>
                <p className="text-white/70 text-[8px] drop-shadow-md">วิดีโอกำลังเล่นบนจอแยก (ห้อง {roomCode})</p>

                {/* Now Playing - much smaller */}
                {currentVideo && (
                    <div className="w-full max-w-[200px] bg-black/50 rounded p-1.5 border border-white/10">
                        <p className={`text-[8px] font-medium text-white whitespace-nowrap overflow-hidden ${songTitle.length > 25 ? 'animate-marquee' : 'truncate'}`}>
                            {songTitle}
                        </p>
                        {/* Tiny badge */}
                        <span className="inline-flex items-center gap-[2px] px-1 py-[1px] mt-0.5 bg-red-600/30 border border-red-500/50 rounded text-[4px] text-red-300 font-medium">
                            <span className="w-[2px] h-[2px] bg-red-400 rounded-full animate-pulse"></span>
                            กำลังเล่น
                        </span>
                    </div>
                )}

                {/* Disconnect - smaller */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white text-[8px] font-medium rounded-full border border-white/20"
                >
                    ยกเลิกการเชื่อมต่อ
                </button>

            </div>

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee { animation: marquee 8s linear infinite; }
            `}</style>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
