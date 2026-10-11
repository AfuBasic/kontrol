import {
    ArchiveBoxIcon,
    ArrowDownTrayIcon,
    ArrowUturnLeftIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    PaperClipIcon,
    PencilSquareIcon,
    PlusIcon,
    TagIcon,
} from '@heroicons/react/24/outline';
import { Head, InfiniteScroll, router, usePage } from '@inertiajs/react';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { exportMethod, index, restore, destroy as archiveExpense } from '@/actions/App/Http/Controllers/Zeus/ExpenseController';
import CategoryModal from '@/Components/Zeus/Expenses/CategoryModal';
import ExpenseDetailModal from '@/Components/Zeus/Expenses/ExpenseDetailModal';
import ExpenseFormModal from '@/Components/Zeus/Expenses/ExpenseFormModal';
import ReceiptViewer from '@/Components/Zeus/Expenses/ReceiptViewer';
import SpendCharts from '@/Components/Zeus/Expenses/SpendCharts';
import SpendHero from '@/Components/Zeus/Expenses/SpendHero';
import type { Category, ExpenseRow, Filters, Limits, Receipt, Summary } from '@/Components/Zeus/Expenses/types';
import ZeusLayout from '@/Layouts/ZeusLayout';
import { categoryColor, currentMonth, dateParts, formatKobo, groupByMonth, monthLabel, shiftMonth } from '@/Lib/expenses';

type Props = {
    filters: Filters;
    expenses: { data: ExpenseRow[] };
    summary: Summary;
    categories: Category[];
    limits: Limits;
};

/** Date, paid to, category, receipts, amount, actions. */
const COLUMNS = 'lg:grid-cols-[76px_minmax(0,1fr)_200px_84px_150px_92px]';

const control =
    'min-h-10 rounded-lg border border-slate-700 bg-slate-800/40 px-3.5 text-sm text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none';

export default function ExpensesIndex({ filters, expenses, summary, categories, limits }: Props) {
    // Which expense is open in which modal. Reading it from the live list keeps the modal in step with saves.
    const [viewingId, setViewingId] = useState<number | null>(null);
    const [form, setForm] = useState<{ id: number | null } | null>(null);
    const [categoriesOpen, setCategoriesOpen] = useState(false);
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [undo, setUndo] = useState<{ id: number; payee: string } | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const rows = expenses.data;
    // The server only sends a list's paging data when that list is part of the request. After a reload that leaves it out,
    // the infinite-scroll component would throw while drawing, so it is only used while the paging data is there.
    const canInfiniteScroll = Boolean(usePage().scrollProps?.expenses);
    const groups = useMemo(() => groupByMonth(rows), [rows]);
    const byId = (id: number | null) => (id ? (rows.find((row) => row.id === id) ?? null) : null);
    const viewing = byId(viewingId);
    const editing = byId(form?.id ?? null);
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

    function restoreExpense(id: number) {
        setUndo(null);
        router.post(restore.url(id), {}, { preserveScroll: true, preserveState: true });
    }

    const exportQuery = {
        month: filters.month,
        ...(filters.category_id ? { category_id: filters.category_id } : {}),
        ...(filters.search ? { search: filters.search } : {}),
    };

    // The month groups and their rows, shared by the infinite-scroll and the plain version of the list.
    const groupedList = (
        <>
            {groups.map((group) => (
                <div key={group.month}>
                    <div className="flex items-baseline justify-between gap-3 border-b border-slate-800/70 bg-slate-800/20 px-5 py-2">
                        <h2 className="text-xs font-bold tracking-wide text-slate-300">{group.label}</h2>
                        <span className="text-xs font-semibold whitespace-nowrap text-slate-500 tabular-nums">{formatKobo(group.total)}</span>
                    </div>
                    {group.items.map((expense) => (
                        <ExpenseRowItem
                            key={expense.id}
                            expense={expense}
                            onView={() => setViewingId(expense.id)}
                            onEdit={() => setForm({ id: expense.id })}
                            onRestore={() => restoreExpense(expense.id)}
                        />
                    ))}
                </div>
            ))}
        </>
    );

    return (
        <ZeusLayout>
            <Head title="Expenses" />

            <div className="mx-auto max-w-6xl pb-24">
                {/* Header */}
                <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Expenses</h1>
                        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">Every cost of running Kontrol, set against what comes in.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setCategoriesOpen(true)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                        >
                            <TagIcon className="h-5 w-5" />
                            Categories
                        </button>
                        <a
                            href={exportMethod.url({ query: exportQuery })}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
                        >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                            Export CSV
                        </a>
                        <button
                            type="button"
                            onClick={() => setForm({ id: null })}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-4 text-sm font-bold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add expense
                        </button>
                    </div>
                </div>

                {/* Filters, all on one line */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex min-h-10 items-center rounded-lg border border-slate-700 bg-slate-800/40">
                        <button
                            type="button"
                            disabled={allTime}
                            onClick={() => visit({ month: shiftMonth(filters.month, -1) })}
                            aria-label="Previous month"
                            className="flex h-10 w-10 items-center justify-center rounded-l-lg text-slate-300 hover:bg-white/5 disabled:opacity-30"
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <span className="min-w-36 px-2 text-center text-sm font-bold text-white">
                            {allTime ? 'All time' : monthLabel(filters.month)}
                        </span>
                        <button
                            type="button"
                            disabled={allTime || isCurrentOrLater}
                            onClick={() => visit({ month: shiftMonth(filters.month, 1) })}
                            aria-label="Next month"
                            className="flex h-10 w-10 items-center justify-center rounded-r-lg text-slate-300 hover:bg-white/5 disabled:opacity-30"
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => visit({ month: allTime ? currentMonth() : 'all' })}
                        aria-pressed={allTime}
                        className={`min-h-10 rounded-lg border px-3.5 text-sm font-semibold transition ${allTime ? 'border-primary-500/50 bg-primary-500/10 text-primary-200' : 'border-slate-700 text-slate-300 hover:bg-white/5'}`}
                    >
                        All time
                    </button>

                    <div className="relative min-w-60 flex-1 sm:max-w-sm">
                        <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <label htmlFor="expense-search" className="sr-only">
                            Search by payee or note
                        </label>
                        <input
                            id="expense-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search payee or note"
                            className={`${control} w-full pl-10 placeholder:text-slate-500`}
                        />
                    </div>

                    <label htmlFor="expense-category-filter" className="sr-only">
                        Category
                    </label>
                    <select
                        id="expense-category-filter"
                        value={filters.category_id ?? ''}
                        onChange={(e) => visit({ category_id: e.target.value ? Number(e.target.value) : null })}
                        className={`${control} min-w-48`}
                    >
                        <option value="">All categories</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => visit({ archived: !filters.archived })}
                        aria-pressed={filters.archived}
                        className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold transition ${filters.archived ? 'border-amber-500/50 bg-amber-500/10 text-amber-200' : 'border-slate-700 text-slate-300 hover:bg-white/5'}`}
                    >
                        <ArchiveBoxIcon className="h-5 w-5" />
                        Archived
                    </button>
                </div>

                {/* Headline */}
                <div className="mt-6 space-y-4">
                    <SpendHero summary={summary} onOpenExpense={(id) => setViewingId(id)} />
                    <SpendCharts summary={summary} />
                </div>

                {/* List */}
                <section aria-label="Expenses" className="mt-6">
                    {filters.archived && (
                        <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100">
                            Showing archived expenses only. They are not counted above.
                        </p>
                    )}

                    {rows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
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
                                    onClick={() => setForm({ id: null })}
                                    className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    Add expense
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0f1423]">
                            <div
                                className={`hidden gap-4 border-b border-slate-800/70 bg-black/10 px-5 py-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase lg:grid ${COLUMNS}`}
                            >
                                <span>Date</span>
                                <span>Paid to</span>
                                <span>Category</span>
                                <span>Receipts</span>
                                <span className="text-right">Amount</span>
                                <span className="text-right">Actions</span>
                            </div>

                            {canInfiniteScroll ? (
                                <InfiniteScroll
                                    data="expenses"
                                    loading={
                                        <div className="flex justify-center py-6" role="status" aria-label="Loading more expenses">
                                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
                                        </div>
                                    }
                                >
                                    {groupedList}
                                </InfiniteScroll>
                            ) : (
                                groupedList
                            )}
                        </div>
                    )}
                </section>
            </div>

            <ExpenseDetailModal
                expense={viewing}
                onClose={() => setViewingId(null)}
                onEdit={(expense) => {
                    setViewingId(null);
                    setForm({ id: expense.id });
                }}
                onArchive={archive}
                onRestore={(expense) => restoreExpense(expense.id)}
                onViewReceipt={setReceipt}
            />
            <ExpenseFormModal
                isOpen={form !== null}
                onClose={() => setForm(null)}
                expense={editing}
                categories={categories}
                limits={limits}
                onViewReceipt={setReceipt}
            />
            <CategoryModal isOpen={categoriesOpen} onClose={() => setCategoriesOpen(false)} categories={categories} />
            <ReceiptViewer receipt={receipt} onClose={() => setReceipt(null)} />

            {undo && (
                <div
                    role="status"
                    className="fixed bottom-6 left-1/2 z-[90] flex w-full max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 shadow-2xl"
                >
                    <span className="min-w-0 text-sm text-slate-200">
                        <ArchiveBoxIcon className="mr-1.5 inline h-4 w-4 align-text-bottom text-slate-400" />
                        Archived <span className="font-semibold break-words text-white">{undo.payee}</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => restoreExpense(undo.id)}
                        className="min-h-10 shrink-0 rounded-lg px-3 text-sm font-bold text-primary-300 hover:bg-white/5"
                    >
                        Undo
                    </button>
                </div>
            )}
        </ZeusLayout>
    );
}

const iconButton = 'flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white';

function ExpenseRowItem({
    expense,
    onView,
    onEdit,
    onRestore,
}: {
    expense: ExpenseRow;
    onView: () => void;
    onEdit: () => void;
    onRestore: () => void;
}) {
    const { day, weekday } = dateParts(expense.incurred_on);
    const stop = (handler: () => void) => (event: { stopPropagation: () => void }) => {
        event.stopPropagation();
        handler();
    };
    const openWithKey = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            onView();
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onView}
            onKeyDown={openWithKey}
            aria-label={`View ${expense.payee}`}
            style={{ borderLeftColor: categoryColor(expense.category.id) }}
            className={`grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-l-[3px] border-b-slate-800/60 px-5 py-3.5 transition last:border-b-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none ${COLUMNS} ${expense.archived ? 'opacity-70' : ''}`}
        >
            <div className="flex w-12 flex-col items-center rounded-lg bg-slate-800/70 py-1.5">
                <span className="text-base leading-none font-black text-white">{day}</span>
                <span className="mt-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{weekday}</span>
            </div>

            <div className="min-w-0">
                <p className="text-sm leading-snug font-semibold break-words text-white">{expense.payee}</p>
                {(expense.note || expense.original_amount_note) && (
                    <p className="mt-0.5 line-clamp-1 text-xs break-words text-slate-500">
                        {[expense.original_amount_note, expense.note].filter(Boolean).join(' · ')}
                    </p>
                )}
            </div>

            <div className="col-start-2 lg:col-start-auto">
                <span
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${categoryColor(expense.category.id)}22`, color: categoryColor(expense.category.id) }}
                >
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(expense.category.id) }} />
                    <span className="truncate">
                        {expense.category.name ?? 'Uncategorised'}
                        {expense.category.archived ? ' (archived)' : ''}
                    </span>
                </span>
            </div>

            <div className="hidden items-center gap-1.5 text-sm text-slate-400 lg:flex">
                {expense.receipts.length > 0 ? (
                    <>
                        <PaperClipIcon className="h-4 w-4" />
                        {expense.receipts.length}
                    </>
                ) : (
                    <span className="text-slate-600">—</span>
                )}
            </div>

            <p className="col-start-3 row-start-1 text-right text-base font-black whitespace-nowrap text-white tabular-nums lg:col-start-auto lg:row-start-auto">
                {formatKobo(expense.amount)}
            </p>

            <div className="col-start-3 flex justify-end gap-1 lg:col-start-auto">
                <button type="button" onClick={stop(onView)} aria-label={`View ${expense.payee}`} title="View" className={iconButton}>
                    <EyeIcon className="h-5 w-5" />
                </button>
                {expense.archived ? (
                    <button type="button" onClick={stop(onRestore)} aria-label={`Restore ${expense.payee}`} title="Restore" className={iconButton}>
                        <ArrowUturnLeftIcon className="h-5 w-5" />
                    </button>
                ) : (
                    <button type="button" onClick={stop(onEdit)} aria-label={`Edit ${expense.payee}`} title="Edit" className={iconButton}>
                        <PencilSquareIcon className="h-5 w-5" />
                    </button>
                )}
            </div>
        </div>
    );
}
