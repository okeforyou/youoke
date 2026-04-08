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
        success: <Fragment><div className="bg-green-100 p-4 rounded-full"><Info className="w-10 h-10 text-green-600" /></div></Fragment>,
        info: <Info className="w-10 h-10 text-blue-500" />
    };

    const buttonStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
        success: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
        info: 'bg-gray-900 hover:bg-gray-800 focus:ring-gray-900'
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[1000]" onClose={hideConfirm}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-400"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-[1001] overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-400"
                            enterFrom="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-90"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-8 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] bg-white dark:bg-zinc-900 px-6 pb-6 pt-8 text-left transition-all sm:my-8 sm:w-full sm:max-w-sm border border-gray-100 dark:border-zinc-800">
                                <div>
                                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 dark:bg-zinc-950 border border-gray-100 dark:border-zinc-800 overflow-hidden">
                                        {icons[type || 'info']}
                                    </div>
                                    <div className="mt-8 text-center px-2">
                                        <Dialog.Title as="h3" className="text-2xl font-black leading-tight text-gray-900 dark:text-white tracking-tighter uppercase">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-10 flex flex-col gap-3">
                                    <button
                                        type="button"
                                        className={cn(
                                            "inline-flex w-full justify-center rounded-2xl px-5 py-4 text-base font-black text-white transition-all hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2",
                                            buttonStyles[type || 'info']
                                        )}
                                        onClick={handleConfirm}
                                    >
                                        {confirmText || 'ยืนยัน'}
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex w-full justify-center rounded-2xl bg-white dark:bg-zinc-800 px-5 py-4 text-sm font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
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
