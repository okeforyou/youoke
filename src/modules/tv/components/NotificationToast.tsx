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
            "absolute top-8 right-8 z-50 transition-all duration-500 ease-out",
            isVisible ? "translate-y-0 opacity-100" : "-translate-y-8 opacity-0 pointer-events-none"
        )}>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px]">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/30 animate-bounce">
                    <MusicalNoteIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">{message}</p>
                    <p className="text-white font-bold text-lg leading-none truncate max-w-[200px]">{sub}</p>
                </div>
            </div>
        </div>
    );
};
