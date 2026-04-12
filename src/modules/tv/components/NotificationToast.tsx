import React from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface NotificationToastProps {
    message: string | undefined;
    sub: string | undefined;
    isVisible: boolean;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, sub, isVisible }) => {
    return (
        <div className={clsx(
            "absolute top-6 right-6 z-50 transition-all duration-500 ease-out",
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0 pointer-events-none"
        )}>
            <div className="bg-stone-900 border border-white/20 p-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[260px]">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <MusicalNoteIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">{message}</p>
                    <p className="text-white font-bold text-base leading-none truncate max-w-[180px]">{sub}</p>
                </div>
            </div>
        </div>
    );
};
