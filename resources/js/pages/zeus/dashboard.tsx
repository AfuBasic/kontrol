import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import ZeusLayout from '@/layouts/ZeusLayout';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface Plan {
    id: number;
    name: string;
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
    function formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    function handleApproveApplication(applicationId: number, estateName: string) {
        if (confirm(`Approve "${estateName}" and create the estate? This will send an invitation to the admin.`)) {
            router.post(`/zeus/applications/${applicationId}/approve`, {}, { preserveState: true });
        }
    }

    function handleRejectApplication(applicationId: number) {
        if (confirm('Are you sure you want to reject this application?')) {
            router.post(`/zeus/applications/${applicationId}/reject`, {}, { preserveState: true });
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
                    <div className="flex items-center gap-2 mb-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                            System Overview
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        Zeus <span className="text-slate-400 font-light">Control Center</span>
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
                        color: 'text-blue-600',
                    },
                    {
                        label: 'Inactive',
                        value: stats.inactive,
                        color: 'text-slate-400',
                    },
                    {
                        label: 'Incoming Apps',
                        value: applications.length,
                        color: 'text-amber-600',
                    },
                ].map((stat, index) => (
                    <div
                        key={stat.label}
                        className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-6 transition-all hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/3"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <span className="text-6xl font-bold select-none">{index + 1}</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
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
                    className="mb-10 overflow-hidden rounded-lg border border-slate-900 bg-slate-900 text-white shadow-2xl shadow-slate-900/20"
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500/20 text-amber-500">
                                <SparklesIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-[13px] font-bold uppercase tracking-wider text-white">Pending Requests</h2>
                                <p className="text-[11px] text-slate-400">Incoming estate applications for validation</p>
                            </div>
                        </div>
                        <span className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight">Action Required</span>
                    </div>

                    <div className="divide-y divide-white/5">
                        {applications.map((app, index) => (
                            <div
                                key={app.id}
                                className="p-6 transition-colors hover:bg-white/2"
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h3 className="text-sm font-bold text-white">{app.estate_name}</h3>
                                            <span
                                                className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                                                    app.status === 'pending'
                                                        ? 'bg-amber-500/10 text-amber-500'
                                                        : 'bg-blue-500/10 text-blue-500'
                                                }`}
                                            >
                                                {app.status === 'pending' ? 'Pending' : 'Contacted'}
                                            </span>
                                            {app.plan && (
                                                <span className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight bg-indigo-500/10 text-indigo-400">
                                                    Plan: {app.plan.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                                            <div>
                                                <span className="text-gray-500">Email:</span>{' '}
                                                <a href={`mailto:${app.email}`} className="text-gray-900 hover:underline">
                                                    {app.email}
                                                </a>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Phone:</span>{' '}
                                                <a href={`tel:${app.phone}`} className="text-gray-900 hover:underline">
                                                    {app.phone}
                                                </a>
                                            </div>
                                            {app.address && (
                                                <div>
                                                    <span className="text-gray-500">Address:</span>{' '}
                                                    <span className="text-gray-900">{app.address}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-500">Applied:</span>{' '}
                                                <span className="text-gray-900">{formatDate(app.created_at)}</span>
                                            </div>
                                        </div>

                                        {app.notes && (
                                            <div className="rounded-xl bg-gray-50 p-3 text-sm">
                                                <span className="font-medium text-gray-500">Notes:</span>{' '}
                                                <span className="text-gray-700">{app.notes}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
                                        {app.status === 'pending' && (
                                            <button
                                                onClick={() => handleMarkContacted(app.id)}
                                                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
                                            >
                                                Mark Contacted
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleApproveApplication(app.id, app.estate_name)}
                                            className="inline-flex items-center rounded-xl bg-linear-to-r from-green-500 to-green-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md hover:-translate-y-px"
                                        >
                                            Approve & Create
                                        </button>
                                        <button
                                            onClick={() => handleRejectApplication(app.id)}
                                            className="inline-flex items-center rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-50"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
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
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M19 13l-7 7-7-7m0-6l7-7 7 7"
                            />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">All applications processed</h3>
                    <p className="mt-2 text-sm text-slate-500">
                        No pending requests at the moment. View all estates to manage existing ones.
                    </p>
                    <Link
                        href="/zeus/estates"
                        className="mt-6 inline-flex items-center rounded-md bg-slate-900 px-5 py-2.5 text-[13px] font-bold text-white transition-all duration-200 hover:bg-slate-800"
                    >
                        View All Estates
                    </Link>
                </motion.div>
            )}
        </ZeusLayout>
    );
}
