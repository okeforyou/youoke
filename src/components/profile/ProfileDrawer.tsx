import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ProfileContent } from './ProfileContent';

interface ProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-500"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-500"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 transition-opacity backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden flex items-end sm:items-stretch sm:justify-end">
                        <div className="pointer-events-none fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto flex max-w-full">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-500"
                                enterFrom="translate-y-full sm:translate-y-0 sm:translate-x-full"
                                enterTo="translate-y-0 sm:translate-x-0"
                                leave="transform transition ease-in-out duration-500"
                                leaveFrom="translate-y-0 sm:translate-x-0"
                                leaveTo="translate-y-full sm:translate-y-0 sm:translate-x-full"
                            >
                                <Dialog.Panel className="pointer-events-auto w-full sm:w-screen sm:max-w-sm">
                                    <div className="flex h-[92vh] sm:h-full flex-col overflow-hidden bg-white shadow-2xl relative rounded-t-[32px] sm:rounded-t-none">
                                        {/* Mobile Grab Handle */}
                                        <div className="sm:hidden flex justify-center pt-3 pb-1 bg-white">
                                            <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                                        </div>

                                        {/* Header */}
                                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-[110]">
                                            <Dialog.Title className="text-lg font-bold text-gray-900">
                                                โปรไฟล์ของฉัน
                                            </Dialog.Title>
                                            <button
                                                type="button"
                                                className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
                                                onClick={onClose}
                                            >
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                                            <ProfileContent />
                                        </div>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
