import { WalletIcon, PlusIcon, CalendarIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { index, create, show } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';
import { useDebounce } from '@/Hooks/useDebounce';

interface Collection {
    id: number;
    ulid: string;
    name: string;
    amount: number;
    status: string;
    due_at: string;
    assignments_count: number;
    paid_count: number;
    total_amount: number;
    collected_amount: number;
    created_at: string;
}

interface Props {
    collections: {
        data: Collection[];
        total: number;
        per_page: number;
        current_page: number;
        links: any[];
    };
    totalUnfiltered: number;
    filters: {
        search: string;
        status: string;
    };
    hasSettlementAccount: boolean;
    stats: {
        total_collections: number;
        expecting_amount: number;
        realised_amount: number;
    };
}

export default function Index({ collections, totalUnfiltered, filters, hasSettlementAccount, stats }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(index.url(), { search: debouncedSearch, status }, { preserveState: true, preserveScroll: true, replace: true });
        }
    }, [debouncedSearch, filters.search, status]);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        setStatus(newStatus);
        router.get(index.url(), { search, status: newStatus }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        setStatus('');
        router.get(index.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

    const hasActiveFilters = Boolean(search || status);
    const hasCollections = collections && collections.data && collections.data.length > 0;
    const showFilters = totalUnfiltered > 1 || hasActiveFilters;
    const showPagination = collections.total > collections.per_page;

    return (
        <div className="space-y-6 pb-24">
            <Head title="Collections" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">Collections</h1>
                    <p className="mt-1 text-sm text-slate-500">Create and track rent, utility, and generator fee collections.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/resident/property-owner/settlement"
                        title="Settlement Account Settings"
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-98"
                    >
                        <CreditCardIcon className="h-5 w-5 text-slate-500" />
                    </Link>
                    <Link
                        href={create.url()}
                        className="shadow-indigo-650/15 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-98 whitespace-nowrap"
                    >
                        <PlusIcon className="h-5 w-5" />
                        New Collection
                    </Link>
                </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/5 relative overflow-hidden">
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Total Expected</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight">₦{Number(stats.expecting_amount).toLocaleString()}</h3>
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-600/10 blur-xl" />
                </div>
                <div className="rounded-[24px] bg-white p-5 shadow-xs ring-1 ring-slate-100 relative overflow-hidden">
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Total Realised</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">₦{Number(stats.realised_amount).toLocaleString()}</h3>
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-emerald-600/10 blur-xl" />
                </div>
                <div className="rounded-[24px] bg-white p-5 shadow-xs ring-1 ring-slate-100 relative overflow-hidden">
                    <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Collections Count</p>
                    <h3 className="mt-2 text-2xl font-black text-slate-900 tracking-tight">{stats.total_collections}</h3>
                    <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-indigo-600/10 blur-xl" />
                </div>
            </div>

            {!hasSettlementAccount && (
                <div className="rounded-[24px] border border-amber-100 bg-amber-50 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                                <CreditCardIcon className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900">Settlement Account Setup Required</h3>
                                <p className="mt-0.5 text-xs text-slate-500 font-medium">
                                    Before you can create collections and receive payments from your residents, you must set up your settlement bank account.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/resident/property-owner/settlement"
                            className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-all active:scale-98 w-full sm:w-auto whitespace-nowrap"
                        >
                            Setup Account
                        </Link>
                    </div>
                </div>
            )}

            {/* Conditional Filters bar: Only show if records > 1 or filters are active */}
            {showFilters && (
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <MagnifyingGlassIcon className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                            placeholder="Search collections..."
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <FunnelIcon className="h-4.5 w-4.5 text-slate-400" />
                            </div>
                            <select
                                value={status}
                                onChange={handleStatusChange}
                                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-8 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-xs hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <XMarkIcon className="h-4 w-4" />
                            Reset
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {hasCollections ? (
                    collections.data.map((col) => {
                        const collectedPct = col.assignments_count > 0 ? Math.round((col.paid_count / col.assignments_count) * 100) : 0;

                        return (
                            <Link
                                key={col.id}
                                href={show.url(col.ulid)}
                                className="group relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-white p-6 shadow-xs ring-1 ring-slate-100 transition-all hover:shadow-lg hover:ring-indigo-100"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                            <WalletIcon className="h-5 w-5" />
                                        </div>
                                        <span
                                            className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase ${
                                                col.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {col.status}
                                        </span>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="text-base font-black text-slate-900 transition-colors group-hover:text-indigo-600">
                                            {col.name}
                                        </h3>
                                        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <CalendarIcon className="h-4 w-4" />
                                            <span>Due by {col.due_at || '—'}</span>
                                        </div>
                                    </div>

                                    {/* Progression Bar */}
                                    <div className="mt-5 space-y-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-slate-400 uppercase">Payment Progress</span>
                                            <span className="font-bold text-slate-900">
                                                {collectedPct}% ({col.paid_count}/{col.assignments_count})
                                            </span>
                                        </div>
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${collectedPct}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Amount per head</p>
                                        <p className="text-sm font-black text-slate-900">₦{Number(col.amount).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase">Collected Total</p>
                                        <p className="text-sm font-black text-slate-900">₦{Number(col.collected_amount).toLocaleString()}</p>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                ) : (
                    <div className="col-span-full rounded-[32px] bg-white py-16 text-center shadow-xs ring-1 ring-slate-100">
                        <WalletIcon className="text-slate-305 mx-auto h-12 w-12" />
                        <h3 className="mt-4 text-lg font-black text-slate-900">No Bills Created</h3>
                        <p className="mt-1 text-sm text-slate-500">You haven't setup any payment collection sheets yet.</p>
                        <Link
                            href={create.url()}
                            className="mt-6 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-indigo-700"
                        >
                            Create First Collection
                        </Link>
                    </div>
                )}
            </div>

            {/* Conditional Pagination: Only show if records > per page */}
            {showPagination && (
                <div className="mt-8 flex flex-col items-center justify-center gap-6 pb-12">
                    <div className="w-full flex items-center justify-between border-t border-slate-100 pt-6">
                        <div>
                            <p className="text-slate-500 text-xs font-semibold">
                                Showing <span className="font-bold text-slate-900">{collections.data.length}</span> entries of{' '}
                                <span className="font-bold text-slate-900">{collections.total}</span>
                            </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {collections.links.map((link: any, i: number) => {
                                if (link.url === null) return null;
                                return (
                                    <Link
                                        key={i}
                                        href={link.url}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                                                : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50'
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
