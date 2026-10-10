import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, type ReactNode } from 'react';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    size?: 'md' | 'lg' | 'xl';
    children: ReactNode;
    /** Pinned under the content, for the main actions. */
    footer?: ReactNode;
};

const widths = { md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' } as const;

/** A centred dialog in the Zeus dark style. Zeus is used on desktop, so this is a real modal, not a bottom sheet. */
export default function ZeusModal({ isOpen, onClose, title, subtitle, size = 'lg', children, footer }: Props) {
    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[200]">
                <TransitionChild
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
                </TransitionChild>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-6">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-2 scale-[0.98]"
                            enterTo="opacity-100 translate-y-0 scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 scale-100"
                            leaveTo="opacity-0 translate-y-2 scale-[0.98]"
                        >
                            <DialogPanel
                                className={`relative flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-[#0f1423] shadow-2xl ${widths[size]}`}
                            >
                                <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 px-6 py-5">
                                    <div className="min-w-0">
                                        <DialogTitle as="h2" className="text-lg leading-snug font-bold break-words text-white">
                                            {title}
                                        </DialogTitle>
                                        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="Close"
                                        className="-mt-1 -mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

                                {footer && <div className="border-t border-slate-800/80 bg-black/10 px-6 py-4">{footer}</div>}
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
