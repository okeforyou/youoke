import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import { XMarkIcon, TvIcon } from '@heroicons/react/24/solid';
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
        ? `https://i.ytimg.com/vi/${currentVideo.videoId}/mqdefault.jpg`
        : null;

    return (
        <div className="relative w-full aspect-video bg-neutral-900 overflow-hidden select-none flex flex-col">

            {/* Header */}
            <div className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <TvIcon className="w-5 h-5 text-primary" />
                    <h1 className="text-lg font-bold text-white">โหมด DJ 2 หน้าจอ ทำงานอยู่</h1>
                </div>
                <p className="text-xs text-white/50">วิดีโอกำลังเล่นบนจอแยก (Clean Feed)</p>
            </div>

            {/* Now Playing */}
            <div className="px-4 pb-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800 border border-neutral-700">
                    {thumbnailUrl ? (
                        <div className="relative w-16 h-12 rounded overflow-hidden flex-shrink-0">
                            <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                        </div>
                    ) : (
                        <div className="w-16 h-12 rounded bg-neutral-700 flex items-center justify-center text-white/30">🎵</div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {currentVideoTitle || currentVideo?.title || 'รอเพลงถัดไป...'}
                        </p>
                        <p className="text-xs text-white/50 mt-0.5">กำลังเล่น</p>
                    </div>
                    <button
                        onClick={() => setIsDisconnectModalOpen(true)}
                        className="px-3 py-1.5 text-xs bg-error/20 text-error hover:bg-error/30 rounded transition-colors"
                    >
                        หยุด
                    </button>
                </div>
            </div>

            {/* Room Code Badge */}
            <div className="px-4 pb-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                    <span className="text-xs text-primary font-medium">ห้อง {roomCode}</span>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Footer hint */}
            <div className="p-3 text-center border-t border-neutral-800">
                <p className="text-[10px] text-white/30">ควบคุมการเล่นจากหน้าจอนี้</p>
            </div>

            <DisconnectModal
                isOpen={isDisconnectModalOpen}
                onClose={() => setIsDisconnectModalOpen(false)}
                onConfirm={() => { setIsDisconnectModalOpen(false); onDisconnect(); }}
            />
        </div>
    );
};
