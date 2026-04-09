import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MessageCircle, ArrowRight, Zap } from 'lucide-react';
import { useAuthStore } from '@/modules/auth/useAuthStore';

interface LineRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LineRequiredModal = ({ isOpen, onClose }: LineRequiredModalProps) => {
    const { signInWithLine } = useAuthStore();

    const handleConnect = () => {
        // v5.3.31: Official System Flow for Account Linking
        // This initiates the direct LINE OAuth flow with 'link_account' state
        // It is the fastest, safest, and original way we implemented.
        signInWithLine('link_account');
        onClose();
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[300]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-[40px] bg-white p-8 text-center transition-all border-4 border-zinc-100 shadow-2xl">
                            <div className="flex justify-end mb-2">
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-50 text-zinc-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6 inline-flex p-5 rounded-[2rem] bg-emerald-50 text-emerald-500 border-4 border-emerald-100">
                                <MessageCircle className="w-10 h-10" fill="currentColor" />
                            </div>

                            <h3 className="text-2xl font-black text-zinc-950 mb-3 tracking-tighter leading-tight">
                                เชื่อมต่อ LINE ทันที
                            </h3>

                            <p className="text-sm font-bold text-zinc-500 mb-8 leading-relaxed px-2">
                                จำเป็นต้องเชื่อมต่อ LINE เพื่อรับแจ้งเตือน <br/>
                                และจัดการสิทธิ์สมาชิกพรีเมียมครับ
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleConnect}
                                    className="w-full h-16 bg-[#06C755] text-white rounded-2xl font-black text-base flex items-center justify-center gap-3 active:scale-95 transition-all shadow-none border-none"
                                >
                                    <Zap size={20} fill="currentColor" className="text-emerald-200" />
                                    <span>เชื่อมต่อทันที</span>
                                    <ArrowRight size={20} strokeWidth={3} />
                                </button>
                                
                                <button
                                    onClick={onClose}
                                    className="w-full py-3 text-zinc-400 font-bold text-xs"
                                >
                                    ปิดหน้าต่าง
                                </button>
                            </div>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
