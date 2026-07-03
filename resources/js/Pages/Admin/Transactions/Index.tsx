import { Deferred, Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Activity, Landmark } from 'lucide-react';
import { useState } from 'react';

import TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';
import FinancialHero from '@/Components/Admin/Transactions/FinancialHero';
import InsightsPanel from '@/Components/Admin/Transactions/InsightsPanel';
import MoneyFlowChart from '@/Components/Admin/Transactions/MoneyFlowChart';
import QuickActions from '@/Components/Admin/Transactions/QuickActions';
import TransactionDrawer from '@/Components/Admin/Transactions/TransactionDrawer';
import TransactionFilters from '@/Components/Admin/Transactions/TransactionFilters';
import TransactionTimeline from '@/Components/Admin/Transactions/TransactionTimeline';
import TransactionsTable from '@/Components/Admin/Transactions/TransactionsTable';

interface Transaction {
    ulid: string;
    reference_number: string;
    gateway_reference: string | null;
    type_label: string;
    status: string;
    status_label: string;
    amount: number;
    payment_method_label: string | null;
    provider: string | null;
    created_at: string | null;
    resident: { name: string } | null;
    collection: { name: string } | null;
    created_by: { name: string } | null;
}

interface Props {
    hero?: any;
    timeline?: any[];
    moneyFlow?: any[];
    insights?: any[];
    transactions: {
        data: Transaction[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: Record<string, string>;
    filterOptions: any;
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

export default function TransactionsIndex({ hero, timeline, moneyFlow, insights, transactions, filters, filterOptions, permissions }: Props) {
    const [selectedUlid, setSelectedUlid] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const openTransaction = (transaction: Transaction) => {
        setSelectedUlid(transaction.ulid);
        setDrawerOpen(true);
    };

    const handleExport = () => {
        const params = new URLSearchParams(filters as Record<string, string>);
        window.location.href = `${TransactionController.export.url()}?${params.toString()}`;
    };

    const handleRecordOffline = () => {
        router.visit(TransactionController.index.url(), { preserveScroll: true });
    };

    return (
        <>
            <Head title="Transactions" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A3D91] via-[#1F6FDB] to-[#4B9BFF] p-6 text-white shadow-xl sm:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                                <Landmark className="h-4 w-4" />
                                Financial Ledger
                            </div>
                            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Transactions</h1>
                            <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
                                The estate&apos;s financial operating system. Every movement of money — transparent, traceable, and secure.
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                            <div className="flex items-center gap-2 text-sm text-white/80">
                                <Activity className="h-4 w-4" />
                                Financial Overview
                            </div>
                            <p className="mt-1 text-2xl font-black">{transactions.total.toLocaleString()}</p>
                            <p className="text-xs text-white/70">total ledger entries</p>
                        </div>
                    </div>
                </motion.div>

                <Deferred data="hero" fallback={<FinancialHero loading />}>
                    <FinancialHero hero={hero} />
                </Deferred>

                <div className="grid gap-6 xl:grid-cols-3">
                    <div className="space-y-6 xl:col-span-2">
                        <TransactionFilters filters={filters} filterOptions={filterOptions} />
                        <TransactionsTable transactions={transactions} onSelect={openTransaction} />
                    </div>

                    <div className="space-y-6">
                        <QuickActions
                            permissions={permissions}
                            onExport={handleExport}
                            onRecordOffline={handleRecordOffline}
                            onCreateAdjustment={() => setDrawerOpen(true)}
                        />

                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Transaction Timeline</p>
                            <div className="mt-4">
                                <Deferred data="timeline" fallback={<TransactionTimeline loading />}>
                                    <TransactionTimeline entries={timeline} />
                                </Deferred>
                            </div>
                        </div>

                        <Deferred data="insights" fallback={<InsightsPanel loading />}>
                            <InsightsPanel insights={insights} />
                        </Deferred>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Deferred data="moneyFlow" fallback={<MoneyFlowChart loading />}>
                        <MoneyFlowChart data={moneyFlow} />
                    </Deferred>
                </div>
            </div>

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