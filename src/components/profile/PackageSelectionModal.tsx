import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShieldCheck } from 'lucide-react';
import { PackageStore } from './PackageStore';

interface PackageSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PackageSelectionModal = ({ isOpen, onClose }: PackageSelectionModalProps) => {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[200]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-background px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 border border-white/10">

                                {/* Close Button */}
                                <div className="absolute right-4 top-4">
                                    <button
                                        type="button"
                                        className="rounded-full bg-muted p-2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <X className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="mt-3 sm:mt-5">
                                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-foreground text-center mb-2">
                                        อัพเกรดสมาชิก Premium
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-muted-foreground text-center mb-8 max-w-lg mx-auto">
                                            ปลดล็อคขีดจำกัดการร้องเพลงของคุณ เข้าถึงคลังเพลงกว่า 100,000 เพลง พร้อมฟีเจอร์ระดับ Pro
                                        </p>

                                        {/* Trust Badges */}
                                        <div className="flex justify-center gap-6 mb-8 text-xs text-muted-foreground font-medium">
                                            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-green-500" /> ชำระเงินปลอดภัย 100%</div>
                                            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-500" /> ยกเลิกได้ตลอดเวลา</div>
                                        </div>

                                        {/* Packages Grid */}
                                        <PackageStore />
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
