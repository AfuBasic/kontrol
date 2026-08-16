import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Fragment } from 'react';
import ConfirmationSheet from './ConfirmationSheet';

type ModalType = 'danger' | 'warning' | 'info';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: ModalType;
    isLoading?: boolean;
};

export default function ResidentConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    type = 'danger',
    isLoading = false,
}: Props) {
    const colors = {
        danger: {
            icon: 'bg-rose-50 text-rose-600 ring-rose-100',
            button: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800',
        },
        warning: {
            icon: 'bg-amber-50 text-amber-600 ring-amber-100',
            button: 'bg-amber-600 text-white hover:bg-amber-700 active:bg-amber-800',
        },
        info: {
            icon: 'bg-indigo-50 text-indigo-600 ring-indigo-100',
            button: 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
        },
    }[type];

    return (
        <>
            <Transition show={isOpen} as={Fragment}>
                <Dialog onClose={onClose} className="relative z-[200] hidden md:block">
                    <TransitionChild
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
                    </TransitionChild>

                    <div className="fixed inset-0 flex items-center justify-center p-6">
                        <TransitionChild
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="translate-y-3 scale-95 opacity-0"
                            enterTo="translate-y-0 scale-100 opacity-100"
                            leave="ease-in duration-150"
                            leaveFrom="translate-y-0 scale-100 opacity-100"
                            leaveTo="translate-y-3 scale-95 opacity-0"
                        >
                            <DialogPanel className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl ring-1 ring-slate-200/70">
                                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] ring-4 ${colors.icon}`}>
                                    {type === 'info' ? <Info className="h-7 w-7" /> : <AlertTriangle className="h-7 w-7" />}
                                </div>
                                <Dialog.Title className="mt-5 text-xl font-black tracking-tight text-slate-900">{title}</Dialog.Title>
                                <p className="mt-2 text-sm leading-relaxed font-semibold text-slate-400">{message}</p>
                                <div className="mt-7 grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={onClose}
                                        className="rounded-2xl bg-slate-50 px-4 py-3.5 text-sm font-black text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        {cancelLabel}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isLoading}
                                        onClick={onConfirm}
                                        className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-black transition active:scale-[0.98] disabled:opacity-50 ${colors.button}`}
                                    >
                                        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {confirmLabel}
                                    </button>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </Dialog>
            </Transition>

            <ConfirmationSheet
                isOpen={isOpen}
                onClose={onClose}
                onConfirm={onConfirm}
                title={title}
                message={message}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                type={type}
                isLoading={isLoading}
            />
        </>
    );
}
