import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useUIStore } from '../../stores/useUIStore';
import { AlertTriangle, Info, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export const GlobalConfirmModal = () => {
    const { confirmModal, hideConfirm } = useUIStore();
    const { isOpen, title, message, confirmText, cancelText, type, onConfirm } = confirmModal;

    const handleConfirm = () => {
        onConfirm();
        hideConfirm();
    };

    const icons = {
        danger: <AlertTriangle className="w-10 h-10 text-red-500" />,
        warning: <AlertTriangle className="w-10 h-10 text-amber-500" />,
        info: <Info className="w-10 h-10 text-blue-500" />
    };

    const buttonStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        info: 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-900'
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={hideConfirm}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white px-4 pb-4 pt-5 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-8">
                                <div>
                                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 border border-gray-100 shadow-inner">
                                        {icons[type || 'info']}
                                    </div>
                                    <div className="mt-6 text-center">
                                        <Dialog.Title as="h3" className="text-xl font-black leading-6 text-gray-900">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 font-medium px-4">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        className={cn(
                                            "inline-flex w-full justify-center rounded-2xl px-3 py-4 text-base font-bold text-white shadow-lg transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2",
                                            buttonStyles[type || 'info']
                                        )}
                                        onClick={handleConfirm}
                                    >
                                        {confirmText || 'ยืนยัน'}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-2xl bg-white px-3 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors focus:outline-none ring-1 ring-inset ring-gray-100 hover:bg-gray-50"
                                        onClick={hideConfirm}
                                    >
                                        {cancelText || 'ยกเลิก'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};
