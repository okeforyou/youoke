import React from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
            {/* DaisyUI Card Style - Cleaner */}
            <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200 overflow-hidden">
                <div className="card-body p-6 text-center items-center">

                    {/* Icon */}
                    <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-2">
                        <ExclamationTriangleIcon className="w-8 h-8 text-error" />
                    </div>

                    <h3 className="card-title text-lg font-bold">ตัดการเชื่อมต่อ?</h3>
                    <p className="text-base-content/70 text-sm">
                        คุณต้องการเลิกเชื่อมต่อกับ <b>{deviceName}</b> ใช่หรือไม่?
                        <br />
                        การเล่นวิดีโอจะถูกหยุดทันที
                    </p>

                    <div className="card-actions justify-center w-full mt-4 gap-3">
                        <button onClick={onClose} className="btn btn-ghost flex-1">
                            ยกเลิก
                        </button>
                        <button onClick={onConfirm} className="btn btn-error text-white flex-1">
                            ยืนยัน
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
