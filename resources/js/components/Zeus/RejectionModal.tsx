import { motion } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
    isOpen: boolean;
    estateName: string;
    isLoading: boolean;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}

export default function RejectionModal({ isOpen, estateName, isLoading, onConfirm, onClose }: Props) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (reason.trim()) {
            onConfirm(reason);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="border-b border-red-200 bg-red-50 px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="h-6 w-6 text-red-600" />
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">Reject Application</h2>
                                <p className="text-sm text-slate-600">{estateName}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-full hover:bg-red-100 p-2 transition-all"
                        >
                            <X className="h-5 w-5 text-red-600" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4 px-6 py-6">
                    <p className="text-sm text-slate-600">
                        Please provide a reason for rejecting this application. This will be communicated to the applicant via email.
                    </p>

                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Location outside service area, incomplete information, etc."
                        rows={4}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-100 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition-all hover:bg-slate-100 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim() || isLoading}
                        className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Rejecting...' : 'Reject & Notify'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
