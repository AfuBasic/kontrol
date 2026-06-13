import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Clock, Eye, MessageSquare, Search, ThumbsUp, Wrench, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import MobileSheet from '@/Components/MobileSheet';
import Modal from '@/Components/Modal';
import type { Incident, IncidentCategory, IncidentStatus, PaginatedData } from '@/types';

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
    statuses: Array<{ value: string; label: string }>;
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

export default function Index({ incidents, filters, categories, statuses }: Props) {
    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [category, setCategory] = useState(typeof filters?.category === 'string' ? filters.category : '');
    const [status, setStatus] = useState(typeof filters?.status === 'string' ? filters.status : '');
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
        const params: Record<string, string | undefined> = {
            search: search || undefined,
            category: category || undefined,
            status: status || undefined,
            sort: sort !== 'newest' ? sort : undefined,
            ...newParams,
        };

        // remove undefined values
        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        router.get('/admin/incidents', params, {
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

    const handleStatusChange = (val: string) => {
        setStatus(val);
        applyFilters({ status: val || undefined });
    };

    const handleSortChange = (sortId: string) => {
        setSort(sortId);
        applyFilters({ sort: sortId || undefined });
    };

    const filterFormContent = (
        <div className="space-y-6 pt-4">
            {/* Sort Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Sort By</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setSort('newest')}
                        className={`rounded-xl py-3 text-sm font-bold ring-1 transition-all ${
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
                        className={`rounded-xl py-3 text-sm font-bold ring-1 transition-all ${
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
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Status</label>
                <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    <button
                        type="button"
                        onClick={() => setStatus('')}
                        className={`rounded-xl px-4 py-3 text-left text-xs font-bold ring-1 transition-all ${
                            !status ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        All Statuses
                    </button>
                    {statuses.map((s) => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setStatus(s.value)}
                            className={`truncate rounded-xl px-4 py-3 text-left text-xs font-bold ring-1 transition-all ${
                                status === s.value
                                    ? 'bg-indigo-600 text-white ring-indigo-600'
                                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Category</label>
                <div className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1">
                    <button
                        type="button"
                        onClick={() => setCategory('')}
                        className={`rounded-xl px-4 py-3 text-left text-xs font-bold ring-1 transition-all ${
                            !category ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setCategory(c.value)}
                            className={`truncate rounded-xl px-4 py-3 text-left text-xs font-bold ring-1 transition-all ${
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
            <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button
                    type="button"
                    onClick={() => {
                        setSearch('');
                        setCategory('');
                        setStatus('');
                        setSort('newest');
                        applyFilters({
                            search: undefined,
                            category: undefined,
                            status: undefined,
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
                            status: status || undefined,
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
            <Head title="Manage Incidents" />

            {/* Header */}
            <div className="mb-6 px-1">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Community Incidents</h1>
                <p className="mt-1 text-sm text-slate-500">Track, assign, and update resolution progress for estate incidents.</p>
            </div>

            {/* Filters Bar */}
            <div className="mb-6">
                <div className="flex gap-3">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search incidents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pr-4 pl-11 text-sm ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                        />
                        <Search className="absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                    </form>

                    <button
                        type="button"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={`flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold ring-1 ring-slate-200/80 transition-all active:scale-95 ${
                            category || status || sort !== 'newest'
                                ? 'bg-indigo-50/20 text-indigo-600 ring-indigo-500/30'
                                : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Filter className="h-4.5 w-4.5" />
                        <span className="hidden sm:inline">Filters</span>
                        {(category || status || sort !== 'newest') && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white">
                                {[category && 1, status && 1, sort !== 'newest' && 1].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Sheet / Modal */}
            {isMobile ? (
                <MobileSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Incidents">
                    {filterFormContent}
                </MobileSheet>
            ) : (
                <Modal isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Incidents" maxWidth="md">
                    {filterFormContent}
                </Modal>
            )}

            {/* Incidents Table / List */}
            {incidents.data.length > 0 ? (
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50 text-xs font-black tracking-wider text-slate-400 uppercase">
                                    <th className="px-6 py-4">Incident</th>
                                    <th className="px-6 py-4">Reporter</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assignee</th>
                                    <th className="px-6 py-4 text-right">Engagement</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {incidents.data.map((incident, idx) => {
                                    const statusInfo = getStatusStyles(incident.status);

                                    return (
                                        <tr key={incident.id} className="group transition-colors hover:bg-slate-50/30">
                                            <td className="px-6 py-4">
                                                <Link href={`/admin/incidents/${incident.hashid}`} className="block">
                                                    <span className="block font-bold text-slate-900 transition-colors group-hover:text-indigo-600">
                                                        {incident.title}
                                                    </span>
                                                    <span className="mt-1 block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                        Reported {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                                                    </span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-medium text-slate-500">{incident.reporter.name}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                <span className="inline-flex rounded-full bg-slate-50 px-2 py-0.5 font-medium">
                                                    {incident.category.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ring-inset ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                                                >
                                                    {statusInfo.icon}
                                                    {statusInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {incident.assignee ? (
                                                    <span className="font-semibold text-slate-700">{incident.assignee.name}</span>
                                                ) : (
                                                    <span className="text-slate-300 italic">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="inline-flex items-center gap-3 text-slate-400">
                                                    <span className="inline-flex items-center gap-1 text-xs">
                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                        {incident.upvotes_count}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 text-xs">
                                                        <MessageSquare className="h-3.5 w-3.5" />
                                                        {incident.comments_count}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {incidents.links && incidents.links.length > 3 && (
                        <div className="flex justify-center border-t border-slate-50 p-4">
                            <div className="flex flex-wrap gap-1">
                                {incidents.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        disabled={!link.url}
                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                  ? 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                                  : 'cursor-not-allowed bg-slate-50 text-slate-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Empty state matching system default */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-slate-100 p-4 ring-8 ring-slate-50">
                        <AlertTriangle className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No Incidents Found</h3>
                    <p className="mt-1 max-w-sm text-sm text-slate-500">
                        {search || category || status
                            ? 'Try adjusting or clearing your search and filters to find what you are looking for.'
                            : 'There are currently no reported incidents in this estate.'}
                    </p>
                    {(search || category || status) && (
                        <button
                            onClick={() => {
                                setSearch('');
                                setCategory('');
                                setStatus('');
                                applyFilters({ search: undefined, category: undefined, status: undefined });
                            }}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
