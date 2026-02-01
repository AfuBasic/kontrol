import { Transition } from '@headlessui/react';
import { CheckCircleIcon, InformationCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useState } from 'react';

interface ToastProps {
    show: boolean;
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export default function Toast({ show, message, type = 'success', onClose }: ToastProps) {
    const [visible, setVisible] = useState(show);

    useEffect(() => {
        setVisible(show);
        if (show) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [show, onClose]);

    return (
        <div aria-live="assertive" className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6">
            <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
                <Transition
                    show={visible}
                    as={Fragment}
                    enter="transform ease-out duration-300 transition"
                    enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                    enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xl border border-gray-100 bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur-sm">
                        <div className="p-4">
                            <div className="flex items-start">
                                <div className="shrink-0">
                                    {type === 'success' ? (
                                        <CheckCircleIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                                    ) : type === 'error' ? (
                                        <XCircleIcon className="h-6 w-6 text-red-500" aria-hidden="true" />
                                    ) : (
                                        <InformationCircleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="ml-3 w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notification'}
                                    </p>
                                    <p className="mt-1 text-sm text-gray-600">{message}</p>
                                </div>
                                <div className="ml-4 flex shrink-0">
                                    <button
                                        type="button"
                                        className="inline-flex rounded-md bg-transparent text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </div>
    );
}
