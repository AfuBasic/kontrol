import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Shield,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
    Building2,
    Mail,
    MapPin,
    AlertCircle,
    CheckCircle2,
    X,
    Info,
    HelpCircle,
} from 'lucide-react';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    scope_type: string;
    zone_name?: string | null;
    is_primary: boolean;
}

interface Props {
    estate: {
        id: number;
        name: string;
        status: string;
        email: string;
        address?: string | null;
    };
    admins: AdminUser[];
}

const SUPPORT_REASONS = [
    'Customer support',
    'Troubleshooting',
    'Onboarding assistance',
    'Configuration assistance',
    'Issue reproduction',
    'Other',
];

export default function Impersonate({ estate, admins }: Props) {
    const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
    const [reason, setReason] = useState<string>('Customer support');
    const [customReason, setCustomReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleStartImpersonation = () => {
        if (!selectedAdmin) return;

        setIsSubmitting(true);
        const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;

        router.post(
            `/zeus/estates/${estate.id}/impersonate`,
            {
                user_id: selectedAdmin.id,
                reason: finalReason,
            },
            {
                onFinish: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <ZeusLayout>
            <Head title={`Impersonate Estate Admin — ${estate.name}`} />

            {/* Back Link */}
            <Link
                href={`/zeus/estates/${estate.id}`}
                className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to {estate.name}
            </Link>

            {/* Estate Header Banner */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800/50 dark:bg-[#0f1423]"
            >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400">
                            <Shield className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Support Mode — Impersonate Estate Admin
                                </h1>
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ring-1 ring-inset ${
                                        estate.status === 'active'
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20'
                                            : 'bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:ring-slate-700'
                                    }`}
                                >
                                    {estate.status}
                                </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                    <Building2 className="h-4 w-4 text-slate-400" />
                                    {estate.name}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4 text-slate-400" />
                                    {estate.email}
                                </span>
                                {estate.address && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {estate.address}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Informational Guidance Alert */}
            <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
                <div className="flex items-start gap-3">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="font-semibold">Important Security & Attribution Protocol</p>
                        <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                            Support Mode allows you to operate under the legitimate authority context of an active estate administrator. 
                            Actions performed during this session are recorded in the estate audit log as <strong>Kontrol Support</strong> activity while maintaining internal attribution to your Zeus provider account.
                        </p>
                    </div>
                </div>
            </div>

            {/* Administrators Selection Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Administrators</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select an administrator to begin Support Mode in this estate.
                        </p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {admins.length} Available
                    </span>
                </div>

                {admins.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {admins.map((admin) => (
                            <motion.div
                                key={admin.id}
                                whileHover={{ scale: 1.01 }}
                                transition={{ duration: 0.15 }}
                                className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all dark:border-slate-800/80 dark:bg-[#0f1423]"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-[#0A3D91] ring-1 ring-blue-500/20 dark:bg-blue-900/30 dark:text-blue-300">
                                                {getInitials(admin.name)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-slate-900 dark:text-white">{admin.name}</h3>
                                                    {admin.is_primary && (
                                                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                                                            Primary
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{admin.email}</p>
                                            </div>
                                        </div>
                                        <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase dark:bg-slate-800 dark:text-slate-300">
                                            {admin.role}
                                        </span>
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/60 dark:text-slate-400">
                                        <span className="font-medium text-slate-700 dark:text-slate-300">Scope:</span>
                                        {admin.scope_type === 'zone' && admin.zone_name ? (
                                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:ring-indigo-800">
                                                Zone: {admin.zone_name}
                                            </span>
                                        ) : (
                                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                Estate-wide
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAdmin(admin)}
                                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A3D91] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#082f70] active:scale-98 dark:bg-blue-600 dark:hover:bg-blue-500"
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        Impersonate {admin.name}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    /* Empty State: No Administrators */
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/20">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                            <ShieldAlert className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                            No estate administrator available
                        </h3>
                        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">
                            This estate currently has no active administrator that can be impersonated. You cannot enter Support Mode without an authentic administrator context.
                        </p>
                        <div className="mt-6">
                            <Link
                                href={`/zeus/estates/${estate.id}`}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Return to Estate Overview
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Impersonation Confirmation Modal */}
            <AnimatePresence>
                {selectedAdmin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => !isSubmitting && setSelectedAdmin(null)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-[#0f1423]"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400">
                                        <ShieldCheck className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            Impersonate {selectedAdmin.name}?
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Entering {estate.name} in Support Mode
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => !isSubmitting && setSelectedAdmin(null)}
                                    disabled={isSubmitting}
                                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="mt-5 space-y-4">
                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200 leading-relaxed">
                                    You are about to enter <strong>{estate.name}</strong> using{' '}
                                    <strong>{selectedAdmin.name}</strong>'s Estate Admin authority. Actions performed during this session will be recorded as <strong>Kontrol Support</strong> activity for the estate and will remain attributable to your provider account internally.
                                </div>

                                {/* Support Reason Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Support Reason (Optional)
                                    </label>
                                    <select
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        disabled={isSubmitting}
                                        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-sm focus:border-[#0A3D91] focus:ring-1 focus:ring-[#0A3D91] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                    >
                                        {SUPPORT_REASONS.map((r) => (
                                            <option key={r} value={r}>
                                                {r}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {reason === 'Other' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                            Specify Reason
                                        </label>
                                        <input
                                            type="text"
                                            value={customReason}
                                            onChange={(e) => setCustomReason(e.target.value)}
                                            placeholder="Enter reason for support session..."
                                            disabled={isSubmitting}
                                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 shadow-sm focus:border-[#0A3D91] focus:ring-1 focus:ring-[#0A3D91] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAdmin(null)}
                                    disabled={isSubmitting}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleStartImpersonation}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-98 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Starting Session...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="h-4 w-4" />
                                            Start Impersonation
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ZeusLayout>
    );
}
