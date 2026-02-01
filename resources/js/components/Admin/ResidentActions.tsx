import { ArrowPathIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, NoSymbolIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Link, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { edit, destroy, suspend, resetPassword } from '@/actions/App/Http/Controllers/Admin/ResidentController';

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
    const [isOpen, setIsOpen] = useState(false);
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

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this resident? This action cannot be undone.')) {
            router.delete(destroy.url({ resident: resident.id }), {
                onFinish: () => setIsOpen(false),
            });
        }
    };

    const handleSuspend = () => {
        router.patch(
            suspend.url({ resident: resident.id }),
            {},
            {
                onFinish: () => setIsOpen(false),
            },
        );
    };

    const handleResetPassword = () => {
        if (confirm('Are you sure you want to reset the password? This will send a new invitation email.')) {
            router.post(
                resetPassword.url({ resident: resident.id }),
                {},
                {
                    onFinish: () => setIsOpen(false),
                },
            );
        }
    };

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
                                href={edit.url({ resident: resident.id })}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                            >
                                <PencilIcon className="h-4 w-4" />
                                Edit
                            </Link>

                            {/* Suspend / Activate */}
                            <button
                                onClick={handleSuspend}
                                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                    resident.suspended_at ? 'text-green-600' : 'text-orange-600'
                                }`}
                            >
                                {resident.suspended_at ? (
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
                                onClick={handleResetPassword}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary-600"
                            >
                                <ArrowPathIcon className="h-4 w-4" />
                                Reset Password
                            </button>

                            <hr className="my-1 border-gray-100" />

                            {/* Delete */}
                            <button
                                onClick={handleDelete}
                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                            >
                                <TrashIcon className="h-4 w-4" />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
