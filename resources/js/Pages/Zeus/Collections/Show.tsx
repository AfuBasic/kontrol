import { Head, Link } from '@inertiajs/react';
import ZeusLayout from '@/Layouts/ZeusLayout';
import {
    ArrowLeftIcon,
    BanknotesIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';

interface Collection {
    id: number;
    name: string;
    description: string | null;
    amount: number;
    status: string;
    due_at: string | null;
    created_at: string;
    estate: {
        id: number;
        name: string;
    };
    creator: {
        id: number;
        name: string;
        email: string;
    };
    assignments_count: number;
    paid_assignments_count: number;
}

interface Assignment {
    id: number;
    amount_due: number;
    amount_paid: number;
    status: string;
    due_date: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface PaginationData {
    data: Assignment[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    collection: Collection;
    assignments: PaginationData;
}

export default function Show({ collection, assignments }: Props) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const completionRate =
        collection.assignments_count > 0 ? Math.round((collection.paid_assignments_count / collection.assignments_count) * 100) : 0;

    return (
        <ZeusLayout>
            <Head title={`Collection: ${collection.name}`} />

            <div className="mb-8">
                <Link
                    href="/zeus/collections"
                    className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Global Collections
                </Link>
            </div>

            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-3xl font-black tracking-tight text-transparent dark:from-white dark:to-slate-400">
                        {collection.name}
                    </h1>
                    {collection.description && (
                        <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-slate-400">{collection.description}</p>
                    )}
                </div>
                <div>
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase ring-1 ring-inset ${
                            collection.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : collection.status === 'draft'
                                  ? 'bg-slate-50 text-slate-600 ring-slate-500/20 dark:bg-white/5 dark:text-slate-300'
                                  : 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}
                    >
                        {collection.status}
                    </span>
                </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0a0e17] dark:ring-white/10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <BanknotesIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Base Amount</p>
                            <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(collection.amount)}</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0a0e17] dark:ring-white/10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                            <BuildingOfficeIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate</p>
                            <p className="mt-1 max-w-[150px] truncate text-lg font-black text-slate-900 dark:text-white">
                                {collection.estate?.name || 'Unknown'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0a0e17] dark:ring-white/10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                            <UserIcon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Creator</p>
                            <p className="mt-1 max-w-[150px] truncate text-lg font-black text-slate-900 dark:text-white">
                                {collection.creator?.name || 'System'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-100 dark:bg-[#0a0e17] dark:ring-white/10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div className="w-full pr-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Completion</p>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{completionRate}%</span>
                            </div>
                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-xl ring-1 shadow-slate-200/40 ring-slate-100 dark:bg-[#0a0e17] dark:shadow-none dark:ring-white/10">
                <div className="border-b border-slate-100 p-6 sm:px-8 dark:border-white/5">
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Resident Assignments</h3>
                    <p className="mt-1 text-xs font-medium text-slate-500">Detailed breakdown of all targets for this collection.</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-white/5">
                        <thead className="bg-slate-50/50 dark:bg-white/5">
                            <tr>
                                <th className="px-8 py-4 text-left text-[10px] font-black tracking-widest text-slate-400 uppercase">Resident</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Amount Due</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Amount Paid</th>
                                <th className="px-8 py-4 text-center text-[10px] font-black tracking-widest text-slate-400 uppercase">Status</th>
                                <th className="px-8 py-4 text-right text-[10px] font-black tracking-widest text-slate-400 uppercase">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white dark:divide-white/5 dark:bg-transparent">
                            {assignments.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-8 text-center text-sm font-medium text-slate-500">
                                        No assignments generated yet.
                                    </td>
                                </tr>
                            ) : (
                                assignments.data.map((assignment) => (
                                    <tr key={assignment.id} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5">
                                        <td className="px-8 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">{assignment.user?.name}</div>
                                            <div className="text-xs text-slate-500">{assignment.user?.email}</div>
                                        </td>
                                        <td className="px-8 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {formatCurrency(assignment.amount_due)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {formatCurrency(assignment.amount_paid)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-4 text-center whitespace-nowrap">
                                            {assignment.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    <CheckCircleIcon className="h-4 w-4" /> Paid
                                                </span>
                                            ) : assignment.status === 'overdue' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-600/20 dark:bg-rose-500/10 dark:text-rose-400">
                                                    <XCircleIcon className="h-4 w-4" /> Overdue
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-500/20 dark:bg-white/5 dark:text-slate-300">
                                                    <ClockIcon className="h-4 w-4" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-4 text-right whitespace-nowrap">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {new Date(assignment.due_date).toLocaleDateString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {assignments.links && assignments.links.length > 3 && (
                    <div className="border-t border-slate-100 bg-white p-4 sm:px-8 dark:border-white/5 dark:bg-[#0a0e17]">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Showing{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {(assignments.current_page - 1) * assignments.per_page + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {Math.min(assignments.current_page * assignments.per_page, assignments.total)}
                                </span>{' '}
                                of <span className="font-bold text-slate-900 dark:text-white">{assignments.total}</span> entries
                            </p>
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                                {assignments.links.map((link, idx) => {
                                    const isFirst = idx === 0;
                                    const isLast = idx === assignments.links.length - 1;

                                    if (isFirst || isLast) {
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url || '#'}
                                                className={`relative inline-flex items-center px-2 py-2 text-slate-400 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:z-20 focus:outline-offset-0 dark:ring-white/10 dark:hover:bg-white/5 ${isFirst ? 'rounded-l-md' : ''} ${isLast ? 'rounded-r-md' : ''} ${!link.url ? 'cursor-not-allowed opacity-50' : ''}`}
                                                dangerouslySetInnerHTML={{
                                                    __html: isFirst
                                                        ? '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>'
                                                        : '<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>',
                                                }}
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url || '#'}
                                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                                                link.active
                                                    ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                                    : 'text-slate-900 ring-1 ring-slate-300 ring-inset hover:bg-slate-50 focus:outline-offset-0 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/5'
                                            }`}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </ZeusLayout>
    );
}
