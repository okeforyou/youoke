import React, { useState, useEffect } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    BackwardIcon,
    XMarkIcon
} from '@heroicons/react/24/solid';

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
    const {
        play, pause, next, previous,
        toggleMute, setVolume,
        state
    } = useFirebaseCast();

    const [localVolume, setLocalVolume] = useState(state.controls.volume ?? 100);
    const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

    const videoId = state.currentVideo?.videoId || '';
    const thumbnailUrl = videoId
        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        : '';

    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="w-full h-full bg-base-200 flex flex-col">

            {/* Top: Cancel button */}
            <div className="flex justify-end p-3">
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="text-base-content/50 hover:text-error text-sm flex items-center gap-1"
                >
                    <XMarkIcon className="w-4 h-4" />
                    ยกเลิก
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">

                {/* Thumbnail Card */}
                <div className="relative mb-6">
                    {thumbnailUrl ? (
                        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-xl bg-base-300">
                            <img
                                src={thumbnailUrl}
                                alt="cover"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-2xl bg-base-300 flex items-center justify-center">
                            <span className="text-base-content/30 text-4xl">♪</span>
                        </div>
                    )}

                    {/* Playing indicator */}
                    {state.controls.isPlaying && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-success text-success-content text-xs px-3 py-1 rounded-full">
                            กำลังเล่น
                        </div>
                    )}
                </div>

                {/* Room Info */}
                <div className="text-center mb-4">
                    <p className="text-base-content/50 text-sm mb-1">เชื่อมต่อหน้าจอที่ 2</p>
                    <p className="text-base-content text-2xl font-bold">ห้อง {roomCode}</p>
                </div>

                {/* Song Title */}
                {currentVideoTitle && (
                    <p className="text-base-content/60 text-sm text-center line-clamp-2 max-w-xs mb-4">
                        {currentVideoTitle}
                    </p>
                )}
            </div>

            {/* Control Deck */}
            <div className="bg-base-100 p-4 sm:p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
                {/* Main Controls */}
                <div className="flex items-center justify-center gap-6 sm:gap-8 mb-4">
                    <button
                        onClick={previous}
                        className="btn btn-circle btn-ghost btn-lg"
                    >
                        <BackwardIcon className="w-7 h-7" />
                    </button>

                    <button
                        onClick={state.controls.isPlaying ? pause : play}
                        className="btn btn-circle btn-primary btn-lg w-16 h-16 sm:w-20 sm:h-20"
                    >
                        {state.controls.isPlaying ? (
                            <PauseIcon className="w-8 h-8 sm:w-10 sm:h-10" />
                        ) : (
                            <PlayIcon className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />
                        )}
                    </button>

                    <button
                        onClick={next}
                        className="btn btn-circle btn-ghost btn-lg"
                    >
                        <ForwardIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-3 max-w-sm mx-auto">
                    <button
                        onClick={toggleMute}
                        className="btn btn-circle btn-ghost btn-sm"
                    >
                        {state.controls.isMuted ? (
                            <SpeakerXMarkIcon className="w-5 h-5 text-error" />
                        ) : (
                            <SpeakerWaveIcon className="w-5 h-5" />
                        )}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={localVolume}
                        className="range range-primary range-xs flex-1"
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setLocalVolume(val);
                            setVolume(val);
                        }}
                    />
                    <span className="text-base-content/50 text-xs w-8 text-right">{localVolume}%</span>
                </div>
            </div>

            {/* Disconnect Modal */}
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
