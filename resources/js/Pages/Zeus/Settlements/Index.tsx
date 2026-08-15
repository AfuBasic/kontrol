import { ArrowPathIcon, BanknotesIcon, CheckCircleIcon, ClockIcon, MagnifyingGlassIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import ConfirmationModal from '@/Components/ConfirmationModal';
import ZeusLayout from '@/Layouts/ZeusLayout';

interface EarningRow {
    id: number;
    partner_id: number;
    partner_name: string;
    month: string;
    month_label: string;
    is_current_month: boolean;
    total_amount: number;
    revenue_amount: number;
    revenue_count: number;
    settled_at: string | null;
    settled_at_human: string | null;
    payment_reference: string | null;
    payment_reference_masked: string | null;
    payment_note: string | null;
    settled_by: string | null;
    status: 'accruing' | 'pending' | 'paid';
    status_label: string;
    is_settled: boolean;
    is_pending: boolean;
    is_accruing: boolean;
}

interface PaginatedEarnings {
    data: EarningRow[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Summary {
    outstanding_kobo: number;
    partners_with_balance: number;
    unsettled_count: number;
}

interface StatusOption {
    value: string;
    label: string;
}

interface Props {
    earnings: PaginatedEarnings;
    summary: Summary;
    filters: {
        status: string;
        partner: string;
        month_from: string;
        month_to: string;
    };
    statusOptions: StatusOption[];
}

function formatAmount(kobo: number): string {
    return (
        '₦' +
        (kobo / 100).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

function StatusBadge({ earning }: { earning: EarningRow }) {
    if (earning.is_settled) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#34D399]/20 bg-[#34D399]/10 px-2.5 py-1 text-xs font-semibold text-[#34D399] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34D399]" />
                Paid
            </span>
        );
    }

    if (earning.is_accruing) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" />
                Accruing
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F5A623]/20 bg-[#F5A623]/10 px-2.5 py-1 text-xs font-semibold text-[#F5A623] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
            Pending
        </span>
    );
}

export default function SettlementsIndex({ earnings, summary, filters, statusOptions }: Props) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const [partner, setPartner] = useState(filters.partner || '');
    const [status, setStatus] = useState(filters.status || '');
    const [monthFrom, setMonthFrom] = useState(filters.month_from ? filters.month_from.slice(0, 7) : '');
    const [monthTo, setMonthTo] = useState(filters.month_to ? filters.month_to.slice(0, 7) : '');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [payTarget, setPayTarget] = useState<EarningRow | 'bulk' | null>(null);
    const [snapshotting, setSnapshotting] = useState(false);

    const payForm = useForm({
        payment_reference: '',
        payment_note: '',
        earning_ids: [] as number[],
    });

    const payableRows = useMemo(() => earnings.data.filter((e) => !e.is_settled && !e.is_accruing), [earnings.data]);

    function applyFilters(overrides: Partial<typeof filters> = {}) {
        router.get(
            '/zeus/settlements',
            {
                partner: overrides.partner ?? partner,
                status: overrides.status ?? status,
                month_from: (overrides.month_from ?? (monthFrom ? `${monthFrom}-01` : '')) || undefined,
                month_to: (overrides.month_to ?? (monthTo ? `${monthTo}-01` : '')) || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    function toggleSelect(id: number) {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function toggleSelectAll() {
        if (selectedIds.length === payableRows.length) {
            setSelectedIds([]);
            return;
        }
        setSelectedIds(payableRows.map((e) => e.id));
    }

    function openPay(earning: EarningRow) {
        payForm.setData({
            payment_reference: '',
            payment_note: '',
            earning_ids: [earning.id],
        });
        setPayTarget(earning);
    }

    function openBulkPay() {
        if (selectedIds.length === 0) {
            return;
        }
        payForm.setData({
            payment_reference: '',
            payment_note: '',
            earning_ids: selectedIds,
        });
        setPayTarget('bulk');
    }

    function confirmPay() {
        if (payTarget === 'bulk') {
            payForm.post('/zeus/settlements/bulk-pay', {
                preserveScroll: true,
                onSuccess: () => {
                    setPayTarget(null);
                    setSelectedIds([]);
                    payForm.reset();
                },
            });
            return;
        }

        if (payTarget) {
            payForm.post(`/zeus/settlements/${payTarget.id}/pay`, {
                preserveScroll: true,
                onSuccess: () => {
                    setPayTarget(null);
                    setSelectedIds((ids) => ids.filter((id) => id !== payTarget.id));
                    payForm.reset();
                },
            });
        }
    }

    function refreshSnapshot() {
        setSnapshotting(true);
        router.post(
            '/zeus/earnings/snapshot',
            {},
            {
                preserveScroll: true,
                onFinish: () => setSnapshotting(false),
            },
        );
    }

    const payTitle =
        payTarget === 'bulk' ? `Settle ${selectedIds.length} period(s)` : payTarget ? `Mark ${payTarget.month_label} as paid` : 'Mark as paid';

    const payMessage =
        payTarget === 'bulk'
            ? 'Confirm payment for the selected unsettled periods. This records the transfer and notifies partners.'
            : payTarget
              ? `Confirm payment of ${formatAmount(payTarget.total_amount)} to ${payTarget.partner_name} for ${payTarget.month_label}.`
              : '';

    return (
        <ZeusLayout>
            <Head title="Settlements" />

            <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 text-[#F2F3F6]">
                <div className="pointer-events-none absolute top-0 right-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-[#6C5DFD]/5 to-[#A78BFA]/5 blur-[120px] duration-[8000ms]" />

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-wider text-[#9297A8] uppercase">Finance</p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#F2F3F6]">Settlements</h1>
                        <p className="mt-1 text-sm text-[#9297A8]">Review partner commission balances and mark transfers as paid.</p>
                    </div>
                    <button
                        type="button"
                        onClick={refreshSnapshot}
                        disabled={snapshotting}
                        className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] px-4 py-2.5 text-xs font-bold text-white shadow transition-colors hover:border-[#6C5DFD]/40 hover:bg-[#6C5DFD]/10 disabled:opacity-60"
                    >
                        <ArrowPathIcon className={`h-4 w-4 ${snapshotting ? 'animate-spin' : ''}`} />
                        {snapshotting ? 'Queuing…' : 'Refresh Snapshot'}
                    </button>
                </div>

                {(flash?.success || flash?.error) && (
                    <div
                        className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                            flash.success ? 'border-[#34D399]/20 bg-[#34D399]/10 text-[#34D399]' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                        }`}
                    >
                        {flash.success || flash.error}
                    </div>
                )}

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid gap-6 sm:grid-cols-3"
                >
                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#F5A623]/5 blur-xl" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Outstanding</span>
                        <div className="mt-4 text-3xl font-black text-[#F5A623]">{formatAmount(summary.outstanding_kobo)}</div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#F5A623]">
                            <BanknotesIcon className="h-3.5 w-3.5" />
                            Unsettled commission total
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-[#6C5DFD]/5 blur-xl" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Partners with balance</span>
                        <div className="mt-4 text-3xl font-black text-[#F2F3F6]">{summary.partners_with_balance}</div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-[#6C5DFD]">
                            <UserGroupIcon className="h-3.5 w-3.5" />
                            Awaiting payment
                        </div>
                    </div>

                    <div className="group relative overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-6 shadow-2xl">
                        <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full bg-sky-500/10 blur-xl" />
                        <span className="text-xs font-bold tracking-wider text-[#9297A8] uppercase">Unsettled periods</span>
                        <div className="mt-4 text-3xl font-black text-[#F2F3F6]">{summary.unsettled_count}</div>
                        <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-sky-300">
                            <ClockIcon className="h-3.5 w-3.5" />
                            Month rows open
                        </div>
                    </div>
                </motion.div>

                <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] p-4 shadow-2xl sm:p-5">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilters();
                        }}
                        className="flex flex-col gap-3 lg:flex-row lg:items-end"
                    >
                        <div className="flex-1">
                            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#9297A8] uppercase">Partner</label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9297A8]" />
                                <input
                                    type="search"
                                    value={partner}
                                    onChange={(e) => setPartner(e.target.value)}
                                    placeholder="Search partner name"
                                    className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] py-2.5 pr-3 pl-9 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD] focus:ring-1 focus:ring-[#6C5DFD]"
                                />
                            </div>
                        </div>
                        <div className="w-full lg:w-48">
                            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#9297A8] uppercase">Status</label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    setStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2.5 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD]"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value || 'all'} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full lg:w-40">
                            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#9297A8] uppercase">From</label>
                            <input
                                type="month"
                                value={monthFrom}
                                onChange={(e) => setMonthFrom(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2.5 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD]"
                            />
                        </div>
                        <div className="w-full lg:w-40">
                            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-[#9297A8] uppercase">To</label>
                            <input
                                type="month"
                                value={monthTo}
                                onChange={(e) => setMonthTo(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0B10] px-3 py-2.5 text-sm text-[#F2F3F6] outline-none focus:border-[#6C5DFD]"
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-xl bg-[#6C5DFD] px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-[#6C5DFD]/90"
                        >
                            Apply
                        </button>
                    </form>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="overflow-hidden rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[#12141C] shadow-2xl"
                >
                    <div className="flex flex-col gap-3 border-b border-[rgba(255,255,255,0.08)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-[#F2F3F6]">Settlement inbox</h2>
                            <p className="mt-0.5 text-xs text-[#9297A8]">
                                {earnings.total} record{earnings.total !== 1 ? 's' : ''}
                                {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ''}
                            </p>
                        </div>
                        {selectedIds.length > 0 && (
                            <button
                                type="button"
                                onClick={openBulkPay}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#34D399]/15 px-4 py-2 text-xs font-bold text-[#34D399] ring-1 ring-[#34D399]/30 hover:bg-[#34D399]/25"
                            >
                                <CheckCircleIcon className="h-4 w-4" />
                                Settle selected ({selectedIds.length})
                            </button>
                        )}
                    </div>

                    {earnings.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <BanknotesIcon className="mx-auto mb-4 h-12 w-12 text-gray-700" />
                            <p className="font-medium text-[#9297A8]">No settlement records match</p>
                            <p className="mt-1 text-xs text-gray-500">Try Refresh Snapshot or adjust filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-[rgba(255,255,255,0.08)] text-xs font-semibold tracking-wider text-[#9297A8] uppercase">
                                    <tr>
                                        <th className="px-4 py-4 sm:px-6">
                                            <input
                                                type="checkbox"
                                                checked={payableRows.length > 0 && selectedIds.length === payableRows.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-white/20 bg-transparent"
                                                aria-label="Select all payable"
                                            />
                                        </th>
                                        <th className="px-4 py-4 sm:px-6">Partner</th>
                                        <th className="px-4 py-4">Period</th>
                                        <th className="px-4 py-4 text-right">Gross revenue</th>
                                        <th className="px-4 py-4 text-right">Commission due</th>
                                        <th className="px-4 py-4 text-center">Revenues</th>
                                        <th className="px-4 py-4 text-center">Status</th>
                                        <th className="px-4 py-4 text-right sm:px-6">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                                    {earnings.data.map((earning) => {
                                        const canPay = !earning.is_settled && !earning.is_accruing;
                                        return (
                                            <tr key={earning.id} className="transition-colors hover:bg-white/[0.02]">
                                                <td className="px-4 py-4 sm:px-6">
                                                    {canPay ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(earning.id)}
                                                            onChange={() => toggleSelect(earning.id)}
                                                            className="rounded border-white/20 bg-transparent"
                                                            aria-label={`Select ${earning.partner_name} ${earning.month_label}`}
                                                        />
                                                    ) : (
                                                        <span className="inline-block w-4" />
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 font-bold text-[#F2F3F6] sm:px-6">{earning.partner_name}</td>
                                                <td className="px-4 py-4 text-[#9297A8]">
                                                    {earning.month_label}
                                                    {earning.is_current_month && (
                                                        <span className="ml-2 text-[10px] font-bold tracking-wide text-amber-300 uppercase">
                                                            Live
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right text-[#9297A8] tabular-nums">
                                                    {formatAmount(earning.revenue_amount)}
                                                </td>
                                                <td className="px-4 py-4 text-right font-black text-[#F2F3F6] tabular-nums">
                                                    {formatAmount(earning.total_amount)}
                                                </td>
                                                <td className="px-4 py-4 text-center text-[#9297A8] tabular-nums">{earning.revenue_count}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <StatusBadge earning={earning} />
                                                    {earning.is_settled && earning.payment_reference_masked && (
                                                        <p className="mt-1 text-[10px] text-[#9297A8]">Ref {earning.payment_reference_masked}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right sm:px-6">
                                                    {canPay ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => openPay(earning)}
                                                            className="rounded-lg bg-[#34D399]/15 px-3 py-1.5 text-xs font-bold text-[#34D399] ring-1 ring-[#34D399]/25 hover:bg-[#34D399]/25"
                                                        >
                                                            Mark as Paid
                                                        </button>
                                                    ) : earning.is_settled ? (
                                                        <span className="text-xs text-[#9297A8]">{earning.settled_at_human ?? 'Paid'}</span>
                                                    ) : (
                                                        <span className="text-xs text-[#9297A8]">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {earnings.last_page > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-[rgba(255,255,255,0.08)] px-4 py-4">
                            {earnings.links.map((link, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                        link.active ? 'bg-[#6C5DFD] text-white' : 'text-[#9297A8] hover:bg-white/5 disabled:opacity-40'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <ConfirmationModal
                isOpen={payTarget !== null}
                onClose={() => {
                    if (!payForm.processing) {
                        setPayTarget(null);
                        payForm.reset();
                        payForm.clearErrors();
                    }
                }}
                onConfirm={confirmPay}
                title={payTitle}
                message={payMessage}
                confirmLabel={payForm.processing ? 'Saving…' : 'Confirm payment'}
                type="info"
                isLoading={payForm.processing}
            >
                <div className="mt-4 space-y-3 text-left">
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-slate-300">
                            Payment reference <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={payForm.data.payment_reference}
                            onChange={(e) => payForm.setData('payment_reference', e.target.value)}
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-[#0A0B10] dark:text-white"
                            placeholder="Bank transfer / receipt ref"
                            required
                        />
                        {payForm.errors.payment_reference && <p className="mt-1 text-xs text-rose-500">{payForm.errors.payment_reference}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold text-stone-600 dark:text-slate-300">Note (optional)</label>
                        <textarea
                            value={payForm.data.payment_note}
                            onChange={(e) => payForm.setData('payment_note', e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-white/10 dark:bg-[#0A0B10] dark:text-white"
                            placeholder="Optional context for audit trail"
                        />
                    </div>
                    {(payForm.errors as any).earning && <p className="text-xs text-rose-500">{(payForm.errors as any).earning}</p>}
                </div>
            </ConfirmationModal>
        </ZeusLayout>
    );
}
