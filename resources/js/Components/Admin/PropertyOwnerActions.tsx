import {
    ArrowPathIcon,
    EllipsisVerticalIcon,
    PencilIcon,
    NoSymbolIcon,
    CheckCircleIcon,
    BuildingOffice2Icon,
    UsersIcon,
    UserPlusIcon,
} from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { edit, suspend, properties, residents, makeResident } from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import ConfirmationModal from '@/Components/ConfirmationModal';
import MobileSheet from '@/Components/MobileSheet';
import { usePermission } from '@/Hooks/usePermission';

type PropertyOwner = {
    ulid: string;
    id: number;
    name: string;
    suspended_at: string | null;
    status: 'pending' | 'accepted';
    is_resident: boolean;
};

interface Props {
    owner: PropertyOwner;
}

export default function PropertyOwnerActions({ owner }: Props) {
    const { can } = usePermission();
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'suspend' | 'makeResident' | null;
    }>({
        isOpen: false,
        type: null,
    });
    const [isLoading, setIsLoading] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia('(min-width: 640px)');
        setIsDesktop(mql.matches);
        const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, []);

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setMenuPosition({
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
        });
    }, []);

    // Close on click outside (button + portal dropdown)
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const clickedButton = buttonRef.current?.contains(target);
            const clickedDropdown = dropdownRef.current?.contains(target);
            if (!clickedButton && !clickedDropdown) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    const handleToggle = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen((v) => !v);
    };

    const openModal = (type: 'suspend' | 'makeResident') => {
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

        if (modalConfig.type === 'suspend') {
            router.patch(suspend.url(owner.ulid), {}, options);
        } else if (modalConfig.type === 'makeResident') {
            router.post(makeResident.url(owner.ulid), {}, options);
        }
    };

    const isSuspended = !!owner.suspended_at;

    const ActionItems = ({ isMobile = false }) => (
        <div className={isMobile ? 'flex flex-col gap-3' : 'space-y-0.5'}>
            {/* View Properties */}
            <Link
                href={properties.url(owner.ulid)}
                className={`flex w-full items-center gap-3 transition-all ${
                    isMobile
                        ? 'rounded-2xl bg-slate-50 p-4 font-black text-slate-900 shadow-sm active:scale-95'
                        : 'rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                }`}
            >
                <BuildingOffice2Icon className={isMobile ? 'h-6 w-6 text-slate-400' : 'h-4 w-4'} />
                View Properties
            </Link>

            {/* View Residents */}
            <Link
                href={residents.url(owner.ulid)}
                className={`flex w-full items-center gap-3 transition-all ${
                    isMobile
                        ? 'rounded-2xl bg-slate-50 p-4 font-black text-slate-900 shadow-sm active:scale-95'
                        : 'rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                }`}
            >
                <UsersIcon className={isMobile ? 'h-6 w-6 text-slate-400' : 'h-4 w-4'} />
                View Residents
            </Link>

            {/* Edit */}
            {can('property_owners.edit') && (
                <Link
                    href={edit.url(owner.ulid)}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile
                            ? 'rounded-2xl bg-slate-50 p-4 font-black text-slate-900 shadow-sm active:scale-95'
                            : 'rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                >
                    <PencilIcon className={isMobile ? 'h-6 w-6 text-slate-400' : 'h-4 w-4'} />
                    Edit Details
                </Link>
            )}

            {/* Make Resident */}
            {!owner.is_resident && can('property_owners.edit') && (
                <button
                    onClick={() => openModal('makeResident')}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile
                            ? 'rounded-2xl bg-indigo-50 p-4 font-black text-indigo-700 shadow-sm active:scale-95'
                            : 'rounded-lg px-3 py-2 text-sm text-indigo-600 hover:bg-indigo-50'
                    }`}
                >
                    <UserPlusIcon className={isMobile ? 'h-6 w-6' : 'h-4 w-4'} />
                    Make Resident
                </button>
            )}

            {!isMobile && <hr className="my-1 border-gray-100" />}

            {/* Suspend / Activate */}
            {can('property_owners.suspend') && (
                <button
                    onClick={() => openModal('suspend')}
                    className={`flex w-full items-center gap-3 transition-all ${
                        isMobile
                            ? 'rounded-2xl bg-slate-50 p-4 font-black shadow-sm active:scale-95'
                            : 'rounded-lg px-3 py-2 text-sm hover:bg-gray-50'
                    } ${isSuspended ? 'text-emerald-600' : 'text-orange-600'}`}
                >
                    {isSuspended ? (
                        <>
                            <CheckCircleIcon className={isMobile ? 'h-6 w-6' : 'h-4 w-4'} />
                            Reactivate Account
                        </>
                    ) : (
                        <>
                            <NoSymbolIcon className={isMobile ? 'h-6 w-6' : 'h-4 w-4'} />
                            Suspend Account
                        </>
                    )}
                </button>
            )}
        </div>
    );

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
                <EllipsisVerticalIcon className="h-5 w-5" />
            </button>

            {/* Desktop dropdown — portalled so it escapes overflow-hidden table wrappers */}
            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {isOpen && menuPosition && isDesktop && (
                            <motion.div
                                ref={dropdownRef}
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                style={{ position: 'fixed', top: menuPosition.top, right: menuPosition.right }}
                                className="z-[100] w-48 origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg ring-1 ring-black/5 focus:outline-none"
                            >
                                <ActionItems />
                            </motion.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}

            {/* Mobile Sheet */}
            {!isDesktop && (
                <MobileSheet isOpen={isOpen} onClose={() => setIsOpen(false)} title={owner.name}>
                    <ActionItems isMobile />
                </MobileSheet>
            )}

            <ConfirmationModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                onConfirm={handleConfirm}
                title={
                    modalConfig.type === 'makeResident'
                        ? 'Make Resident'
                        : isSuspended ? 'Reactivate Property Owner' : 'Suspend Property Owner'
                }
                message={
                    modalConfig.type === 'makeResident'
                        ? `Are you sure you want to give ${owner.name} resident privileges? They will be added to the residents directory and can generate visitor passes.`
                        : isSuspended
                            ? `Are you sure you want to reactivate ${owner.name}? They will be able to log in and manage their properties again.`
                            : `Are you sure you want to suspend ${owner.name}? They will be logged out and lose access to the platform until reactivated.`
                }
                confirmLabel={
                    modalConfig.type === 'makeResident'
                        ? 'Make Resident'
                        : isSuspended ? 'Reactivate' : 'Suspend'
                }
                type={
                    modalConfig.type === 'makeResident'
                        ? 'info'
                        : isSuspended ? 'info' : 'warning'
                }
                isLoading={isLoading}
            />
        </div>
    );
}
