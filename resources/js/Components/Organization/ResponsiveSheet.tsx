import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment } from 'react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    theme?: 'light' | 'dark' | 'auto';
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export default function ResponsiveSheet({ isOpen, onClose, title, children, theme = 'light', maxWidth = 'md' }: Props) {
    const isLight = theme === 'light';

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
        '3xl': 'sm:max-w-3xl',
        '4xl': 'sm:max-w-4xl',
        '5xl': 'sm:max-w-5xl',
    }[maxWidth];

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

                <div className="fixed inset-0 overflow-x-hidden overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center sm:items-center sm:p-4">
                        <TransitionChild
                            as={Fragment}
                            enter="transform transition ease-out duration-300"
                            enterFrom="translate-y-full sm:translate-y-4 sm:scale-95 sm:opacity-0"
                            enterTo="translate-y-0 sm:scale-100 sm:opacity-100"
                            leave="transform transition ease-in duration-200"
                            leaveFrom="translate-y-0 sm:scale-100 sm:opacity-100"
                            leaveTo="translate-y-full sm:translate-y-4 sm:scale-95 sm:opacity-0"
                        >
                            <DialogPanel
                                className={`pb-safe relative mx-auto flex max-h-[90vh] w-full flex-col rounded-t-[2.5rem] bg-white pt-2 shadow-2xl ring-1 ring-black/5 sm:rounded-2xl sm:pt-0 ${maxWidthClass} ${isLight ? '' : 'dark:bg-slate-900'}`}
                            >
                                {/* Mobile Grabber Handle (hidden on sm) */}
                                <div className="flex justify-center p-2 sm:hidden">
                                    <div className={`h-1.5 w-12 rounded-full bg-slate-200 ${isLight ? '' : 'dark:bg-slate-800'}`} />
                                </div>

                                {/* Title Bar */}
                                {title && (
                                    <div className="flex items-center justify-between px-6 py-4 sm:border-b sm:border-slate-100 sm:px-6 sm:py-5">
                                        <h3
                                            className={`text-xl font-black tracking-tight text-slate-900 sm:text-lg sm:font-bold ${isLight ? '' : 'dark:text-white'}`}
                                        >
                                            {title}
                                        </h3>
                                        <button
                                            onClick={onClose}
                                            className={`flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 active:scale-90 sm:h-8 sm:w-8 sm:bg-transparent sm:hover:bg-slate-100 sm:hover:text-slate-600 ${isLight ? '' : 'dark:bg-slate-800 dark:text-slate-500'}`}
                                        >
                                            <X className="h-5 w-5 sm:h-4 sm:w-4" />
                                        </button>
                                    </div>
                                )}
                                {!title && (
                                    <div className="absolute top-4 right-4 z-10 hidden sm:block">
                                        <button
                                            onClick={onClose}
                                            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
