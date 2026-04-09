import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, MessageCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/router';

interface LineRequiredModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LineRequiredModal = ({ isOpen, onClose }: LineRequiredModalProps) => {
    const router = useRouter();

    const handleConnect = () => {
        onClose();
        router.push('/');
        // Note: The parent drawer will handle switching to connection view
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
                        <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-[40px] bg-white p-8 text-center transition-all border-4 border-zinc-100">
                            <div className="flex justify-end mb-2">
                                <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-50 text-zinc-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mb-6 inline-flex p-5 rounded-[2rem] bg-emerald-50 text-emerald-500 border-4 border-emerald-100 animate-pulse">
                                <MessageCircle className="w-10 h-10" fill="currentColor" />
                            </div>

                            <h3 className="text-2xl font-black text-zinc-950 mb-3 tracking-tighter leading-tight">
                                ต้องเชื่อมต่อ LINE <br/>ก่อนสมัครสมาชิก
                            </h3>

                            <p className="text-sm font-bold text-zinc-500 mb-8 leading-relaxed">
                                เพื่อให้ระบบสามารถแจ้งเตือนวันหมดอายุ <br/>
                                และส่งข้อมูล VIP ให้คุณได้ผ่านช่องทาง LINE ครับ
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={handleConnect}
                                    className="w-full h-14 bg-[#06C755] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all"
                                >
                                    <span>ไปที่หน้าเชื่อมต่อ LINE</span>
                                    <ArrowRight size={18} strokeWidth={3} />
                                </button>
                                
                                <button
                                    onClick={onClose}
                                    className="w-full h-14 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-sm flex items-center justify-center active:scale-95 transition-all"
                                >
                                    ไว้วันหลัง
                                </button>
                            </div>

                            <p className="mt-6 text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
                                มั่นใจ ปลอดภัย ด้วยระบบ LINE Official 100%
                            </p>
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
