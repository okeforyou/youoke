import React from 'react';
import { Monitor, Wifi, X, Tv, Cast } from 'lucide-react';

export type CastMode = 'none' | 'smarttv' | 'dual' | 'webmonitor' | 'google' | 'youtube';

interface CastStatusBarProps {
    mode: CastMode;
    roomCode?: string | null;
    onDisconnect: () => void;
}

const CAST_CONFIG: Record<CastMode, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    none: { icon: null, label: '', color: '', bg: '' },
    smarttv: {
        icon: <Tv size={14} />,
        label: '📡 Web Video Caster',
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    dual: {
        icon: <Monitor size={14} />,
        label: '🖥️ Dual Screen (HDMI)',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20'
    },
    webmonitor: {
        icon: <Wifi size={14} />,
        label: '📱 Web Monitor (QR)',
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20'
    },
    google: {
        icon: <Cast size={14} />,
        label: '📺 Google Cast',
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/20'
    },
    youtube: {
        icon: <Tv size={14} />,
        label: '▶️ YouTube App',
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20'
    }
};

export const CastStatusBar: React.FC<CastStatusBarProps> = ({ mode, roomCode, onDisconnect }) => {
    if (mode === 'none') return null;

    const config = CAST_CONFIG[mode];

    return (
        <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-full border ${config.bg} backdrop-blur-xl text-xs font-bold select-none transition-all duration-500 animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex items-center gap-2 ${config.color}`}>
                {config.icon}
                <span>{config.label}</span>
                {roomCode && (
                    <span className="text-white/40 font-mono">
                        • Room {roomCode}
                    </span>
                )}
            </div>
            <button
                onClick={onDisconnect}
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors"
                title="ตัดการเชื่อมต่อ"
            >
                <X size={12} strokeWidth={3} />
            </button>
        </div>
    );
};
