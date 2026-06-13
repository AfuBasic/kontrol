import { PlusIcon } from '@heroicons/react/24/outline';
import { Head, Link, router } from '@inertiajs/react';
import { clsx, type ClassValue } from 'clsx';
import { motion, animate, useMotionValue } from 'framer-motion';
import { 
    Wallet, 
    Users, 
    Calendar, 
    ArrowRight, 
    AlertTriangle, 
    Building2, 
    Settings2, 
    Send, 
    Edit2,
    Search,
    Filter,
    RotateCcw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { twMerge } from 'tailwind-merge';
import { index, create, show, edit, publish } from '@/actions/App/Http/Controllers/Admin/CollectionController';
import BankingSetupModal from '@/Components/BankingSetupModal';
import ConfirmationModal from '@/Components/ConfirmationModal';
import { useDebounce } from '@/Hooks/useDebounce';
import AdminLayout from '@/Layouts/AdminLayout';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

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
            }
        });
        return () => controls.stop();
    }, [value, motionValue]);

    return <span ref={ref}>₦0</span>;
}

type Collection = {
    ulid: string;
    id: number;
    name: string;
    description: string | null;
    amount: number;
    billing_type: 'one_time' | 'recurring';
    recurring_interval: string | null;
    status: 'draft' | 'active' | 'archived';
    assignments_count: number;
    targets_count: number;
    applies_to: 'all' | 'target';
    created_at: string;
    collected_amount?: number;
    total_amount?: number;
};

type Props = {
    collections: {
        data: Collection[];
        total: number;
        per_page: number;
        current_page: number;
        links: any[];
    };
    totalResidents: number;
    hasBanking: boolean;
    banks: { name: string; code: string }[];
    settlement: {
        bank_name: string | null;
        bank_code: string | null;
        account_number: string | null;
        account_name: string | null;
    };
    filters: {
        search: string;
        status: string;
    };
    stats: {
        total_expected: number;
        total_realised: number;
    };
};

export default function CollectionsIndex({ collections, totalResidents, hasBanking, banks, settlement, filters, stats }: Props) {
    const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [isPublishing, setIsPublishing] = useState(false);

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

    const handlePublish = () => {
        if (!selectedCollection) return;
        setIsPublishing(true);
        router.post(
            publish.url(selectedCollection.ulid),
            {},
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsPublishing(false);
                    setIsPublishModalOpen(false);
                    setSelectedCollection(null);
                },
            },
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const expected = Number(stats.total_expected || 0);
    const realised = Number(stats.total_realised || 0);
    const outstanding = expected - realised;
    const realisedPct = expected > 0 ? Math.round((realised / expected) * 100) : 0;

    const hasActiveFilters = Boolean(search || status);
    const showFilters = collections.total > 1 || hasActiveFilters;
    const showPagination = collections.total > collections.per_page;

    return (
        <>
            <Head title="Collections Dashboard" />

            {!hasBanking && (
                <div className="mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-amber-50 shadow-sm">
                    <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                        <div className="flex items-start gap-4">
                            <div className="rounded-2xl bg-amber-100 p-3 text-amber-600">
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black tracking-tight text-amber-900">Settlement Account Required</h2>
                                <p className="max-w-xl text-sm text-amber-700">
                                    To create collections and receive payments from residents, you must first set up your estate's settlement bank
                                    account.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95 cursor-pointer"
                        >
                            <Building2 className="h-5 w-5" />
                            Setup Bank Account
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Collections</h1>
                    <p className="mt-1 text-slate-500">Manage estate dues, levies, and recurring bills.</p>
                </div>

                <div className="flex flex-row items-center gap-3">
                    <button
                        onClick={() => setIsBankingModalOpen(true)}
                        className={cn(
                            'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-xs font-bold transition-all active:scale-95 sm:text-sm cursor-pointer',
                            hasBanking
                                ? 'bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50'
                                : 'bg-amber-600 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-700',
                        )}
                    >
                        <Settings2 className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="truncate">{hasBanking ? 'Settlement' : 'Setup Bank'}</span>
                    </button>

                    {hasBanking ? (
                        <Link
                            href={create.url()}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1F6FDB] px-4 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-95 sm:text-sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">New Collection</span>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setIsBankingModalOpen(true)}
                            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-200 px-4 py-3.5 text-xs font-bold text-slate-400 transition-colors hover:bg-slate-300 sm:text-sm"
                        >
                            <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="truncate">Setup Bank</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Unified Premium Financial Overview Card */}
            <div className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-slate-950 p-6 text-white shadow-2xl shadow-indigo-950/20 border border-slate-900">
                <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-indigo-600/20 blur-3xl animate-pulse" />
                <div className="absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-600/10 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Estate Financial Overview</span>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-black tracking-wider text-emerald-400 uppercase border border-emerald-500/20">
                            {realisedPct}% Realised
                        </span>
                    </div>

                    <div className="mt-4">
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Total Expected Revenue</p>
                        <h2 className="mt-1 text-3.5xl font-black tracking-tight">
                            <AnimatedNumber value={expected} />
                        </h2>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
                            <motion.div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full" 
                                initial={{ width: '0%' }}
                                animate={{ width: `${realisedPct}%` }}
                                transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                            />
                        </div>
                    </div>

                    {/* Split details */}
                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-900/60 pt-4">
                        <div>
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Realised</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-white">
                                <AnimatedNumber value={realised} />
                            </p>
                        </div>
                        <div className="border-l border-slate-900/60 pl-4">
                            <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Outstanding</span>
                            </div>
                            <p className="mt-1 text-lg font-black text-white">
                                <AnimatedNumber value={outstanding} />
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter controls */}
            {showFilters && (
                <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                    <div className="relative flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Search className="h-4.5 w-4.5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 shadow-xs focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                            placeholder="Search collections by name..."
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                                <Filter className="h-4.5 w-4.5 text-slate-400" />
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
                            className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-xs hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Reset
                        </button>
                    )}
                </div>
            )}

            <BankingSetupModal isOpen={isBankingModalOpen} onClose={() => setIsBankingModalOpen(false)} banks={banks} currentSettings={settlement} />

            <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => {
                    setIsPublishModalOpen(false);
                    setSelectedCollection(null);
                }}
                onConfirm={handlePublish}
                title="Publish Collection"
                message={`Are you sure you want to publish "${selectedCollection?.name}"? This will generate assignments for residents.`}
                confirmLabel="Yes, Publish Now"
                cancelLabel="Cancel"
                type="info"
                isLoading={isPublishing}
            />

            {/* List View */}
            <div className="rounded-[2rem] border border-slate-200 bg-white overflow-hidden shadow-xs">
                {collections.data.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75">
                                    <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Collection Details</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Amount per target</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Interval</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Audience</th>
                                    <th className="p-5 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                    <th className="p-5 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {collections.data.map((collection) => (
                                    <tr 
                                        key={collection.ulid}
                                        onClick={() => router.visit(show.url(collection.ulid))}
                                        className="group cursor-pointer transition-colors hover:bg-slate-50/75"
                                    >
                                        <td className="p-5 max-w-md">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-500">
                                                    <Wallet className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{collection.name}</div>
                                                    {collection.description && (
                                                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-400 font-medium">{collection.description}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5 font-black text-slate-900">
                                            {formatCurrency(collection.amount)}
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600 border border-slate-100">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="capitalize">{collection.recurring_interval || 'Once'}</span>
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
                                                <Users className="h-4 w-4 text-slate-450" />
                                                <span>
                                                    {collection.status === 'active'
                                                        ? collection.assignments_count
                                                        : collection.applies_to === 'all'
                                                          ? totalResidents
                                                          : collection.targets_count}{' '}
                                                    Targets
                                                </span>
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase border ${
                                                    collection.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : collection.status === 'draft'
                                                          ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                          : 'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}
                                            >
                                                {collection.status}
                                            </span>
                                        </td>
                                        <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {collection.status === 'draft' && hasBanking && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCollection(collection);
                                                                setIsPublishModalOpen(true);
                                                            }}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-500 shadow-xs ring-1 ring-slate-200 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:ring-emerald-100 cursor-pointer"
                                                            title="Publish Collection"
                                                        >
                                                            <Send className="h-4 w-4" />
                                                        </button>
                                                        <Link
                                                            href={edit.url(collection.ulid)}
                                                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-xs ring-1 ring-slate-200 transition-all hover:bg-blue-50 hover:text-blue-500 hover:ring-blue-100"
                                                            title="Edit Collection"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Link>
                                                    </>
                                                )}
                                                <Link
                                                    href={show.url(collection.ulid)}
                                                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-650 transition-all hover:bg-blue-500 hover:text-white"
                                                >
                                                    <ArrowRight className="h-4.5 w-4.5" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-300">
                            <Wallet className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-slate-900">No collections found</h3>
                        <p className="mt-2 max-w-sm text-slate-500">Create your first collection to start managing estate dues and levies.</p>
                        {hasBanking ? (
                            <Link
                                href={create.url()}
                                className="mt-8 flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-slate-900 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Create Collection
                            </Link>
                        ) : (
                            <button
                                onClick={() => setIsBankingModalOpen(true)}
                                className="mt-8 flex items-center gap-2 rounded-2xl bg-amber-600 px-8 py-3.5 text-sm font-black text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-700 active:scale-95 cursor-pointer"
                            >
                                <Building2 className="h-5 w-5" />
                                Setup Bank Account First
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {showPagination && (
                <div className="mt-6 flex items-center justify-between rounded-2xl bg-white p-4 border border-slate-200/60 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500">
                        Showing page <span className="font-bold text-slate-900">{collections.current_page}</span> of total <span className="font-bold text-slate-900">{collections.total}</span> items.
                    </p>
                    <div className="flex items-center gap-1.5">
                        {collections.links.map((link, idx) => {
                            if (link.label.includes('Previous')) {
                                return link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-650 hover:bg-slate-100 transition-colors"
                                    >
                                        <ChevronLeft className="h-4.5 w-4.5" />
                                    </Link>
                                ) : (
                                    <span key={idx} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50/50 text-slate-300 cursor-not-allowed">
                                        <ChevronLeft className="h-4.5 w-4.5" />
                                    </span>
                                );
                            }
                            if (link.label.includes('Next')) {
                                return link.url ? (
                                    <Link
                                        key={idx}
                                        href={link.url}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-650 hover:bg-slate-100 transition-colors"
                                    >
                                        <ChevronRight className="h-4.5 w-4.5" />
                                    </Link>
                                ) : (
                                    <span key={idx} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50/50 text-slate-300 cursor-not-allowed">
                                        <ChevronRight className="h-4.5 w-4.5" />
                                    </span>
                                );
                            }
                            
                            // Number links
                            return link.active ? (
                                <span
                                    key={idx}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-xs"
                                >
                                    {link.label}
                                </span>
                            ) : link.url ? (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ) : (
                                <span key={idx} className="px-2 text-slate-400 text-xs">...</span>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}

CollectionsIndex.layout = (page: any) => <AdminLayout children={page} />;
