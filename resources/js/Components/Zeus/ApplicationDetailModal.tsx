import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
    billing_interval?: 'quarterly' | 'semi-annually' | 'annually';
}

interface Application {
    id: number;
    estate_name: string;
    email: string;
    phone: string;
    address: string | null;
    notes: string | null;
    status: 'pending' | 'contacted';
    created_at: string;
    plan: Plan | null;
}

interface Props {
    isOpen: boolean;
    application: Application | null;
    onClose: () => void;
}

export default function ApplicationDetailModal({ isOpen, application, onClose }: Props) {
    if (!isOpen || !application) return null;

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

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
                className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                {/* Header */}
                <div className="border-b border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{application.estate_name}</h2>
                            <p className="mt-1 text-sm text-slate-300">Application Details</p>
                        </div>
                        <button onClick={onClose} className="rounded-full bg-white/10 p-2 transition-all hover:bg-white/20">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6 px-6 py-6">
                    {/* Status & Plan */}
                    <div className="flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-tight uppercase ${
                                application.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                            }`}
                        >
                            {application.status === 'pending' ? 'Pending' : 'Contacted'}
                        </span>
                        {application.plan && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-bold tracking-tight text-indigo-700 uppercase">
                                Plan: {application.plan.name}
                                {application.plan.billing_interval && (
                                    <span className="ml-1">({application.plan.billing_interval === 'monthly' ? 'Monthly' : 'Annual'})</span>
                                )}
                            </span>
                        )}
                    </div>

                    {/* Contact Information */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Email</label>
                            <a href={`mailto:${application.email}`} className="mt-1 text-base break-all text-blue-600 hover:underline">
                                {application.email}
                            </a>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Phone</label>
                            <a href={`tel:${application.phone}`} className="mt-1 text-base text-blue-600 hover:underline">
                                {application.phone}
                            </a>
                        </div>
                    </div>

                    {/* Address */}
                    {application.address && (
                        <div>
                            <label className="block text-sm font-semibold text-slate-700">Address</label>
                            <p className="mt-1 text-base text-slate-600">{application.address}</p>
                        </div>
                    )}

                    {/* Applied Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700">Applied</label>
                        <p className="mt-1 text-base text-slate-600">{formatDate(application.created_at)}</p>
                    </div>

                    {/* Notes */}
                    {application.notes && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <label className="block text-sm font-semibold text-slate-700">Notes</label>
                            <p className="mt-2 text-sm whitespace-pre-wrap text-slate-600">{application.notes}</p>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                    <button
                        onClick={onClose}
                        className="w-full rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white transition-all hover:bg-slate-800"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
