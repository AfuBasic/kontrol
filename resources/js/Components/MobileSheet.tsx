import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
}

export default function MobileSheet({ isOpen, onClose, title, children }: Props) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[100]">
                {/* Backdrop */}
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-hidden">
                    <div className="flex min-h-full items-end justify-center">
                        <TransitionChild
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="translate-y-full"
                            enterTo="translate-y-0"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-y-0"
                            leaveTo="translate-y-full"
                        >
                            <DialogPanel className="pb-safe relative mx-auto flex max-h-[90vh] w-full flex-col rounded-t-[2.5rem] bg-white dark:bg-slate-900 pt-2 shadow-2xl ring-1 ring-black/5 sm:max-w-xl md:max-w-2xl">
                                {/* Grabber Handle */}
                                <div className="flex justify-center p-2">
                                    <div className="h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                                </div>

                                {/* Title Bar */}
                                {title && (
                                    <div className="flex items-center justify-between px-6 py-4">
                                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h3>
                                        <button
                                            onClick={onClose}
                                            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 active:scale-90"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto px-4 pb-8">{children}</div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
