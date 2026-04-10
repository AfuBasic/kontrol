import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Props {
    applicationId: number;
    estateName: string;
    onView: () => void;
    onApprove: () => void;
    onReject: () => void;
    isLoading: boolean;
}

export default function ApplicationActionMenu({
    applicationId,
    estateName,
    onView,
    onApprove,
    onReject,
    isLoading,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative z-10" ref={menuRef}>
            {/* Menu Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isLoading}
                className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
                title="More options"
            >
                <MoreVertical className="h-4 w-4" />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-40 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
                    >
                        {/* View */}
                        <button
                            onClick={() => {
                                onView();
                                setIsOpen(false);
                            }}
                            className="flex w-full items-center gap-2.5 border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                            <Eye className="h-4 w-4" />
                            View Details
                        </button>

                        {/* Approve */}
                        <button
                            onClick={() => {
                                onApprove();
                                setIsOpen(false);
                            }}
                            className="flex w-full items-center gap-2.5 border-b border-slate-100 px-4 py-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Approve & Create
                        </button>

                        {/* Reject */}
                        <button
                            onClick={() => {
                                onReject();
                                setIsOpen(false);
                            }}
                            className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                        >
                            <XCircle className="h-4 w-4" />
                            Reject
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
