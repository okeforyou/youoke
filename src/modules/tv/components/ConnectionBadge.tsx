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
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-xl",
            isLocal
                ? "bg-yellow-950 text-yellow-400 border-yellow-500/30"
                : "bg-blue-950 text-blue-400 border-blue-500/30",
            className
        )}>
            {isLocal ? (
                <BoltIcon className="w-3 h-3" />
            ) : (
                <GlobeAltIcon className="w-3 h-3" />
            )}
        </div>
    );
};
