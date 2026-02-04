import React, { useState } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import { TvIcon, ComputerDesktopIcon, XMarkIcon } from '@heroicons/react/24/solid';
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
        <div className="relative w-full aspect-video bg-base-300 flex items-center justify-center">

            {/* Center Card - Symmetric Layout */}
            <div className="bg-base-100 rounded-2xl shadow-xl border border-base-200 p-6 text-center w-full max-w-xs mx-4">

                {/* Icon + Status */}
                <div className="flex flex-col items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                        {isCasting ? (
                            <TvIcon className="w-7 h-7 text-primary" />
                        ) : (
                            <ComputerDesktopIcon className="w-7 h-7 text-primary" />
                        )}
                    </div>
                    <div>
                        <p className="text-xs text-base-content/50">
                            {isCasting ? 'เชื่อมต่อจอทีวี' : 'หน้าจอที่ 2'}
                        </p>
                        <p className="text-lg font-bold text-base-content">
                            ห้อง {roomCode}
                        </p>
                    </div>
                </div>

                {/* Now Playing (small) */}
                {currentVideo && (
                    <div className="flex items-center gap-3 bg-base-200 rounded-lg p-2 mb-4">
                        {thumbnailUrl && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                                <Image
                                    src={thumbnailUrl}
                                    alt="Thumbnail"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>
                        )}
                        <div className="text-left min-w-0 flex-1">
                            <p className="text-[10px] text-base-content/40">กำลังเล่น</p>
                            <p className="text-xs text-base-content line-clamp-2">
                                {currentVideoTitle || currentVideo.title}
                            </p>
                        </div>
                    </div>
                )}

                {/* Disconnect Button */}
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="btn btn-sm btn-outline btn-error w-full gap-2"
                >
                    <XMarkIcon className="w-4 h-4" />
                    ตัดการเชื่อมต่อ
                </button>
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
