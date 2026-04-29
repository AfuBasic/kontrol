import { usePage } from '@inertiajs/react';
import React, { ReactNode, Fragment } from 'react';
import { Lock } from 'lucide-react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
    feature: string;
    children: ReactNode;
    fallback?: ReactNode;
    showInlineLock?: boolean;
}

export default function FeatureGate({ feature, children, fallback, showInlineLock = false }: Props) {
    const { estate_plan } = usePage<any>().props;
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);

    const hasFeature = estate_plan?.features?.includes(feature);

    if (hasFeature) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    if (showInlineLock) {
        return (
            <>
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        setShowUpgradeModal(true);
                    }}
                    className="relative cursor-pointer opacity-70 transition-opacity hover:opacity-100"
                >
                    {/* Intercept clicks */}
                    <div className="bg-background/50 absolute inset-0 z-10 flex items-center justify-center rounded-md backdrop-blur-[1px]">
                        <Lock className="text-muted-foreground h-5 w-5" />
                    </div>
                    <div className="pointer-events-none">{children}</div>
                </div>

                <Transition.Root show={showUpgradeModal} as={Fragment}>
                    <Dialog as="div" className="relative z-[200]" onClose={() => setShowUpgradeModal(false)}>
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" />
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
                                    <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                        <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                                            <button
                                                type="button"
                                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                                                onClick={() => setShowUpgradeModal(false)}
                                            >
                                                <span className="sr-only">Close</span>
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>
                                        <div className="p-6">
                                            <div className="mb-6 text-center">
                                                <Lock className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                                                <Dialog.Title as="h3" className="text-lg leading-6 font-semibold text-gray-900">
                                                    Upgrade to access this feature
                                                </Dialog.Title>
                                                <p className="mt-2 text-sm text-gray-500">
                                                    This feature is not available on your current plan. Upgrade your plan to unlock it.
                                                </p>
                                            </div>
                                            <div className="mt-5 flex justify-center sm:mt-6">
                                                <a
                                                    href="/admin/billing"
                                                    className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:w-auto"
                                                >
                                                    View Plans & Upgrade
                                                </a>
                                            </div>
                                        </div>
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition.Root>
            </>
        );
    }

    // Default to rendering nothing if no fallback and showInlineLock is false
    return null;
}
