import { Dialog, Transition } from '@headlessui/react';
import { AlertTriangle, Info, Loader2, X } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';
import ConfirmationSheet from './ConfirmationSheet';

function useIsMobile() {
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    return isMobile;
}

type ModalType = 'danger' | 'warning' | 'info';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: ModalType;
    isLoading?: boolean;
    children?: React.ReactNode;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'danger',
    isLoading = false,
    children,
}: Props) {
    const isMobile = useIsMobile();

    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    iconBg: 'bg-rose-50 text-rose-600 ring-rose-100/50',
                    confirmBtn: 'bg-rose-600 hover:bg-rose-700 hover:shadow-rose-600/20 text-white',
                };
            case 'warning':
                return {
                    iconBg: 'bg-amber-50 text-amber-600 ring-amber-100/50',
                    confirmBtn: 'bg-amber-600 hover:bg-amber-700 hover:shadow-amber-600/20 text-white',
                };
            case 'info':
            default:
                return {
                    iconBg: 'bg-indigo-50 text-indigo-600 ring-indigo-100/50',
                    confirmBtn: 'bg-[#1F6FDB] hover:bg-slate-800 hover:shadow-blue-500/20 text-white',
                };
        }
    };

    const colors = getColors();

    return (
        <>
            {/* Desktop Confirmation Modal */}
            <Transition.Root show={isOpen && !isMobile} as={Fragment}>
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
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
                    </Transition.Child>

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                enterTo="opacity-100 translate-y-0 sm:scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            >
                                <Dialog.Panel className="relative transform overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white p-8 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-10">
                                    <div className="absolute top-6 right-6">
                                        <button
                                            type="button"
                                            className="rounded-full bg-slate-50 p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Close</span>
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-center text-center">
                                        {/* Icon wrapper */}
                                        <div
                                            className={`flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-50 ring-4 ${colors.iconBg}`}
                                        >
                                            {type === 'info' ? (
                                                <Info className="h-7 w-7" aria-hidden="true" />
                                            ) : (
                                                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
                                            )}
                                        </div>
                                        <div className="mt-6">
                                            <Dialog.Title as="h3" className="text-xl font-black tracking-tight text-slate-900">
                                                {title}
                                            </Dialog.Title>
                                            <div className="mt-3">
                                                <p className="text-sm leading-relaxed font-semibold text-slate-400">{message}</p>
                                                {children && <div className="mt-4">{children}</div>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse sm:gap-4">
                                        <button
                                            type="button"
                                            disabled={isLoading}
                                            className={`inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] px-8 py-4.5 text-xs font-black tracking-wider uppercase shadow-xl transition-all active:scale-95 disabled:opacity-50 sm:w-auto ${colors.confirmBtn}`}
                                            onClick={onConfirm}
                                        >
                                            {isLoading && <Loader2 className="h-4.5 w-4.5 animate-spin" />}
                                            {confirmLabel}
                                        </button>
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-[1.5rem] bg-slate-50 px-8 py-4.5 text-xs font-black tracking-wider text-slate-500 uppercase transition-all hover:bg-slate-100 active:scale-95 sm:w-auto"
                                            onClick={onClose}
                                        >
                                            {cancelLabel}
                                        </button>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Mobile Confirmation Sheet */}
            <ConfirmationSheet
                isOpen={isOpen && isMobile}
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                type={type}
                isLoading={isLoading}
            >
                {children}
            </ConfirmationSheet>
        </>
    );
}
