import React, { useState, useEffect } from 'react';
import { useFirebaseCast } from '../../../../context/FirebaseCastContext';
import { DisconnectModal } from './DisconnectModal';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    BackwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    TvIcon,
    ComputerDesktopIcon
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

    useEffect(() => {
        if (state.controls.volume !== undefined) {
            setLocalVolume(state.controls.volume);
        }
    }, [state.controls.volume]);

    return (
        <div className="flex flex-col h-full bg-base-100">

            {/* Simple Header */}
            <div className="px-4 py-3 border-b border-base-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                    {isCasting ? (
                        <TvIcon className="w-4 h-4 text-primary" />
                    ) : (
                        <ComputerDesktopIcon className="w-4 h-4 text-primary" />
                    )}
                    <span className="text-base-content/60">
                        {isCasting ? 'เชื่อมต่อ TV' : 'หน้าจอที่ 2'}
                    </span>
                    <span className="font-bold text-base-content">ห้อง {roomCode}</span>
                </div>
                <button
                    onClick={() => setIsDisconnectModalOpen(true)}
                    className="text-xs text-error hover:underline"
                >
                    ตัดการเชื่อมต่อ
                </button>
            </div>

            {/* Now Playing Info */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                {currentVideoTitle ? (
                    <div className="max-w-sm">
                        <p className="text-xs text-base-content/40 mb-2">กำลังเล่น</p>
                        <h2 className="text-base font-medium text-base-content line-clamp-2">
                            {currentVideoTitle}
                        </h2>
                    </div>
                ) : (
                    <p className="text-sm text-base-content/40">รอเพลง...</p>
                )}
            </div>

            {/* Simple Controls */}
            <div className="px-4 py-4 border-t border-base-200">
                {/* Playback */}
                <div className="flex items-center justify-center gap-4 mb-3">
                    <button onClick={previous} className="btn btn-ghost btn-sm btn-circle">
                        <BackwardIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={state.controls.isPlaying ? pause : play}
                        className="btn btn-primary btn-circle"
                    >
                        {state.controls.isPlaying ? (
                            <PauseIcon className="w-6 h-6" />
                        ) : (
                            <PlayIcon className="w-6 h-6 ml-0.5" />
                        )}
                    </button>
                    <button onClick={next} className="btn btn-ghost btn-sm btn-circle">
                        <ForwardIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Volume */}
                <div className="flex items-center gap-2 max-w-xs mx-auto">
                    <button onClick={toggleMute} className="btn btn-ghost btn-xs btn-circle">
                        {state.controls.isMuted ? (
                            <SpeakerXMarkIcon className="w-4 h-4 text-error" />
                        ) : (
                            <SpeakerWaveIcon className="w-4 h-4" />
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
