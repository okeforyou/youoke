import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "ยืนยัน",
    cancelText = "ยกเลิก",
    type = 'warning',
    isLoading = false
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
        warning: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100",
        info: "bg-slate-800 hover:bg-slate-900 shadow-slate-100"
    };

    const iconColors = {
        danger: "text-red-600 bg-red-50",
        warning: "text-indigo-600 bg-indigo-50",
        info: "text-slate-600 bg-slate-50"
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200" 
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-2xl shadow-slate-900/10 overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
                <div className="p-6 sm:p-8">
                    {/* Header with Icon */}
                    <div className="flex items-start justify-between mb-5">
                        <div className={cn("p-3 rounded-2xl flex-shrink-0", iconColors[type])}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        {!isLoading && (
                            <button 
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Text Body */}
                    <div className="mb-8">
                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                            {title}
                        </h3>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            disabled={isLoading}
                            onClick={onClose}
                            className="flex-1 px-6 py-3.5 bg-slate-50 text-slate-600 font-bold text-sm rounded-2xl hover:bg-slate-100 border border-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            disabled={isLoading}
                            onClick={onConfirm}
                            className={cn(
                                "flex-1 px-6 py-3.5 text-white font-bold text-sm rounded-2xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50",
                                colors[type]
                            )}
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
