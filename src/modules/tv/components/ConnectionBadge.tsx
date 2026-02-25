import React from 'react';
import { BoltIcon, GlobeAltIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';

interface ConnectionBadgeProps {
    mode: 'local' | 'remote';
    className?: string;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ mode, className }) => {
    const isLocal = mode === 'local';

    return (
        <div className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border shadow-xl transition-all duration-500",
            isLocal
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-yellow-500/10"
                : "bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-blue-500/10",
            className
        )}>
            {isLocal ? (
                <BoltIcon className="w-3 h-3 animate-pulse" />
            ) : (
                <GlobeAltIcon className="w-3 h-3 animate-spin-slow" />
            )}
        </div>
    );
};
