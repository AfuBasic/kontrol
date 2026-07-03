import { Deferred, Head } from '@inertiajs/react';
import { Activity, Download, FileText, Plus, Receipt } from 'lucide-react';
import { type ReactNode, useState } from 'react';

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

    const actionButtonClass = (enabled: boolean) =>
        `inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black tracking-widest uppercase transition ${
            enabled
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:scale-95'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
        }`;

    return (
        <>
            <Head title="Transactions" />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
                {/* Clean Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-900">Transactions</h1>
                        <p className="mt-1 text-sm text-slate-400">Every financial movement across your estate.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {permissions.record_offline && (
                            <button
                                type="button"
                                onClick={() => setOfflineModalOpen(true)}
                                className={actionButtonClass(true)}
                            >
                                <Plus className="h-4 w-4" />
                                Record Offline Payment
                            </button>
                        )}
                        {permissions.export && (
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={!canExport}
                                className={actionButtonClass(canExport)}
                                title={canExport ? 'Export transactions' : 'No transactions to export'}
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </button>
                        )}
                        {permissions.reports && (
                            <button
                                type="button"
                                onClick={handleExport}
                                disabled={!canExport}
                                className={actionButtonClass(canExport)}
                                title={canExport ? 'Generate report' : 'No transactions to report'}
                            >
                                <FileText className="h-4 w-4" />
                                Report
                            </button>
                        )}
                    </div>
                </div>

                {/* Today Inline Summary bar */}
                <Deferred data="todaySummary" fallback={<TodaySummary loading />}>
                    <TodaySummary summary={todaySummary} />
                </Deferred>

                {/* Main Content Area */}
                {showEmpty ? (
                    <LedgerEmptyState
                        canRecordOffline={permissions.record_offline}
                        onRecordOffline={() => setOfflineModalOpen(true)}
                    />
                ) : (
                    <div className="space-y-6">
                        {/* Interactive Filter block */}
                        <LedgerFilters filters={filters} filterOptions={filterOptions as never} />

                        {/* Hero Section: Financial Activity timeline feed */}
                        <section className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Activity className="h-4 w-4" />
                                <h2 className="text-xs font-black tracking-widest uppercase">Financial Activity Feed</h2>
                            </div>
                            <Deferred data="activity" fallback={<ActivityFeed loading />}>
                                <ActivityFeed entries={activity as never} onSelect={openTransaction} />
                            </Deferred>
                        </section>

                        {/* Secondary Section: Audit Ledger Table (For accountants) */}
                        <section className="pt-4 border-t border-slate-100">
                            <TransactionsTable
                                transactions={transactions}
                                onSelect={(tx) => openTransaction(tx.ulid)}
                                permissions={{ export: permissions.export, download_receipts: permissions.download_receipts }}
                            />
                        </section>

                        {/* focused Cash flow Trend charts */}
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