import { useState, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { QrCode, X, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from "@/modules/auth/useAuthStore";
import axios from 'axios';

interface OmiseQRModalProps {
    isOpen: boolean;
    onClose: () => void;
    pkg?: { id: string; name: string; price: number };
    onSuccess?: () => void;
}

export const OmiseQRModal = ({ isOpen, onClose, pkg, onSuccess }: OmiseQRModalProps) => {
    const { user } = useAuthStore();
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [chargeId, setChargeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'successful' | 'failed'>('pending');
    const [error, setError] = useState<string | null>(null);
    const pollInterval = useRef<NodeJS.Timeout | null>(null);

    // 1. Generate QR when Modal Opens
    useEffect(() => {
        if (isOpen && pkg && user) {
            generateQR();
        }
        return () => stopPolling();
    }, [isOpen, pkg]);

    // 2. Poll Status when Charge ID is set
    useEffect(() => {
        if (chargeId && paymentStatus === 'pending') {
            startPolling();
        }
        return () => stopPolling();
    }, [chargeId, paymentStatus]);

    const generateQR = async () => {
        if (!pkg || !user) return;
        setLoading(true);
        setError(null);
        setPaymentStatus('pending');
        setQrImage(null);

        try {
            const res = await axios.post('/api/payment/omise-charge', {
                amount: pkg.price,
                packageName: pkg.name,
                packageId: pkg.id,
                userId: user.uid
            });

            if (res.data.qrImage) {
                setQrImage(res.data.qrImage);
                setChargeId(res.data.chargeId);
            } else {
                setError("ไม่ได้รับ QR Code จากระบบ");
            }
        } catch (err: any) {
            console.error("QR Gen Error:", err);
            setError(err.response?.data?.error || "สร้างรายการชำระเงินไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const startPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);

        pollInterval.current = setInterval(async () => {
            if (!chargeId) return;
            try {
                const res = await axios.get(`/api/payment/omise-check-status?chargeId=${chargeId}`);
                const status = res.data.status;

                if (status === 'successful') {
                    setPaymentStatus('successful');
                    stopPolling();
                    // Wait a bit then close
                    setTimeout(() => {
                        if (onSuccess) onSuccess();
                        onClose();
                        // Ideally reload page or auth to reflect new status
                        window.location.reload();
                    }, 2000);
                } else if (status === 'failed' || status === 'expired') {
                    setPaymentStatus('failed');
                    stopPolling();
                }
            } catch (err) {
                console.warn("Polling Check Failed", err);
            }
        }, 3000); // Check every 3 seconds
    };

    const stopPolling = () => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[9999]" onClose={() => { stopPolling(); onClose(); }}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-[#1e1e24] p-6 text-left align-middle shadow-xl transition-all border border-white/10">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-white flex items-center gap-2">
                                        <QrCode className="w-5 h-5 text-primary" />
                                        สแกนจ่าย PromptPay
                                    </Dialog.Title>
                                    <button onClick={() => { stopPolling(); onClose(); }} className="text-gray-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex flex-col items-center justify-center min-h-[300px]">
                                    {loading ? (
                                        <div className="text-center py-10">
                                            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
                                            <p className="text-gray-400">กำลังสร้าง QR Code...</p>
                                        </div>
                                    ) : paymentStatus === 'successful' ? (
                                        <div className="text-center py-10 animate-in fade-in zoom-in">
                                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircle className="w-10 h-10 text-green-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-2">ชำระเงินสำเร็จ!</h3>
                                            <p className="text-gray-400">ระบบกำลังอัปเกรดสถานะของคุณ...</p>
                                        </div>
                                    ) : error ? (
                                        <div className="text-center py-10">
                                            <p className="text-red-400 mb-4">{error}</p>
                                            <button
                                                onClick={generateQR}
                                                className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition flex items-center gap-2 mx-auto"
                                            >
                                                <RefreshCw className="w-4 h-4" /> ลองใหม่
                                            </button>
                                        </div>
                                    ) : qrImage ? (
                                        <>
                                            <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
                                                <img src={qrImage} alt="PromptPay QR" className="w-48 h-48 object-contain" />
                                            </div>
                                            <p className="text-xl font-bold text-primary mb-1">฿{pkg?.price.toLocaleString()}</p>
                                            <p className="text-sm text-gray-400 mb-6 text-center">
                                                แอปธนาคารสแกนได้ทันที<br />
                                                <span className="text-xs opacity-70">(ระบบจะตรวจสอบยอดอัตโนมัติ)</span>
                                            </p>

                                            {/* Timer or Status Indicator */}
                                            <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full animate-pulse">
                                                <Loader2 className="w-3 h-3 animate-spin" /> กำลังรอการชำระเงิน...
                                            </div>
                                        </>
                                    ) : null}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
