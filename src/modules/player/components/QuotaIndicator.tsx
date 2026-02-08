import React from 'react';
import { Sparkles, BarChart2 } from 'lucide-react';
import clsx from 'clsx';

interface QuotaIndicatorProps {
    current: number;
    max: number;
    className?: string;
}

export const QuotaIndicator = ({ current, max, className }: QuotaIndicatorProps) => {
    // Calculate percentage for progress
    const percent = Math.min((current / max) * 100, 100);
    const isNearLimit = percent >= 80;

    return (
        <div className={clsx("flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-lg transition-all duration-300 hover:bg-black/70 group cursor-pointer", className)}>
            <div className="flex items-center gap-1.5">
                <div className={clsx("w-2 h-2 rounded-full animate-pulse", isNearLimit ? "bg-red-500" : "bg-green-500")} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white transition-colors">Free Plan</span>
            </div>

            <div className="w-[1px] h-3 bg-white/20" />

            <div className="flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-white/50" />
                <span className="text-xs font-medium text-white tabular-nums">
                    <span className={isNearLimit ? "text-red-400 font-bold" : "text-white"}>{current}</span>
                    <span className="text-white/40 mx-[1px]">/</span>
                    <span className="text-white/60">{max}</span>
                </span>
                <span className="text-[10px] text-white/40 hidden sm:inline-block">Songs</span>
            </div>
        </div>
    );
};
