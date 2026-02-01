import React from 'react';
import { useFirebaseCast } from '../context/FirebaseCastContext';
import {
    PlayIcon,
    PauseIcon,
    ForwardIcon,
    SpeakerWaveIcon,
    SpeakerXMarkIcon,
    BackwardIcon
} from '@heroicons/react/24/solid';

interface HostControllerProps {
    isCasting: boolean;
    isDualMode: boolean;
    roomCode: string;
    onDisconnect: () => void;
    currentVideoTitle?: string;
}



const HostController: React.FC<HostControllerProps> = ({
    isCasting,
    isDualMode,
    roomCode,
    onDisconnect,
    currentVideoTitle
    currentVideoTitle
}) => {
    // Logic Helper: Determine which Disconnect action to take
    const handleDisconnectClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDisconnect();
    };

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
            {/* Background (Optional: Could be a blurred thumbnail if we passed it, currently Slate 900 per request) */}
            <div className="absolute inset-0 bg-slate-900" />

            {/* Controller Overlay - Exact Replica of Original UI */}
            <div className="absolute inset-0 z-[10] h-full w-full flex flex-col items-center justify-center text-center p-6">

                {/* Animated Icon */}
                <div className="text-4xl md:text-5xl mb-4 animate-pulse">
                    {isCasting ? '📺' : '🖥️'}
                </div>

                {/* Status Text - Original Design */}
                <h2 className="text-lg md:text-xl font-bold mb-2 text-white">
                    {isCasting
                        ? `กำลังเล่นบน Smart TV (ห้อง: ${roomCode || '...'})`
                        : 'กำลังเล่นที่หน้าจอที่ 2'}
                </h2>

                <p className="text-xs md:text-sm text-gray-400 mb-6 max-w-md mx-auto">
                    {currentVideoTitle
                        ? <span className="text-primary font-medium block mb-1">กำลังเล่น: {currentVideoTitle}</span>
                        : (isCasting ? 'ควบคุมการเล่นผ่านหน้าจอนี้' : 'วิดีโอกำลังเล่นบนหน้าจอ Dual Screen')
                    }
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 items-center">

                    {isDualMode && (
                        <button
                            onClick={handleDisconnectClick}
                            className="btn btn-sm btn-outline btn-error rounded-full px-6 hover:scale-105 transition-all shadow-lg"
                        >
                            ปิดโหมด 2 หน้าจอ
                        </button>
                    )}

                    {isCasting && (
                        <button
                            onClick={handleDisconnectClick}
                            className="btn btn-sm btn-error w-auto min-w-[120px] rounded-full px-6 hover:scale-105 transition-all shadow-lg"
                        >
                            ตัดการเชื่อมต่อ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HostController;
