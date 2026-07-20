import { Deferred, Head } from '@inertiajs/react';
import { Download, FileText, Plus, Activity, Table, Shield, AlertTriangle, AlertCircle, RefreshCcw, Landmark, Clock, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { type ReactNode, useState, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

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

interface AuditLogEntry {
    id: number;
    action: string;
    reason: string | null;
    user_name: string;
    reference_number: string | null;
    transaction_ulid: string | null;
    created_at: string;
    ip_address: string;
    user_agent: string;
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
    audits?: {
        data: AuditLogEntry[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    maxAmountLimit: number;
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
    audits,
    hasTransactions,
    recordableAssignments,
    transactions,
    filters,
    filterOptions,
    permissions,
    maxAmountLimit,
}: Props) {
    const [selectedUlid, setSelectedUlid] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [offlineModalOpen, setOfflineModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'activity' | 'ledger' | 'reports' | 'audit'>('activity');

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

    // Derived Summary Phrases
    const moneyInToday = todaySummary?.money_in_today ?? 0;
    const refundsTodayCount = todaySummary?.money_out_today ? 1 : 0; // Simple approximation for phrase
    const successPaymentsCount = activity?.filter(a => {
        const occurredToday = a.occurred_at && new Date(a.occurred_at).toDateString() === new Date().toDateString();
        return occurredToday && a.status === 'success';
    }).length ?? 0;
    const failedTodayCount = todaySummary?.failed_today ?? 0;

    const summaryPhrase = useMemo(() => {
        if (!todaySummary) return 'Loading daily statistics...';
        const parts = [];
        if (successPaymentsCount > 0) {
            parts.push(`${successPaymentsCount} payment${successPaymentsCount === 1 ? ' was' : 's were'} received today.`);
        } else {
            parts.push('No payments received today.');
        }
        if (moneyInToday > 0) {
            parts.push(`${fmtCompact(moneyInToday)} entered the estate.`);
        }
        if (refundsTodayCount > 0) {
            parts.push(`${refundsTodayCount} refund${refundsTodayCount === 1 ? ' was' : 's were'} processed.`);
        }
        if (failedTodayCount > 0) {
            parts.push(`${failedTodayCount} failed payment${failedTodayCount === 1 ? ' requires' : 's require'} attention.`);
        }
        return parts.join(' ');
    }, [todaySummary, moneyInToday, successPaymentsCount, refundsTodayCount, failedTodayCount]);

    return (
        <>
            <Head title="Financial Operating System" />

            <div className="space-y-6">
                {/* ─── Financial Command Center Header ─── */}
                <div className="relative overflow-hidden rounded-3xl bg-[#0A0F1C] p-7 text-white shadow-2xl ring-1 ring-white/5 sm:p-9">
                    {/* Radial Glows */}
                    <div className="pointer-events-none absolute -top-32 -right-32 h-64 w-64 rounded-full bg-indigo-500/20 blur-[80px]" />
                    <div className="pointer-events-none absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />

                    <div className="relative z-10">
                        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                            <div>
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                                        Live Ledger
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-widest text-white/60 uppercase">
                                        <Landmark className="h-3 w-3" /> F.O.S
                                    </span>
                                </div>
                                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Transactions</h1>
                                <p className="mt-1.5 text-xs text-white/50 max-w-xl leading-relaxed">{summaryPhrase}</p>
                            </div>

                            {/* CTAs */}
                            <div className="flex flex-wrap gap-2 sm:self-start">
                                {permissions.record_offline && (
                                    <button
                                        type="button"
                                        onClick={() => setOfflineModalOpen(true)}
                                        className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#0A3D91] transition hover:bg-blue-50 active:scale-95"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Record Offline
                                    </button>
                                )}
                                {permissions.export && (
                                    <button
                                        type="button"
                                        onClick={handleExport}
                                        disabled={!canExport}
                                        className="flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Download className="h-3.5 w-3.5" /> Export
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Main Workspace Shell ─── */}
                {showEmpty ? (
                    <LedgerEmptyState
                        canRecordOffline={permissions.record_offline}
                        onRecordOffline={() => setOfflineModalOpen(true)}
                    />
                ) : (
                    <div className="space-y-6">
                        {/* Search & Collapse Filter Box */}
                        <div className="rounded-3xl border border-slate-100 bg-white p-5 ring-1 ring-slate-100/50">
                            <LedgerFilters filters={filters} filterOptions={filterOptions as never} maxAmountLimit={maxAmountLimit} />
                        </div>

                        {/* Premium Navigation Tabs */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-1 bg-slate-100/75 p-1 rounded-xl w-full sm:w-fit overflow-x-auto whitespace-nowrap scrollbar-none">
                                <button
                                    onClick={() => setActiveTab('activity')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg px-4.5 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all shrink-0",
                                        activeTab === 'activity' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    )}
                                >
                                    <Activity className="h-3.5 w-3.5" /> Activity
                                </button>
                                <button
                                    onClick={() => setActiveTab('ledger')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-lg px-4.5 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all shrink-0",
                                        activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    )}
                                >
                                    <Table className="h-3.5 w-3.5" /> Ledger
                                </button>
                                {permissions.reports && (
                                    <button
                                        onClick={() => setActiveTab('reports')}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-4.5 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all shrink-0",
                                            activeTab === 'reports' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                        )}
                                    >
                                        <FileText className="h-3.5 w-3.5" /> Reports
                                    </button>
                                )}
                                {permissions.audit && (
                                    <button
                                        onClick={() => setActiveTab('audit')}
                                        className={cn(
                                            "flex items-center gap-1.5 rounded-lg px-4.5 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all shrink-0",
                                            activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                        )}
                                    >
                                        <Shield className="h-3.5 w-3.5" /> Audit Log
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content Switching Area */}
                        {activeTab === 'activity' && (
                            <div className="space-y-4">
                                <div className="mb-2 flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-slate-400" />
                                        <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Live Activity Feed</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-350 uppercase">Timeline Events</span>
                                </div>
                                <Deferred data="activity" fallback={<ActivityFeed loading />}>
                                    <ActivityFeed entries={activity as never} onSelect={openTransaction} />
                                </Deferred>
                            </div>
                        )}

                        {activeTab === 'ledger' && (
                            <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden shadow-xs">
                                <TransactionsTable
                                    transactions={transactions}
                                    onSelect={(tx) => openTransaction(tx.ulid)}
                                    permissions={{ export: permissions.export, download_receipts: permissions.download_receipts }}
                                />
                            </div>
                        )}

                        {activeTab === 'reports' && permissions.reports && (
                            <Deferred data="charts" fallback={<LedgerCharts loading />}>
                                <LedgerCharts data={charts as never} />
                            </Deferred>
                        )}

                        {activeTab === 'audit' && permissions.audit && (
                            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm overflow-hidden">
                                <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                                    <Shield className="h-4.5 w-4.5 text-slate-400" />
                                    <h3 className="text-xs font-black tracking-widest text-slate-400 uppercase">Traceability Audit Trail</h3>
                                </div>
                                <Deferred data="audits" fallback={<div className="space-y-3"><div className="h-10 bg-slate-50 animate-pulse rounded-xl" /></div>}>
                                    {audits && audits.data.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {audits.data.map((audit) => (
                                                <div key={audit.id} className="py-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-slate-800 uppercase text-[10px] tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {audit.action}
                                                            </span>
                                                            {audit.reference_number && (
                                                                <button
                                                                    onClick={() => audit.transaction_ulid && openTransaction(audit.transaction_ulid)}
                                                                    className="font-mono text-slate-500 hover:text-blue-600 transition font-bold"
                                                                >
                                                                    {audit.reference_number}
                                                                </button>
                                                            )}
                                                        </div>
                                                        {audit.reason && (
                                                            <p className="text-slate-500 font-semibold mt-1">"{audit.reason}"</p>
                                                        )}
                                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                                            Authorized by {audit.user_name} • {audit.created_at ? format(parseISO(audit.created_at), 'PPpp') : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 text-right sm:self-start font-semibold">
                                                        <p className="font-mono">{audit.ip_address}</p>
                                                        <p className="truncate max-w-[200px] text-slate-350">{audit.user_agent}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-xs text-slate-400 font-semibold py-6">No audits recorded yet</p>
                                    )}
                                </Deferred>
                            </div>
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
