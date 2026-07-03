import { Deferred, Head } from '@inertiajs/react';
import { Download, FileText, Plus, Activity, Table, Shield, AlertTriangle, AlertCircle, RefreshCcw, Landmark, Clock } from 'lucide-react';
import { type ReactNode, useState, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';
import ActivityFeed from '@/Components/Admin/Transactions/ActivityFeed';
import LedgerCharts from '@/Components/Admin/Transactions/LedgerCharts';
import LedgerEmptyState from '@/Components/Admin/Transactions/LedgerEmptyState';
import LedgerFilters from '@/Components/Admin/Transactions/LedgerFilters';
import RecordOfflinePaymentModal from '@/Components/Admin/Transactions/RecordOfflinePaymentModal';
import TodaySummary from '@/Components/Admin/Transactions/TodaySummary';
import TransactionDrawer from '@/Components/Admin/Transactions/TransactionDrawer';
import TransactionsTable from '@/Components/Admin/Transactions/TransactionsTable';
import AdminLayout from '@/Layouts/AdminLayout';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface RecordableAssignment {
    id: number;
    resident_name: string | null;
    collection_name: string | null;
    remaining: number;
}

interface Transaction {
    ulid: string;
    reference_number: string;
    gateway_reference: string | null;
    type: string;
    type_label: string;
    status: string;
    status_label: string;
    amount: number;
    direction: string;
    payment_method_label: string | null;
    provider: string | null;
    created_at: string | null;
    resident: { name: string } | null;
    collection: { name: string } | null;
}

interface Props {
    todaySummary?: {
        money_in_today: number;
        money_out_today: number;
        pending_today: number;
        failed_today: number;
    };
    activity?: Array<{
        id: string;
        headline: string;
        type: string;
        direction: string;
        status: string;
        amount: number;
        description: string | null;
        reason: string | null;
        failure_reason: string | null;
        reference_number: string;
        payment_method_label: string | null;
        resident_name: string | null;
        collection_name: string | null;
        coupon_code: string | null;
        occurred_at: string | null;
        time_ago: string | null;
    }>;
    charts?: Record<string, unknown> | null;
    hasTransactions: boolean;
    recordableAssignments: RecordableAssignment[];
    transactions: {
        data: Transaction[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
    filterOptions: Record<string, unknown>;
    permissions: {
        export: boolean;
        refund: boolean;
        adjust: boolean;
        record_offline: boolean;
        view_receipts: boolean;
        download_receipts: boolean;
        audit: boolean;
        reports: boolean;
    };
}

const fmtCompact = (n: number) => {
    const value = n / 100;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}k`;
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
};

export default function TransactionsIndex({
    todaySummary,
    activity,
    charts,
    hasTransactions,
    recordableAssignments,
    transactions,
    filters,
    filterOptions,
    permissions,
}: Props) {
    const [selectedUlid, setSelectedUlid] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [offlineModalOpen, setOfflineModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'feed' | 'table'>('feed');

    const canExport = hasTransactions && transactions.total > 0;

    const openTransaction = (ulid: string) => {
        setSelectedUlid(ulid);
        setDrawerOpen(true);
    };

    const handleExport = () => {
        if (!canExport) return;
        const params = new URLSearchParams(filters as Record<string, string>);
        window.location.href = `${TransactionController.export.url()}?${params.toString()}`;
    };

    const showEmpty = !hasTransactions && transactions.data.length === 0;

    // Derived Financial Statistics
    const moneyInToday = todaySummary?.money_in_today ?? 0;
    const moneyOutToday = todaySummary?.money_out_today ?? 0;
    const netToday = moneyInToday - moneyOutToday;

    return (
        <>
            <Head title="Transactions Ledger" />

            <div className="space-y-6">
                {/* ─── Premium Header Card (Financial Command Center Design) ─── */}
                <div className="relative overflow-hidden rounded-3xl bg-[#0A0F1C] p-7 text-white shadow-2xl ring-1 ring-white/5 sm:p-9">
                    {/* Radial Glow FX */}
                    <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/20 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />

                    <div className="relative z-10">
                        {/* Title and Top Actions */}
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                        Live Ledger
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white/60 uppercase">
                                        <Landmark className="h-3 w-3" /> Audit Log
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Transactions</h1>
                                <p className="mt-1 text-sm text-white/55">The central financial operating system and ledger for your estate.</p>
                            </div>

                            {/* Main CTA actions inside the dark card */}
                            <div className="flex flex-wrap gap-2 sm:self-start">
                                {permissions.record_offline && (
                                    <button
                                        type="button"
                                        onClick={() => setOfflineModalOpen(true)}
                                        className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0A3D91] transition-all hover:bg-blue-50 active:scale-95"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Record Offline
                                    </button>
                                )}
                                {permissions.export && (
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        disabled={!canExport}
                                        className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Export
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Revenue/Transaction Stats Pillars */}
                        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 sm:gap-6">
                            <div>
                                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-emerald-300/60 uppercase">Money In Today</p>
                                <p className="text-xl font-black tracking-tight text-white sm:text-2xl">
                                    {fmtCompact(moneyInToday)}
                                </p>
                            </div>
                            <div>
                                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-white/40 uppercase">Refunds Today</p>
                                <p className="text-xl font-black tracking-tight text-white/70 sm:text-2xl">
                                    {fmtCompact(moneyOutToday)}
                                </p>
                            </div>
                            <div>
                                <p className="mb-0.5 text-[10px] font-bold tracking-widest text-blue-400/65 uppercase">Net Today</p>
                                <p className={cn("text-xl font-black tracking-tight sm:text-2xl", netToday >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {fmtCompact(netToday)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Main Content Canvas ─── */}
                {showEmpty ? (
                    <LedgerEmptyState
                        canRecordOffline={permissions.record_offline}
                        onRecordOffline={() => setOfflineModalOpen(true)}
                    />
                ) : (
                    <div className="space-y-6">
                        {/* Progressive Search & Filters */}
                        <div className="rounded-3xl border border-slate-100 bg-white p-5 ring-1 ring-slate-100/50">
                            <LedgerFilters filters={filters} filterOptions={filterOptions as never} />
                        </div>

                        {/* Switch View Controls */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-1 bg-slate-100/75 p-1 rounded-xl w-fit">
                                <button
                                    onClick={() => setViewMode('feed')}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all ${
                                        viewMode === 'feed'
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <Activity className="h-3 w-3" /> Timeline Feed
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white text-slate-900 shadow-xs'
                                            : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <Table className="h-3 w-3" /> Accountant Table
                                </button>
                            </div>
                            <span className="text-xs font-bold text-slate-400">
                                Showing {transactions.total.toLocaleString()} transactions
                            </span>
                        </div>

                        {/* View Switch rendering */}
                        {viewMode === 'feed' ? (
                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Live Activity Feed</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-350 uppercase">Grouped by Date</span>
                                </div>
                                <Deferred data="activity" fallback={<ActivityFeed loading />}>
                                    <ActivityFeed entries={activity as never} onSelect={openTransaction} />
                                </Deferred>
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                                <TransactionsTable
                                    transactions={transactions}
                                    onSelect={(tx) => openTransaction(tx.ulid)}
                                    permissions={{ export: permissions.export, download_receipts: permissions.download_receipts }}
                                />
                            </div>
                        )}

                        {/* Financial Charts */}
                        {permissions.reports && (
                            <Deferred data="charts" fallback={<LedgerCharts loading />}>
                                <LedgerCharts data={charts as never} />
                            </Deferred>
                        )}
                    </div>
                )}
            </div>

            <RecordOfflinePaymentModal
                isOpen={offlineModalOpen}
                onClose={() => setOfflineModalOpen(false)}
                assignments={recordableAssignments}
            />

            <TransactionDrawer
                transactionUlid={selectedUlid}
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                permissions={{
                    refund: permissions.refund,
                    adjust: permissions.adjust,
                    audit: permissions.audit,
                    download_receipts: permissions.download_receipts,
                }}
            />
        </>
    );
}

TransactionsIndex.layout = (page: ReactNode) => <AdminLayout children={page} title="Transactions" />;
