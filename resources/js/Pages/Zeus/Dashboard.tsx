import { SparklesIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ApplicationActionMenu from '@/Components/Zeus/ApplicationActionMenu';
import ApplicationDetailModal from '@/Components/Zeus/ApplicationDetailModal';
import RejectionModal from '@/Components/Zeus/RejectionModal';
import ZeusLayout from '@/Layouts/ZeusLayout';

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
    stats: {
        total: number;
        active: number;
        inactive: number;
    };
    applications: Application[];
}

export default function Dashboard({ stats, applications }: Props) {
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [rejectionApplicationId, setRejectionApplicationId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function handleViewDetails(app: Application) {
        setSelectedApplication(app);
        setDetailModalOpen(true);
    }

    function handleApproveApplication(applicationId: number, estateName: string) {
        if (confirm(`Approve "${estateName}" and create the estate? This will send an invitation to the admin.`)) {
            router.post(`/zeus/applications/${applicationId}/approve`, {}, { preserveState: true });
        }
    }

    function handleRejectClick(applicationId: number) {
        setRejectionApplicationId(applicationId);
        setRejectionModalOpen(true);
    }

    function handleConfirmRejection(reason: string) {
        if (rejectionApplicationId) {
            setIsLoading(true);
            router.post(
                `/zeus/applications/${rejectionApplicationId}/reject`,
                { reason },
                {
                    preserveState: true,
                    onFinish: () => {
                        setIsLoading(false);
                        setRejectionModalOpen(false);
                        setRejectionApplicationId(null);
                    },
                },
            );
        }
    }

    function handleMarkContacted(applicationId: number) {
        router.post(`/zeus/applications/${applicationId}/contacted`, {}, { preserveState: true });
    }

    return (
        <ZeusLayout>
            <Head title="Zeus Dashboard" />

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="mb-10 flex items-end justify-between gap-6"
            >
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">System Overview</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Zeus <span className="font-light text-slate-400">Control Center</span>
                    </h1>
                </div>
                <Link
                    href="/zeus/estates"
                    className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:bg-slate-800 hover:shadow-md active:scale-95"
                >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Manage Estates
                </Link>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="mb-10 grid gap-6 sm:grid-cols-4"
            >
                {[
                    {
                        label: 'Total Estates',
                        value: stats.total,
                        color: 'text-slate-900',
                    },
                    {
                        label: 'Active Channels',
                        value: stats.active,
                        color: 'text-primary-600',
                    },
                    {
                        label: 'Inactive',
                        value: stats.inactive,
                        color: 'text-slate-400',
                    },
                    {
                        label: 'Incoming Apps',
                        value: applications.length,
                        color: 'text-warning-600',
                    },
                ].map((stat, index) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 transition-all hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/3"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <span className="text-6xl font-bold select-none">{index + 1}</span>
                        </div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{stat.label}</p>
                        <p className={`mt-2 text-3xl font-black tracking-tight ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </motion.div>

            {/* Applications Section */}
            {applications.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="mb-10 rounded-lg border border-slate-900 bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
                >
                    <div className="flex items-center justify-between overflow-hidden rounded-t-lg border-b border-white/5 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-warning-500/20 text-warning-500">
                                <SparklesIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-[13px] font-bold tracking-wider text-white uppercase">Pending Requests</h2>
                                <p className="text-[11px] text-slate-400">Incoming estate applications for validation</p>
                            </div>
                        </div>
                        <span className="rounded bg-primary-600 px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase">Action Required</span>
                    </div>

                    <div className="divide-y divide-white/5 overflow-visible rounded-b-lg">
                        {applications.map((app) => (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="relative flex items-center justify-between gap-4 p-6 transition-colors hover:bg-white/2"
                            >
                                {/* Left: Estate name + status */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="truncate text-base font-bold text-white">{app.estate_name}</h3>
                                        <span
                                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-tight uppercase ${
                                                app.status === 'pending' ? 'text-warning-300 bg-warning-500/20' : 'bg-primary-500/20 text-primary-300'
                                            }`}
                                        >
                                            {app.status === 'pending' ? 'Pending' : 'Contacted'}
                                        </span>
                                    </div>
                                </div>

                                {/* Right: Action buttons */}
                                <div className="flex shrink-0 items-center gap-2">
                                    {app.status === 'pending' && (
                                        <button
                                            onClick={() => handleMarkContacted(app.id)}
                                            className="rounded-lg border border-slate-400/30 bg-white/10 px-3 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/20"
                                        >
                                            Mark Contacted
                                        </button>
                                    )}

                                    <ApplicationActionMenu
                                        applicationId={app.id}
                                        estateName={app.estate_name}
                                        onView={() => handleViewDetails(app)}
                                        onApprove={() => handleApproveApplication(app.id, app.estate_name)}
                                        onReject={() => handleRejectClick(app.id)}
                                        isLoading={isLoading}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Call to Action - View All Estates */}
            {applications.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white py-16 text-center"
                >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 13l-7 7-7-7m0-6l7-7 7 7" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">All applications processed</h3>
                    <p className="mt-2 text-sm text-slate-500">No pending requests at the moment. View all estates to manage existing ones.</p>
                    <Link
                        href="/zeus/estates"
                        className="mt-6 inline-flex items-center rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-200 hover:bg-slate-800"
                    >
                        View All Estates
                    </Link>
                </motion.div>
            )}
            {/* Modals */}
            <ApplicationDetailModal isOpen={detailModalOpen} application={selectedApplication} onClose={() => setDetailModalOpen(false)} />

            <RejectionModal
                isOpen={rejectionModalOpen}
                estateName={selectedApplication?.estate_name || ''}
                isLoading={isLoading}
                onConfirm={handleConfirmRejection}
                onClose={() => {
                    setRejectionModalOpen(false);
                    setRejectionApplicationId(null);
                }}
            />
        </ZeusLayout>
    );
}
