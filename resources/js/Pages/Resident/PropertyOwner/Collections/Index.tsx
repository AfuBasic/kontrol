import { WalletIcon, PlusIcon, CalendarIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Head, Link, router, WhenVisible } from '@inertiajs/react';
import { motion, animate, useMotionValue } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { index, create, show } from '@/actions/App/Http/Controllers/Resident/PropertyOwner/CollectionController';
import { useDebounce } from '@/Hooks/useDebounce';

function AnimatedNumber({ value }: { value: number }) {
    const motionValue = useMotionValue(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const controls = animate(motionValue, value, {
            duration: 1.4,
            ease: [0.16, 1, 0.3, 1], // ultra premium ease-out curve
            onUpdate: (latest) => {
                if (ref.current) {
                    ref.current.textContent = '₦' + Math.round(latest).toLocaleString();
                }
            },
        });
        return () => controls.stop();
    }, [value, motionValue]);

    return <span ref={ref}>₦0</span>;
}

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
        next_page_url?: string;
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
    const showFilters = totalUnfiltered > 0 || hasActiveFilters;

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
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-xs transition-all hover:bg-slate-50 active:scale-98"
                    >
                        <CreditCardIcon className="h-5 w-5 text-slate-500" />
                    </Link>
                    <Link
                        href={create.url()}
                        className="shadow-indigo-650/15 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold whitespace-nowrap text-white shadow-lg transition-all hover:bg-indigo-700 active:scale-98"
                    >
                        <PlusIcon className="h-5 w-5" />
                        New Collection
                    </Link>
                </div>
            </div>

            {/* Unified Premium Financial Overview Card */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-900 bg-slate-950 p-6 text-white shadow-2xl shadow-indigo-950/20">
                {/* Background glow effects */}
                <div className="absolute -top-24 -right-24 h-56 w-56 animate-pulse rounded-full bg-indigo-600/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-600/10 blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Financial Overview</span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black tracking-wider text-emerald-400 uppercase">
                            {stats.expecting_amount > 0 ? Math.round((stats.realised_amount / stats.expecting_amount) * 100) : 0}% Realised
                        </span>
                    </div>

                    <div className="mt-4">
                        <p className="text-slate-450 text-[9px] font-bold tracking-widest uppercase">Total Expected Collection</p>
                        <h2 className="text-3.5xl mt-1 font-black tracking-tight">
                            <AnimatedNumber value={stats.expecting_amount} />
                        </h2>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-800 bg-slate-900">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                                initial={{ width: '0%' }}
                                animate={{
                                    width: `${stats.expecting_amount > 0 ? Math.min(100, (stats.realised_amount / stats.expecting_amount) * 100) : 0}%`,
                                }}
                                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>

                    {/* Split details */}
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-900/60 pt-4">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Realised</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-white">
                                <AnimatedNumber value={stats.realised_amount} />
                            </p>
                        </div>
                        <div className="border-l border-slate-900/60 pl-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">Outstanding</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-white">
                                <AnimatedNumber value={stats.expecting_amount - stats.realised_amount} />
                            </p>
                        </div>
                    </div>
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
                                <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    Before you can create collections and receive payments from your residents, you must set up your settlement bank
                                    account.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/resident/property-owner/settlement"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold whitespace-nowrap text-white shadow-sm transition-all hover:bg-amber-700 active:scale-98 sm:w-auto"
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
                            className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-10 text-sm font-semibold text-slate-900 shadow-xs placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
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
                                className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pr-8 pl-10 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none"
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
                            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-xs transition-all hover:bg-slate-50 active:scale-95"
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
                                        <div className="mt-2 flex flex-col gap-1 text-xs font-bold text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon className="h-3.5 w-3.5 text-slate-300" />
                                                <span>Created: {col.created_at}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon className="h-3.5 w-3.5 text-slate-300" />
                                                <span>Due: {col.due_at || '—'}</span>
                                            </div>
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

            {/* Infinite Loading Marker */}
            {collections.next_page_url && (
                <WhenVisible
                    always
                    data="collections"
                    params={{
                        page: collections.current_page + 1,
                        search: search,
                        status: status
                    }}
                    fallback={
                        <div className="mt-8 flex justify-center pb-12">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent"></div>
                        </div>
                    }
                />
            )}
        </div>
    );
}
