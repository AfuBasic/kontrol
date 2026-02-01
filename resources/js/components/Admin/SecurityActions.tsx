import { ArrowPathIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { edit, destroy, suspend, resetPassword } from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import ConfirmationModal from '@/Components/ConfirmationModal';

type SecurityPerson = {
    id: number;
    name: string;
    suspended_at: string | null;
    status: 'pending' | 'accepted';
};

interface Props {
    security: SecurityPerson;
}

export default function SecurityActions({ security }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'suspend' | 'reset' | 'delete' | null;
    }>({
        isOpen: false,
        type: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const openModal = (type: 'suspend' | 'reset' | 'delete') => {
        setModalConfig({ isOpen: true, type });
        setIsOpen(false); // Close dropdown
    };

    const closeModal = () => {
        setModalConfig({ ...modalConfig, isOpen: false });
        setTimeout(() => setModalConfig({ isOpen: false, type: null }), 300);
    };

    const handleConfirm = () => {
        if (!modalConfig.type) return;
        setIsLoading(true);

        const options = {
            onFinish: () => {
                setIsLoading(false);
                closeModal();
            },
        };

        switch (modalConfig.type) {
            case 'delete':
                router.delete(destroy.url({ security: security.id }), options);
                break;
            case 'suspend':
                router.patch(suspend.url({ security: security.id }), {}, options);
                break;
            case 'reset':
                router.post(resetPassword.url({ security: security.id }), {}, options);
                break;
        }
    };

    const getModalContent = () => {
        switch (modalConfig.type) {
            case 'delete':
                return {
                    title: 'Delete Security Personnel',
                    message: `Are you sure you want to delete ${security.name}? This action cannot be undone and will remove all their data.`,
                    confirmLabel: 'Delete Personnel',
                    type: 'danger' as const,
                };
            case 'suspend':
                const isSuspended = !!security.suspended_at;
                return {
                    title: isSuspended ? 'Activate Personnel' : 'Suspend Personnel',
                    message: isSuspended
                        ? `Are you sure you want to activate ${security.name}? They will be able to log in again.`
                        : `Are you sure you want to suspend ${security.name}? They will no longer be able to log in.`,
                    confirmLabel: isSuspended ? 'Activate Personnel' : 'Suspend Personnel',
                    type: isSuspended ? 'info' : ('warning' as const),
                };
            case 'reset':
                return {
                    title: 'Reset Password',
                    message: `Are you sure you want to reset the password for ${security.name}? This will invalidate their current password and send a new invitation email.`,
                    confirmLabel: 'Reset Password',
                    type: 'warning' as const,
                };
            default:
                return { title: '', message: '', confirmLabel: '', type: 'info' as const };
        }
    };

    const modalContent = getModalContent();
    const modalType = modalContent.type as 'danger' | 'warning' | 'info';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
                <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 z-10 mt-1 w-48 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none"
                    >
                        <div className="space-y-0.5">
                            {/* Edit */}
                            <Link
                                href={edit.url({ security: security.id })}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                            >
                                <PencilIcon className="h-4 w-4" />
                                Edit
                            </Link>

                            {/* Suspend / Activate */}
                            <button
                                onClick={() => openModal('suspend')}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                    security.suspended_at ? 'text-green-600' : 'text-orange-600'
                                }`}
                            >
                                {security.suspended_at ? (
                                    <>
                                        <CheckCircleIcon className="h-4 w-4" />
                                        Activate
                                    </>
                                ) : (
                                    <>
                                        <NoSymbolIcon className="h-4 w-4" />
                                        Suspend
                                    </>
                                )}
                            </button>

                            {/* Reset Password */}
                            <button
                                onClick={() => openModal('reset')}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                Reset Password
                            </button>

                            <hr className="my-1 border-gray-100" />

                            {/* Delete */}
                            <button
                                onClick={() => openModal('delete')}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                onConfirm={handleConfirm}
                title={modalContent.title}
                message={modalContent.message}
                confirmLabel={modalContent.confirmLabel}
                type={modalType}
                isLoading={isLoading}
            />
        </div>
    );
}
