import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    Plus,
    Search,
    ThumbsUp,
    Wrench,
    Zap,
    Filter,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import MobileSheet from '@/Components/MobileSheet';
import Modal from '@/Components/Modal';
import type { Incident, IncidentCategory, IncidentStatus, PaginatedData, SharedData } from '@/types';

type Props = {
    incidents: PaginatedData<Incident>;
    filters: {
        category?: string;
        status?: string;
        tab?: string;
        search?: string;
        sort?: string;
    };
    categories: Array<{ value: string; label: string }>;
};

const getStatusStyles = (status: IncidentStatus) => {
    switch (status) {
        case 'pending':
            return {
                bg: 'bg-amber-50',
                text: 'text-amber-700',
                border: 'border-amber-200/50',
                icon: <Clock className="h-3 w-3" />,
                label: 'Pending',
            };
        case 'acknowledged':
            return {
                bg: 'bg-blue-50',
                text: 'text-blue-700',
                border: 'border-blue-200/50',
                icon: <Eye className="h-3 w-3" />,
                label: 'Acknowledged',
            };
        case 'resolving':
            return {
                bg: 'bg-indigo-50',
                text: 'text-indigo-700',
                border: 'border-indigo-200/50',
                icon: <Wrench className="h-3 w-3" />,
                label: 'Resolving',
            };
        case 'solved':
            return {
                bg: 'bg-emerald-50',
                text: 'text-emerald-700',
                border: 'border-emerald-200/50',
                icon: <CheckCircle2 className="h-3 w-3" />,
                label: 'Solved',
            };
        case 'closed':
            return {
                bg: 'bg-slate-100',
                text: 'text-slate-600',
                border: 'border-slate-200',
                icon: <CheckCircle2 className="h-3 w-3" />,
                label: 'Closed',
            };
        default:
            return {
                bg: 'bg-slate-50',
                text: 'text-slate-600',
                border: 'border-slate-200',
                icon: <Clock className="h-3 w-3" />,
                label: 'Unknown',
            };
    }
};

const getCategoryIcon = (category: IncidentCategory) => {
    switch (category) {
        case 'electricity':
            return <Zap className="h-4 w-4" />;
        case 'security':
            return <AlertTriangle className="h-4 w-4" />;
        default:
            return <Wrench className="h-4 w-4" />;
    }
};

export default function Index({ incidents, filters, categories }: Props) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [category, setCategory] = useState(typeof filters?.category === 'string' ? filters.category : '');
    const [tab, setTab] = useState(typeof filters?.tab === 'string' ? filters.tab : 'all');
    const [sort, setSort] = useState((typeof filters?.sort === 'string' ? filters.sort : '') || 'newest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const applyFilters = (newParams: Record<string, string | undefined>) => {
        const params = {
            search: search || undefined,
            category: category || undefined,
            tab: tab !== 'all' ? tab : undefined,
            sort: sort !== 'newest' ? sort : undefined,
            ...newParams,
        };

        // remove undefined values
        Object.keys(params).forEach(key => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        router.get('/resident/incidents', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleCategoryChange = (val: string) => {
        setCategory(val);
        applyFilters({ category: val || undefined });
    };

    const handleTabChange = (tabId: string) => {
        setTab(tabId);
        applyFilters({ tab: tabId || undefined });
    };

    const handleSortChange = (sortId: string) => {
        setSort(sortId);
        applyFilters({ sort: sortId || undefined });
    };

    const handleUpvote = (e: React.MouseEvent, incident: Incident) => {
        e.preventDefault();
        e.stopPropagation();

        router.post(
            `/resident/incidents/${incident.hashid}/upvote`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Handled automatically by Inertia reloading props
                },
            }
        );
    };

    const filterFormContent = (
        <div className="space-y-6 pt-4">
            {/* Sort Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                    Sort By
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setSort('newest')}
                        className={`rounded-xl py-3 text-sm font-bold transition-all ring-1 ${
                            sort === 'newest'
                                ? 'bg-indigo-600 text-white ring-indigo-600'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        Newest
                    </button>
                    <button
                        type="button"
                        onClick={() => setSort('popular')}
                        className={`rounded-xl py-3 text-sm font-bold transition-all ring-1 ${
                            sort === 'popular'
                                ? 'bg-indigo-600 text-white ring-indigo-600'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        Popular
                    </button>
                </div>
            </div>

            {/* Status Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                    Status
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'open', label: 'Open' },
                        { id: 'solved', label: 'Solved' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={`rounded-xl py-3 text-xs font-bold transition-all ring-1 ${
                                tab === item.id
                                    ? 'bg-indigo-600 text-white ring-indigo-600'
                                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                    Category
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    <button
                        type="button"
                        onClick={() => setCategory('')}
                        className={`rounded-xl py-3 px-4 text-left text-xs font-bold transition-all ring-1 ${
                            !category
                                ? 'bg-indigo-600 text-white ring-indigo-600'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setCategory(c.value)}
                            className={`rounded-xl py-3 px-4 text-left text-xs font-bold transition-all ring-1 truncate ${
                                category === c.value
                                    ? 'bg-indigo-600 text-white ring-indigo-600'
                                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => {
                        setSearch('');
                        setCategory('');
                        setTab('all');
                        setSort('newest');
                        applyFilters({
                            search: undefined,
                            category: undefined,
                            tab: undefined,
                            sort: undefined,
                        });
                        setIsFilterSheetOpen(false);
                    }}
                    className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                >
                    Reset All
                </button>
                <button
                    type="button"
                    onClick={() => {
                        applyFilters({
                            category: category || undefined,
                            tab: tab !== 'all' ? tab : undefined,
                            sort: sort !== 'newest' ? sort : undefined,
                        });
                        setIsFilterSheetOpen(false);
                    }}
                    className="flex-[2] rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Community Incidents" />

            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 px-1 sm:flex-row sm:items-center">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900">
                        Community Incidents
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Transparent, estate-wide issue tracking and resolution.
                    </p>
                </div>
                <div>
                    <Link
                        href="/resident/incidents/create"
                        className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 hover:shadow-indigo-200"
                    >
                        <Plus className="h-4 w-4" strokeWidth={3} />
                        Report Incident
                    </Link>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search incidents..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4"
                        />
                        <Search className="absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                    </form>

                    <button
                        type="button"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={`flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold ring-1 ring-slate-200/80 transition-all active:scale-95 ${
                            category || tab !== 'all' || sort !== 'newest'
                                ? 'text-indigo-600 ring-indigo-500/30 bg-indigo-50/20'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Filter className="h-4.5 w-4.5" />
                        <span className="hidden sm:inline">Filters</span>
                        {(category || tab !== 'all' || sort !== 'newest') && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                                {[category && 1, tab !== 'all' && 1, sort !== 'newest' && 1].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Sheet / Modal */}
            {isMobile ? (
                <MobileSheet
                    isOpen={isFilterSheetOpen}
                    onClose={() => setIsFilterSheetOpen(false)}
                    title="Filter Incidents"
                >
                    {filterFormContent}
                </MobileSheet>
            ) : (
                <Modal
                    isOpen={isFilterSheetOpen}
                    onClose={() => setIsFilterSheetOpen(false)}
                    title="Filter Incidents"
                    maxWidth="md"
                >
                    {filterFormContent}
                </Modal>
            )}

            {/* Incidents Feed */}
            {incidents.data.length > 0 ? (
                <div className="space-y-4">
                    {incidents.data.map((incident, idx) => {
                        const statusStyles = getStatusStyles(incident.status);
                        const isMyReport = incident.reporter.id === authUser?.id;

                        return (
                            <motion.div
                                key={incident.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: idx * 0.04 }}
                                className="group rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]"
                            >
                                <Link
                                    href={`/resident/incidents/${incident.hashid}`}
                                    className="block"
                                >
                                    {/* Top Metadata */}
                                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {/* Status Badge */}
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
                                            >
                                                {statusStyles.icon}
                                                {statusStyles.label}
                                            </span>

                                            {/* Category */}
                                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                                                {getCategoryIcon(incident.category)}
                                                {incident.category.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <span className="text-xs text-slate-400">
                                            {formatDistanceToNow(new Date(incident.created_at), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    </div>

                                    {/* Title & Body */}
                                    <h2 className="mb-1 text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                        {incident.title}
                                    </h2>
                                    <p className="line-clamp-2 text-sm leading-relaxed text-slate-500 mb-4">
                                        {incident.body}
                                    </p>

                                    {/* Bottom Info & Interactions */}
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-3.5">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                                                {incident.reporter.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span>{incident.reporter.name}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Comments count */}
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <MessageSquare className="h-4.5 w-4.5" />
                                                <span className="text-xs font-black">
                                                    {incident.comments_count}
                                                </span>
                                            </div>

                                            {/* Upvote Button */}
                                            <button
                                                onClick={e => handleUpvote(e, incident)}
                                                disabled={isMyReport}
                                                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all ${
                                                    incident.is_upvoted
                                                        ? 'bg-indigo-50 text-indigo-600 font-black'
                                                        : isMyReport
                                                          ? 'text-slate-300 cursor-not-allowed'
                                                          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                                }`}
                                            >
                                                <ThumbsUp
                                                    className="h-4 w-4"
                                                    fill={
                                                        incident.is_upvoted ? 'currentColor' : 'none'
                                                    }
                                                />
                                                <span className="text-xs font-bold">
                                                    {incident.upvotes_count}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}

                    {/* Pagination Links */}
                    {incidents.links && incidents.links.length > 3 && (
                        <div className="mt-6 flex justify-center">
                            <div className="flex flex-wrap gap-1">
                                {incidents.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        disabled={!link.url}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                  ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                  : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty state */
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center"
                >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-xs">
                        <AlertTriangle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Incidents Found</h3>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">
                        {search || category
                            ? 'Try refining or clearing your filters to see results.'
                            : 'There are currently no active incidents reported in this estate.'}
                    </p>
                </motion.div>
            )}
        </>
    );
}
