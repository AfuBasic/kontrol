import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Fragment } from 'react';

type SheetType = 'danger' | 'warning' | 'info';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: SheetType;
    isLoading?: boolean;
    children?: React.ReactNode;
}

export default function ConfirmationSheet({
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
    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    iconBg: 'bg-rose-50 text-rose-600 ring-rose-100',
                    confirmBtn: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
                };
            case 'warning':
                return {
                    iconBg: 'bg-amber-50 text-amber-600 ring-amber-100',
                    confirmBtn: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800',
                };
            case 'info':
            default:
                return {
                    iconBg: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
                    confirmBtn: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
                };
        }
    };

    const colors = getColors();

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-[200] md:hidden">
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

                {/* Sheet Panel Container */}
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
                            <DialogPanel className="pb-safe relative flex max-h-[90vh] w-full flex-col rounded-t-[2.5rem] bg-white pt-2 shadow-2xl ring-1 ring-black/5">
                                {/* Grabber Handle */}
                                <div className="flex justify-center p-2">
                                    <div className="h-1.5 w-12 rounded-full bg-slate-200" />
                                </div>

                                {/* Confirmation Details */}
                                <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
                                    {/* Icon */}
                                    <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-50 ring-4 ${colors.iconBg}`}>
                                        {type === 'danger' || type === 'warning' ? (
                                            <AlertTriangle className="h-7 w-7" />
                                        ) : (
                                            <Info className="h-7 w-7" />
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-black tracking-tight text-slate-900">{title}</h3>
                                    
                                    {/* Message */}
                                    <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-400 max-w-sm">
                                        {message}
                                    </p>

                                    {children && (
                                        <div className="mt-6 w-full text-left">
                                            {children}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons - Large touch targets, stacked on mobile */}
                                <div className="flex flex-col gap-3 px-6 pt-4 pb-12">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={onConfirm}
                                        className={`flex w-full items-center justify-center gap-2 rounded-[24px] py-4.5 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 ${colors.confirmBtn}`}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            confirmLabel
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={onClose}
                                        className="w-full rounded-[24px] bg-slate-50 py-4.5 text-sm font-black uppercase tracking-wider text-slate-500 transition-all hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {cancelLabel}
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
