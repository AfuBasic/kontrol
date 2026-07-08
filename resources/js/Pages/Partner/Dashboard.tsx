import { BanknotesIcon, BuildingOfficeIcon, LinkIcon, UserIcon } from '@heroicons/react/24/outline';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PartnerLayout from '@/Layouts/PartnerLayout';

interface Stats {
    total_earned: number;
    pending_commissions: number;
    partner_request_count: number;
    commission_rate: string | null;
    commission_type: string | null;
    commission_length: number | null;
    next_settlement_date: string;
}

interface Props {
    user: {
        id: number;
        ulid: string;
        name: string;
        email: string;
    };
    stats: Stats;
}

function formatAmount(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

function formatCommission(rate: string | null, type: string | null): string {
    if (!rate) return 'TBD';
    if (type === 'fixed') return '₦' + (Number(rate) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    return `${Number(rate).toFixed(2)}%`;
}

function formatLength(months: number | null): string {
    if (!months) return 'Lifetime (Always)';
    if (months === 12) return '1 Year (12m)';
    if (months === 24) return '2 Years (24m)';
    return `${months} Months`;
}

export default function PartnerDashboard({ user, stats }: Props) {
    return (
        <PartnerLayout>
            <Head title="Partner Portal" />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
                {/* Welcome Header */}
                <div>
                    <div className="mb-2 flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-lg bg-linear-to-r from-primary-500 to-primary-600 opacity-75 blur"></div>
                            <div className="relative rounded-lg bg-primary-500 p-2">
                                <LinkIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <h1 className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-4xl font-bold text-transparent">
                            Welcome, {user.name}
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600">Manage your partner estates and track commission earnings</p>
                </div>

                {/* Quick Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {/* Total Earned */}
                    <Link href="/partner/earnings" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-success-300 block">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Total Earned</span>
                            <BanknotesIcon className="h-5 w-5 text-success-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.total_earned)}</p>
                            <p className="text-xs text-gray-500">Settled commissions</p>
                        </div>
                    </Link>

                    {/* Pending Commissions */}
                    <Link href="/partner/earnings" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-warning-300 block">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Pending</span>
                            <div className="h-5 w-5 rounded bg-linear-to-br from-warning-400 to-warning-600"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">{formatAmount(stats.pending_commissions)}</p>
                            <p className="text-xs text-gray-500">Unsettled this period</p>
                        </div>
                    </Link>

                    {/* Commission Rate */}
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Commission</span>
                            <div className="h-5 w-5 rounded bg-linear-to-br from-primary-400 to-primary-600"></div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">
                                {formatCommission(stats.commission_rate, stats.commission_type)}
                            </p>
                            <div className="flex flex-col gap-0.5 mt-1">
                                <span className="text-[10px] text-gray-500">
                                    {stats.commission_type === 'fixed' ? 'Fixed per payment' : 'Per payment revenue'}
                                </span>
                                <span className="text-[10px] font-bold text-primary-600">
                                    Length: {formatLength(stats.commission_length)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Partner Requests */}
                    <Link href="/partner/partner-requests" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary-300 block">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Requests</span>
                            <BuildingOfficeIcon className="h-5 w-5 text-primary-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-3xl font-bold text-gray-900">{stats.partner_request_count}</p>
                            <p className="text-xs text-gray-500">Estate requests submitted</p>
                        </div>
                    </Link>
                </motion.div>

                {/* Next Settlement Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border border-success-200 bg-linear-to-br from-success-50 to-success-100/50 p-6 flex items-center justify-between"
                >
                    <div>
                        <p className="text-sm font-medium text-success-700">Next Settlement</p>
                        <p className="text-2xl font-bold text-success-900 mt-1">{stats.next_settlement_date}</p>
                        <p className="text-sm text-success-600 mt-1">Commissions earned this month will be settled on this date.</p>
                    </div>
                    <Link
                        href="/partner/earnings"
                        className="rounded-xl bg-success-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-success-700 transition-colors"
                    >
                        View Earnings →
                    </Link>
                </motion.div>

                {/* Account Information Card */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                    className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
                >
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">Account Information</h2>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600">Full Name</label>
                            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-600">Email Address</label>
                            <p className="text-lg font-semibold text-gray-900">{user.email}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Getting Started Section */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="rounded-2xl border border-primary-200 bg-linear-to-br from-primary-50 to-primary-100/50 p-8"
                >
                    <h2 className="mb-4 text-2xl font-bold text-primary-900">How commissions work</h2>
                    <p className="mb-6 text-primary-700">
                        You earn a commission on every payment made by residents of estates you referred, for the first{' '}
                        {stats.commission_length ? `${stats.commission_length} months` : 'lifetime'}{' '}
                        after the estate activates on Kontrol.
                    </p>
                    <ol className="space-y-3 text-primary-700">
                        <li className="flex gap-3">
                            <span className="font-semibold">1.</span>
                            <span>Submit estate onboarding requests via Partner Requests</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">2.</span>
                            <span>Our team reviews, creates, and activates the estate on Kontrol</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">3.</span>
                            <span>Earn commissions on resident payments for {stats.commission_length ? `${stats.commission_length} months` : 'always'} from activation</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="font-semibold">4.</span>
                            <span>Commissions are settled monthly — view them in the Earnings section</span>
                        </li>
                    </ol>
                </motion.div>
            </motion.div>
        </PartnerLayout>
    );
}
