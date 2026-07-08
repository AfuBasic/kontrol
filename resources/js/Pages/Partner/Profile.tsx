import {
    BuildingOfficeIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    IdentificationIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PartnerLayout from '@/Layouts/PartnerLayout';
import { formatCommission, formatCommissionLength } from '@/Utils/money';

interface Props {
    user: {
        id: number;
        name: string;
        email: string;
    };
    partner: {
        name: string;
        status: string;
        description: string | null;
        website: string | null;
        contact_person: string | null;
        commission_type: string | null;
        commission_rate: string | null;
        commission_length: number | null;
    } | null;
}

function StatusBadge({ status }: { status: string }) {
    const styles =
        status === 'active'
            ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
            : status === 'pending'
              ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
              : 'bg-slate-100 text-slate-600 ring-slate-500/20';

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${styles}`}>
            {status}
        </span>
    );
}

export default function PartnerProfile({ user, partner }: Props) {
    return (
        <PartnerLayout>
            <Head title="Profile – Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Profile</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Your partner account and commission plan details.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Account */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-300">
                                <UserIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Account</h2>
                        </div>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Full name</dt>
                                <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{user.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Email</dt>
                                <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                                    <EnvelopeIcon className="h-4 w-4 text-slate-400" />
                                    {user.email}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {/* Business */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                                <BuildingOfficeIcon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-1 items-center justify-between gap-2">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Business</h2>
                                {partner && <StatusBadge status={partner.status} />}
                            </div>
                        </div>
                        {partner ? (
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Organization</dt>
                                    <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{partner.name}</dd>
                                </div>
                                {partner.contact_person && (
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Contact person</dt>
                                        <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                                            {partner.contact_person}
                                        </dd>
                                    </div>
                                )}
                                {partner.website && (
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Website</dt>
                                        <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-primary-600">
                                            <GlobeAltIcon className="h-4 w-4" />
                                            <a href={partner.website} target="_blank" rel="noreferrer" className="hover:underline">
                                                {partner.website}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                                {partner.description && (
                                    <div>
                                        <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Description</dt>
                                        <dd className="mt-1 text-sm text-slate-600 dark:text-slate-300">{partner.description}</dd>
                                    </div>
                                )}
                            </dl>
                        ) : (
                            <p className="text-sm text-slate-500">No partner organization linked to this account.</p>
                        )}
                    </section>

                    {/* Commission plan */}
                    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
                        <div className="mb-5 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <IdentificationIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Commission plan</h2>
                        </div>
                        {partner ? (
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                    <p className="text-xs font-medium text-slate-500 uppercase">Rate</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatCommission(partner.commission_rate, partner.commission_type)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {partner.commission_type === 'fixed' ? 'Fixed per payment' : 'Percentage of payment revenue'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                    <p className="text-xs font-medium text-slate-500 uppercase">Duration</p>
                                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                                        {formatCommissionLength(partner.commission_length)}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">From estate activation</p>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                                    <p className="text-xs font-medium text-slate-500 uppercase">Banking</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">Contact support to update</p>
                                    <Link
                                        href="/partner/support"
                                        className="mt-2 inline-flex text-xs font-semibold text-primary-600 hover:underline"
                                    >
                                        Open support →
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500">Commission plan unavailable.</p>
                        )}
                    </section>
                </div>
            </motion.div>
        </PartnerLayout>
    );
}
