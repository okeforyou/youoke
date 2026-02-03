import React from 'react';
import { XMarkIcon, TvIcon } from '@heroicons/react/24/solid';

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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-base-100 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
                {/* Header */}
                <div className="bg-base-200 p-4 flex items-center justify-between border-b border-base-300">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <TvIcon className="w-5 h-5 text-primary" />
                        ตัดการเชื่อมต่อ
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="mb-4 text-4xl">🔌</div>
                    <p className="text-gray-600 mb-6">
                        คุณต้องการเลิกเชื่อมต่อกับ <b>{deviceName}</b> ใช่หรือไม่? <br />
                        <span className="text-xs text-gray-400">เพลงที่เล่นอยู่จะหยุดทันที</span>
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="btn btn-ghost flex-1"
                        >
                            ยกเลิก
                        </button>
                        <button
                            onClick={onConfirm}
                            className="btn btn-error flex-1 text-white"
                        >
                            ยืนยันการตัดการเชื่อมต่อ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
