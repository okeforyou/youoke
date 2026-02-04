import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DisconnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    deviceName?: string;
}

export const DisconnectModal: React.FC<DisconnectModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    deviceName = "TV"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            {/* Custom Dark Theme Card to match Host UI */}
            <div className="w-full max-w-xs bg-[#111] border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-6 text-center flex flex-col items-center">

                    {/* Icon */}
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">ตัดการเชื่อมต่อ?</h3>
                    <p className="text-white/60 text-sm mb-6 leading-relaxed">
                        ต้องการเลิกเชื่อมต่อกับ <b className="text-white">{deviceName}</b><br />
                        และหยุดการเล่นทันทีหรือไม่?
                    </p>

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-bold shadow-lg shadow-red-900/20"
                        >
                            ยืนยัน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
