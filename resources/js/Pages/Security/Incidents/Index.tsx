import { Head, Link, router, usePage } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Eye,
    Lock,
    MapPin,
    MessageSquare,
    Plus,
    Search,
    ThumbsUp,
    Wrench,
    Zap,
    Filter,
    ArrowRight,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import MobileSheet from '@/Components/MobileSheet';
import Modal from '@/Components/Modal';
import SecurityLayout from '@/Layouts/SecurityLayout';
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
                bg: 'bg-amber-50/70',
                text: 'text-amber-800',
                border: 'border-amber-200/50',
                icon: <Clock className="h-3 w-3" />,
                label: 'Pending Review',
            };
        case 'acknowledged':
            return {
                bg: 'bg-blue-50/70',
                text: 'text-blue-800',
                border: 'border-blue-200/50',
                icon: <Eye className="h-3 w-3" />,
                label: 'Acknowledged',
            };
        case 'resolving':
            return {
                bg: 'bg-indigo-50/70',
                text: 'text-indigo-800',
                border: 'border-indigo-200/50',
                icon: <Wrench className="h-3 w-3" />,
                label: 'Resolving',
            };
        case 'solved':
            return {
                bg: 'bg-emerald-50/70',
                text: 'text-emerald-800',
                border: 'border-emerald-200/50',
                icon: <CheckCircle2 className="h-3 w-3" />,
                label: 'Proposed Solved',
            };
        case 'closed':
            return {
                bg: 'bg-slate-100/70',
                text: 'text-slate-600',
                border: 'border-slate-200/60',
                icon: <CheckCircle2 className="h-3 w-3" />,
                label: 'Closed',
            };
        default:
            return {
                bg: 'bg-slate-50',
                text: 'text-slate-600',
                border: 'border-slate-200',
                icon: <Clock className="h-3 w-3" />,
                label: 'Reported',
            };
    }
};

const getCategoryIcon = (category: IncidentCategory) => {
    switch (category) {
        case 'electricity':
            return <Zap className="h-3.5 w-3.5" />;
        case 'security':
            return <AlertTriangle className="h-3.5 w-3.5" />;
        default:
            return <Wrench className="h-3.5 w-3.5" />;
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
        const params: Record<string, string | undefined> = {
            search: search || undefined,
            category: category || undefined,
            tab: tab !== 'all' ? tab : undefined,
            sort: sort !== 'newest' ? sort : undefined,
            ...newParams,
        };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        router.get('/security/incidents', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const filterFormContent = (
        <div className="space-y-6 pt-2">
            {/* Sort Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Sort By</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setSort('newest')}
                        className={`min-h-[44px] rounded-2xl px-4 py-2 text-xs font-bold ring-1 transition-all ${
                            sort === 'newest'
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-100 ring-slate-900'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        Newest
                    </button>
                    <button
                        type="button"
                        onClick={() => setSort('popular')}
                        className={`min-h-[44px] rounded-2xl px-4 py-2 text-xs font-bold ring-1 transition-all ${
                            sort === 'popular'
                                ? 'bg-slate-900 text-white shadow-md shadow-slate-100 ring-slate-900'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        Popular
                    </button>
                </div>
            </div>

            {/* Status Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Status Group</label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'open', label: 'Active' },
                        { id: 'solved', label: 'Solved' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={`min-h-[44px] rounded-2xl px-3 py-2 text-xs font-bold ring-1 transition-all ${
                                tab === item.id
                                    ? 'bg-slate-900 text-white ring-slate-900'
                                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Filter */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Category</label>
                <div className="mt-2 space-y-1.5">
                    <button
                        type="button"
                        onClick={() => setCategory('')}
                        className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl px-4 py-2 text-xs font-bold ring-1 transition-all ${
                            category === ''
                                ? 'bg-slate-900 text-white ring-slate-900'
                                : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                        }`}
                    >
                        <span>All Categories</span>
                        {category === '' && <span className="text-[10px]">✓</span>}
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.value}
                            type="button"
                            onClick={() => setCategory(cat.value)}
                            className={`flex min-h-[44px] w-full items-center justify-between rounded-2xl px-4 py-2 text-xs font-bold ring-1 transition-all ${
                                category === cat.value
                                    ? 'bg-slate-900 text-white ring-slate-900'
                                    : 'bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            <span className="capitalize">{cat.label}</span>
                            {category === cat.value && <span className="text-[10px]">✓</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Apply & Reset Buttons */}
            <div className="flex gap-3 border-t border-slate-100 pt-5">
                <button
                    type="button"
                    onClick={() => {
                        setSort('newest');
                        setTab('all');
                        setCategory('');
                        applyFilters({ sort: 'newest', tab: 'all', category: '' });
                        setIsFilterSheetOpen(false);
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-black tracking-wider text-slate-600 uppercase hover:bg-slate-50"
                >
                    Reset
                </button>
                <button
                    type="button"
                    onClick={() => {
                        applyFilters({ sort, tab, category });
                        setIsFilterSheetOpen(false);
                    }}
                    className="flex-1 rounded-2xl bg-slate-900 py-3 text-xs font-black tracking-wider text-white uppercase hover:bg-slate-800"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Security Incident Workspace" />

            <div className="flex flex-col gap-5">
                {/* Header Action Bar */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-black tracking-tight text-slate-900">Incidents</h1>
                        <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400">
                            Report on-site issues and monitor active resolution progress.
                        </p>
                    </div>

                    <Link
                        href="/security/incidents/create"
                        className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-slate-900 px-4 text-xs font-black tracking-wide text-white uppercase shadow-sm transition active:scale-95"
                    >
                        <Plus className="h-4.5 w-4.5" strokeWidth={3} />
                        Report
                    </Link>
                </div>

                {/* Search Bar & Filter trigger */}
                <div className="flex gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <Search className="absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search incidents..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-4 pl-11 text-xs font-semibold transition-all placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                        />
                    </form>
                    <button
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all ${
                            category || tab !== 'all' || sort !== 'newest'
                                ? 'border-slate-900 bg-slate-900 text-white'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                    >
                        <Filter className="h-4.5 w-4.5" />
                    </button>
                </div>

                {/* Incident List */}
                <div className="space-y-3">
                    {incidents.data.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-4 py-12 text-center">
                            <AlertTriangle className="h-9 w-9 text-slate-400" />
                            <h3 className="mt-3 text-xs font-bold text-slate-700">No incident reports found</h3>
                            <p className="mt-1 max-w-[240px] text-[10px] font-semibold text-slate-400">
                                There are no incident records matching your search or filters at the moment.
                            </p>
                        </div>
                    ) : (
                        incidents.data.map((incident) => {
                            const statusStyle = getStatusStyles(incident.status);
                            const categoryLabel = typeof incident.category === 'object' ? incident.category.label : incident.category;

                            return (
                                <Link
                                    key={incident.id}
                                    href={`/security/incidents/${incident.hashid}`}
                                    className="group block rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all hover:border-slate-300"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 flex-col gap-1">
                                            {/* Category & Status badges */}
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-black text-slate-500 uppercase">
                                                    {getCategoryIcon(incident.category as IncidentCategory)}
                                                    {categoryLabel}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[8px] font-black text-slate-500 uppercase ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                                                >
                                                    {statusStyle.icon}
                                                    {statusStyle.label}
                                                </span>
                                                {incident.is_private && (
                                                    <span className="inline-flex items-center gap-0.5 rounded border border-rose-200/50 bg-rose-50 px-1.5 py-0.5 text-[8px] font-black text-rose-700 uppercase">
                                                        <Lock className="h-2 w-2" />
                                                        Internal
                                                    </span>
                                                )}
                                            </div>

                                            {/* Title */}
                                            <h3 className="mt-1.5 text-xs leading-snug font-bold text-slate-900 transition group-hover:text-slate-950">
                                                {incident.title}
                                            </h3>

                                            {/* Body snippet */}
                                            <p className="mt-0.5 line-clamp-2 text-[10px] leading-normal font-semibold text-slate-400">
                                                {incident.body}
                                            </p>

                                            {/* Location & Time details */}
                                            <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] font-bold text-slate-400">
                                                {incident.location && (
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin className="text-slate-350 h-3 w-3" />
                                                        {incident.location}
                                                    </span>
                                                )}
                                                <span>Reported {formatDistanceToNow(new Date(incident.created_at))} ago</span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end gap-2.5 self-center">
                                            {/* Actions */}
                                            <span className="rounded-full bg-slate-50 p-2 text-slate-400 transition group-hover:bg-slate-100 group-hover:text-slate-800">
                                                <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Filter Mobile Bottom Sheet */}
            {isMobile ? (
                <MobileSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Incidents">
                    {filterFormContent}
                </MobileSheet>
            ) : (
                <Modal isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} maxWidth="md">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-sm font-black tracking-wider text-slate-900 uppercase">Filter Incidents</h3>
                            <button onClick={() => setIsFilterSheetOpen(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        {filterFormContent}
                    </div>
                </Modal>
            )}
        </>
    );
}
