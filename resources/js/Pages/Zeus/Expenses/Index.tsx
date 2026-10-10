import {
    AdjustmentsHorizontalIcon,
    ArchiveBoxIcon,
    ArrowDownTrayIcon,
    ArrowUturnLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    PaperClipIcon,
    PlusIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { Head, InfiniteScroll, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { exportMethod, index, restore, destroy as archiveExpense } from '@/actions/App/Http/Controllers/Zeus/ExpenseController';
import CategorySheet from '@/Components/Zeus/Expenses/CategorySheet';
import ExpenseSheet from '@/Components/Zeus/Expenses/ExpenseSheet';
import FilterSheet from '@/Components/Zeus/Expenses/FilterSheet';
import ReceiptViewer from '@/Components/Zeus/Expenses/ReceiptViewer';
import type { Category, ExpenseRow, Filters, Limits, Receipt, Summary } from '@/Components/Zeus/Expenses/types';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { currentMonth, dateParts, formatKobo, formatNaira, groupByMonth, monthLabel, shiftMonth } from '@/Lib/expenses';

type Props = {
    filters: Filters;
    expenses: { data: ExpenseRow[] };
    summary: Summary;
    categories: Category[];
    limits: Limits;
};

export default function ExpensesIndex({ filters, expenses, summary, categories, limits }: Props) {
    const [editing, setEditing] = useState<{ id: number | null } | null>(null);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [viewing, setViewing] = useState<Receipt | null>(null);
    const [undo, setUndo] = useState<{ id: number; payee: string } | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const rows = expenses.data;
    const groups = useMemo(() => groupByMonth(rows), [rows]);
    // Read the open expense from the live list so a removed receipt disappears from the sheet straight away.
    const editingExpense = editing?.id ? (rows.find((row) => row.id === editing.id) ?? null) : null;
    const allTime = filters.month === 'all';
    const isCurrentOrLater = !allTime && filters.month >= currentMonth();
    const hasNarrowing = Boolean(filters.category_id || filters.search || filters.archived);

    function visit(changes: Partial<Filters>) {
        const next = { ...filters, ...changes };
        router.get(
            index.url(),
            {
                month: next.month,
                ...(next.category_id ? { category_id: next.category_id } : {}),
                ...(next.search ? { search: next.search } : {}),
                ...(next.archived ? { archived: 1 } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true, reset: ['expenses'] },
        );
    }

    // Search as you type, but only once typing pauses.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        const handle = window.setTimeout(() => {
            if ((filters.search ?? '') !== search.trim()) visit({ search: search.trim() || null });
        }, 350);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // The snackbar offers Undo for a few seconds after an archive.
    useEffect(() => {
        if (!undo) return;
        const handle = window.setTimeout(() => setUndo(null), 7000);
        return () => window.clearTimeout(handle);
    }, [undo]);

    function archive(expense: ExpenseRow) {
        router.delete(archiveExpense.url(expense.id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => setUndo({ id: expense.id, payee: expense.payee }),
        });
    }

    function undoArchive(id: number) {
        setUndo(null);
        router.post(restore.url(id), {}, { preserveScroll: true, preserveState: true });
    }

    const exportQuery = {
        month: filters.month,
        ...(filters.category_id ? { category_id: filters.category_id } : {}),
        ...(filters.search ? { search: filters.search } : {}),
    };
    const spentShare = (total: number) => (summary.spent > 0 ? Math.max(4, Math.round((total / summary.spent) * 100)) : 0);

    return (
        <ZeusLayout>
            <Head title="Expenses" />

            <div className="mx-auto max-w-5xl pb-24">
                {/* Header */}
                <div className="pt-4">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Expenses</h1>
                    <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Every cost of running Kontrol, set against what comes in.</p>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setEditing({ id: null })}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-bold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500 active:scale-[0.98]"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add expense
                    </button>
                    <a
                        href={exportMethod.url({ query: exportQuery })}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Export CSV
                    </a>
                    <button
                        type="button"
                        onClick={() => setCategoriesOpen(true)}
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                        <TagIcon className="h-5 w-5" />
                        Categories
                    </button>
                </div>

                {/* Month, search, filters */}
                <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex min-h-11 flex-1 items-center justify-between rounded-xl border border-slate-700 bg-slate-800/40 px-1">
                            <button
                                type="button"
                                disabled={allTime}
                                onClick={() => visit({ month: shiftMonth(filters.month, -1) })}
                                aria-label="Previous month"
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 disabled:opacity-30"
                            >
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                            <span className="text-sm font-bold text-white">{allTime ? 'All time' : monthLabel(filters.month)}</span>
                            <button
                                type="button"
                                disabled={allTime || isCurrentOrLater}
                                onClick={() => visit({ month: shiftMonth(filters.month, 1) })}
                                aria-label="Next month"
                                className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/5 disabled:opacity-30"
                            >
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setFiltersOpen(true)}
                            className={`relative inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${hasNarrowing || allTime ? 'border-primary-500/50 bg-primary-500/10 text-primary-200' : 'border-slate-700 text-slate-200 hover:bg-white/5'}`}
                        >
                            <AdjustmentsHorizontalIcon className="h-5 w-5" />
                            Filters
                        </button>
                    </div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <label htmlFor="expense-search" className="sr-only">
                            Search by payee or note
                        </label>
                        <input
                            id="expense-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search payee or note"
                            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-800/40 py-2.5 pr-4 pl-11 text-base text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Headline */}
                <section aria-label="Summary" className="mt-6 rounded-3xl border border-slate-800/50 bg-[#0f1423] p-5 sm:p-6">
                    <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-6">
                        <Figure
                            label="Spent"
                            value={formatKobo(summary.spent)}
                            sub={`${summary.count} ${summary.count === 1 ? 'expense' : 'expenses'}`}
                            tone="text-white"
                        />
                        <Figure
                            label="Recurring revenue (MRR)"
                            value={summary.revenue === null ? '—' : formatNaira(summary.revenue)}
                            sub={summary.revenue === null ? 'Pick a month to compare' : 'Active subscriptions that month'}
                            tone="text-emerald-300"
                        />
                        <Figure
                            label="Net"
                            value={summary.net === null ? '—' : formatNaira(summary.net)}
                            sub={
                                summary.net === null
                                    ? 'Pick a month to compare'
                                    : summary.net >= 0
                                      ? 'Revenue left after spend'
                                      : 'Spend is ahead of revenue'
                            }
                            tone={summary.net === null ? 'text-slate-400' : summary.net >= 0 ? 'text-emerald-300' : 'text-rose-300'}
                        />
                    </div>

                    {summary.by_category.length > 0 && (
                        <div className="mt-5 border-t border-slate-800 pt-4">
                            <p className="mb-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Where it went</p>
                            <ul className="space-y-3">
                                {summary.by_category.slice(0, 6).map((row) => (
                                    <li key={row.id}>
                                        <div className="flex items-baseline justify-between gap-3">
                                            <span className="min-w-0 text-sm font-medium break-words text-slate-200">{row.name}</span>
                                            <span className="shrink-0 text-sm font-semibold whitespace-nowrap text-white tabular-nums">
                                                {formatKobo(row.total)}
                                            </span>
                                        </div>
                                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                            <div className="h-full rounded-full bg-primary-500" style={{ width: `${spentShare(row.total)}%` }} />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    <p className="mt-4 text-xs text-slate-500">MRR is modelled from active subscriptions and plan prices. It is not cash received.</p>
                </section>

                {/* List */}
                <section aria-label="Expenses" className="mt-6">
                    {filters.archived && (
                        <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100">
                            Showing archived expenses only. They are not counted above.
                        </p>
                    )}

                    {rows.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-slate-700 px-6 py-14 text-center">
                            <p className="text-base font-semibold text-white">
                                {hasNarrowing
                                    ? 'Nothing matches these filters'
                                    : allTime
                                      ? 'No expenses recorded yet'
                                      : `No expenses in ${monthLabel(filters.month)}`}
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                {hasNarrowing ? 'Try clearing a filter or changing the month.' : 'Write down the first one and it will show up here.'}
                            </p>
                            {!hasNarrowing && (
                                <button
                                    type="button"
                                    onClick={() => setEditing({ id: null })}
                                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-600 px-5 text-sm font-bold text-white"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    Add expense
                                </button>
                            )}
                        </div>
                    ) : (
                        <InfiniteScroll
                            data="expenses"
                            loading={
                                <div className="flex justify-center py-6" role="status" aria-label="Loading more expenses">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
                                </div>
                            }
                        >
                            <div className="space-y-6">
                                {groups.map((group) => (
                                    <div key={group.month}>
                                        <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                                            <h2 className="text-sm font-bold tracking-wide text-slate-300">{group.label}</h2>
                                            <span className="text-xs font-semibold whitespace-nowrap text-slate-500 tabular-nums">
                                                {formatKobo(group.total)}
                                            </span>
                                        </div>
                                        <ul className="divide-y divide-slate-800/70 overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0f1423]">
                                            {group.items.map((expense) => (
                                                <ExpenseItem
                                                    key={expense.id}
                                                    expense={expense}
                                                    onOpen={() => setEditing({ id: expense.id })}
                                                    onRestore={() => undoArchive(expense.id)}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </InfiniteScroll>
                    )}
                </section>
            </div>

            <ExpenseSheet
                isOpen={editing !== null}
                onClose={() => setEditing(null)}
                expense={editingExpense}
                categories={categories}
                limits={limits}
                onArchive={archive}
                onViewReceipt={setViewing}
            />
            <CategorySheet isOpen={categoriesOpen} onClose={() => setCategoriesOpen(false)} categories={categories} />
            <FilterSheet isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} filters={filters} categories={categories} onApply={visit} />
            <ReceiptViewer receipt={viewing} onClose={() => setViewing(null)} />

            {undo && (
                <div
                    role="status"
                    className="fixed inset-x-4 bottom-4 z-[90] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-2xl"
                >
                    <span className="min-w-0 text-sm text-slate-200">
                        <ArchiveBoxIcon className="mr-1.5 inline h-4 w-4 align-text-bottom text-slate-400" />
                        Archived <span className="font-semibold break-words text-white">{undo.payee}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => undoArchive(undo.id)}
                        className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-bold text-primary-300 hover:bg-white/5"
                    >
                        Undo
                    </button>
                </div>
            )}
        </ZeusLayout>
    );
}

function Figure({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.04] px-4 py-3 sm:block sm:bg-transparent sm:p-0">
            <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</p>
                <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{sub}</p>
            </div>
            <p className={`text-xl font-black tracking-tight whitespace-nowrap tabular-nums sm:mt-2 sm:text-2xl ${tone}`}>{value}</p>
        </div>
    );
}

function ExpenseItem({ expense, onOpen, onRestore }: { expense: ExpenseRow; onOpen: () => void; onRestore: () => void }) {
    const { day, weekday } = dateParts(expense.incurred_on);

    return (
        <li className={expense.archived ? 'opacity-70' : ''}>
            <div className="flex items-stretch">
                <button
                    type="button"
                    onClick={onOpen}
                    className="flex min-h-[68px] min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03] active:bg-white/[0.05]"
                >
                    <div className="flex w-10 shrink-0 flex-col items-center rounded-lg bg-slate-800/70 py-1.5">
                        <span className="text-base leading-none font-black text-white">{day}</span>
                        <span className="mt-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{weekday}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[15px] leading-snug font-semibold break-words text-white">{expense.payee}</p>
                        <p className="mt-0.5 text-xs break-words text-slate-400">
                            {expense.category.name ?? 'Uncategorised'}
                            {expense.category.archived ? ' (archived)' : ''}
                            {expense.original_amount_note ? ` · ${expense.original_amount_note}` : ''}
                        </p>
                        {expense.note && <p className="mt-1 line-clamp-2 text-xs break-words text-slate-500">{expense.note}</p>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 pl-2">
                        <span className="text-[15px] font-bold whitespace-nowrap text-white tabular-nums">{formatKobo(expense.amount)}</span>
                        {expense.receipts.length > 0 && (
                            <span
                                className="inline-flex items-center gap-1 text-xs text-slate-400"
                                aria-label={`${expense.receipts.length} receipt${expense.receipts.length === 1 ? '' : 's'}`}
                            >
                                <PaperClipIcon className="h-3.5 w-3.5" />
                                {expense.receipts.length}
                            </span>
                        )}
                    </div>
                </button>
                {expense.archived && (
                    <button
                        type="button"
                        onClick={onRestore}
                        aria-label={`Restore ${expense.payee}`}
                        className="flex w-14 shrink-0 items-center justify-center border-l border-slate-800/70 text-slate-300 hover:bg-white/5"
                    >
                        <ArrowUturnLeftIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        </li>
    );
}
