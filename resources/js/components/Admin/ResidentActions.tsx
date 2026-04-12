import { ArrowPathIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { edit, destroy, suspend, resetPassword } from '@/actions/App/Http/Controllers/Admin/ResidentController';
import ConfirmationModal from '@/components/ConfirmationModal';
import { usePermission } from '@/hooks/usePermission';
import MobileSheet from '@/components/MobileSheet';

type Resident = {
    id: number;
    name: string;
    suspended_at: string | null;
    status: 'pending' | 'accepted';
};

interface Props {
    resident: Resident;
}

export default function ResidentActions({ resident }: Props) {
    const { can } = usePermission();
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
                router.delete(destroy.url({ resident: resident.id }), options);
                break;
            case 'suspend':
                router.patch(suspend.url({ resident: resident.id }), {}, options);
                break;
            case 'reset':
                router.post(resetPassword.url({ resident: resident.id }), {}, options);
                break;
        }
    };

    const getModalContent = () => {
        switch (modalConfig.type) {
            case 'delete':
                return {
                    title: 'Delete Resident',
                    message: `Are you sure you want to delete ${resident.name}? This action cannot be undone and will remove all their data.`,
                    confirmLabel: 'Delete Resident',
                    type: 'danger' as const,
                };
            case 'suspend': {
                const isSuspended = !!resident.suspended_at;
                return {
                    title: isSuspended ? 'Activate Resident' : 'Suspend Resident',
                    message: isSuspended
                        ? `Are you sure you want to activate ${resident.name}? They will be able to log in again.`
                        : `Are you sure you want to suspend ${resident.name}? They will no longer be able to log in.`,
                    confirmLabel: isSuspended ? 'Activate Resident' : 'Suspend Resident',
                    type: isSuspended ? 'success' : ('warning' as const), // ModalType probably doesn't support success, let's stick to warning/info or fix types
                };
            }
            case 'reset':
                return {
                    title: 'Reset Password',
                    message: `Are you sure you want to reset the password for ${resident.name}? This will invalidate their current password and send a new invitation email.`,
                    confirmLabel: 'Reset Password',
                    type: 'warning' as const,
                };
            default:
                return { title: '', message: '', confirmLabel: '', type: 'info' as const };
        }
    };

    const modalContent = getModalContent();

    // Fix type for Modal because I suspect 'success' might not be in the type definition I saw earlier
    // Defined types: 'danger' | 'warning' | 'info'
    const modalType = modalConfig.type === 'suspend' && resident.suspended_at ? 'info' : (modalContent.type as 'danger' | 'warning' | 'info');

    const ActionItems = ({ isMobile = false }) => (
        <div className={isMobile ? 'flex flex-col gap-3' : 'space-y-0.5'}>
            {/* Edit */}
            {can('residents.edit') && (
                <Link
                    href={edit.url({ resident: resident.id })}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile 
                        ? 'rounded-2xl bg-slate-50 p-4 font-black text-slate-900 shadow-sm active:scale-95' 
                        : 'rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                >
                    <PencilIcon className={isMobile ? 'h-6 w-6 text-slate-400' : 'h-4 w-4'} />
                    Edit Resident
                </Link>
            )}

            {/* Suspend / Activate */}
            {can('residents.suspend') && (
                <button
                    onClick={() => openModal('suspend')}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile 
                        ? 'rounded-2xl bg-slate-50 p-4 font-black shadow-sm active:scale-95' 
                        : 'rounded-lg px-3 py-2 text-sm hover:bg-gray-50'
                    } ${resident.suspended_at ? 'text-emerald-600' : 'text-orange-600'}`}
                >
                    {resident.suspended_at ? (
                        <>
                            <CheckCircleIcon className={isMobile ? 'h-6 w-6' : 'h-4 w-4'} />
                            Activate Account
                        </>
                    ) : (
                        <>
                            <NoSymbolIcon className={isMobile ? 'h-6 w-6' : 'h-4 w-4'} />
                            Suspend Account
                        </>
                    )}
                </button>
            )}

            {/* Reset Password */}
            {can('residents.reset-password') && (
                <button
                    onClick={() => openModal('reset')}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile 
                        ? 'rounded-2xl bg-slate-50 p-4 font-black text-slate-900 shadow-sm active:scale-95' 
                        : 'rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                    }`}
                >
                    <ArrowPathIcon className={isMobile ? 'h-6 w-6 text-slate-400' : 'h-4 w-4'} />
                    Reset Password
                </button>
            )}

            {!isMobile && <hr className="my-1 border-gray-100" />}

            {/* Delete */}
            {can('residents.delete') && (
                <button
                    onClick={() => openModal('delete')}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile 
                        ? 'rounded-2xl border border-rose-100 bg-rose-50/50 p-4 font-black text-rose-600 shadow-sm active:scale-95' 
                        : 'rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700'
                    }`}
                >
                    <TrashIcon className={isMobile ? 'h-6 w-6' : 'h-4 w-4'} />
                    Delete Resident
                </button>
            )}
        </div>
    );

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
                        className="absolute right-0 z-10 mt-1 hidden w-48 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none md:block"
                    >
                        <ActionItems />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Sheet */}
            <MobileSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={resident.name}>
                <ActionItems isMobile />
            </MobileSheet>

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
