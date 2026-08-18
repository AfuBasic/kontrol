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
import React, { useCallback, useEffect, useState } from 'react';

import MobileSheet from '@/Components/MobileSheet';
import Modal from '@/Components/Modal';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { type PendingIncident, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
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
    allowResidentReporting?: boolean;
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

export default function Index({ incidents, filters, categories, allowResidentReporting = true }: Props) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;
    const { operations, retryOperation, syncNow, isSyncing } = useSyncStatus();

    const [search, setSearch] = useState(typeof filters?.search === 'string' ? filters.search : '');
    const [category, setCategory] = useState(typeof filters?.category === 'string' ? filters.category : '');
    const [tab, setTab] = useState(typeof filters?.tab === 'string' ? filters.tab : 'all');
    const [sort, setSort] = useState((typeof filters?.sort === 'string' ? filters.sort : '') || 'newest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(true);
    const [pendingIncidents, setPendingIncidents] = useState<PendingIncident[]>([]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const refreshPending = useCallback(async () => {
        try {
            const stored = await ResidentStore.getPendingIncidents();
            const merged = stored.map((item) => {
                const op = operations.find((o) => o.id === item.id);
                return op ? { ...item, status: op.status, error: op.lastError ?? item.error } : item;
            });
            setPendingIncidents(merged.filter((i) => i.status !== SyncStatus.Synced));

            const synced = stored.filter((i) => operations.find((o) => o.id === i.id)?.status === SyncStatus.Synced);
            if (synced.length > 0) {
                await Promise.all(synced.map((i) => ResidentStore.removePendingIncident(i.id)));
                router.reload({ only: ['incidents'] });
            }
        } catch {
            setPendingIncidents([]);
        }
    }, [operations]);

    useEffect(() => {
        void refreshPending();
    }, [refreshPending]);

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

        router.get('/resident/incidents', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search });
    };

    const handleUpvote = (e: React.MouseEvent, incident: Incident) => {
        e.preventDefault();
        e.stopPropagation();

        router.post(
            `/resident/incidents/${incident.hashid}/upvote`,
            {},
            {
                preserveScroll: true,
            },
        );
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
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-indigo-600'
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
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-indigo-600'
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
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-indigo-600'
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
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Category Filters</label>
                <div className="mt-2 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1">
                    <button
                        type="button"
                        onClick={() => setCategory('')}
                        className={`min-h-[44px] rounded-2xl px-4 py-2 text-left text-xs font-bold ring-1 transition-all ${
                            !category
                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-indigo-600'
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
                            className={`min-h-[44px] truncate rounded-2xl px-4 py-2 text-left text-xs font-bold ring-1 transition-all ${
                                category === c.value
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 ring-indigo-600'
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
                    className="min-h-[44px] flex-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
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
                    className="min-h-[44px] flex-[2] rounded-2xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Community Incidents" />

            {/* Header section with decorative ambient glow */}
            <div className="relative mb-6 overflow-hidden rounded-3xl bg-slate-900 px-5 py-6 text-white shadow-xl shadow-slate-100/50">
                <div className="absolute top-[-40px] right-[-40px] h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="relative z-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <span className="text-[9px] font-black tracking-[0.2em] text-indigo-300 uppercase">Community Issue Tracker</span>
                        <h1 className="mt-1 text-2xl font-black tracking-tight">Incident Board</h1>
                        <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-300">
                            Collaborative issue logging, progress status notifications, and real-time resolution updates.
                        </p>
                    </div>
                    <div>
                        {allowResidentReporting ? (
                            <Link
                                href="/resident/incidents/create"
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-indigo-500/20 transition-all hover:from-indigo-600 hover:to-violet-700 hover:shadow-indigo-500/30 active:scale-95"
                            >
                                <Plus className="h-4 w-4" strokeWidth={3} />
                                Report Incident
                            </Link>
                        ) : (
                            <span className="inline-flex items-center rounded-xl bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-300">
                                Reporting Disabled
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Search and Filters Controls */}
            <div className="mb-6">
                <div className="flex gap-2">
                    <form onSubmit={handleSearchSubmit} className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search keywords, locations, description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white py-2.5 pr-4 pl-11 text-xs text-slate-800 placeholder-slate-400 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                        />
                        <Search className="absolute top-3.5 left-4 h-4.5 w-4.5 text-slate-400" />
                    </form>

                    <button
                        type="button"
                        onClick={() => setIsFilterSheetOpen(true)}
                        className={`flex min-h-[44px] items-center gap-2 rounded-2xl border bg-white px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                            category || tab !== 'all' || sort !== 'newest'
                                ? 'border-indigo-500 bg-indigo-50/10 text-indigo-600'
                                : 'border-slate-200 text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Filter className="h-4.5 w-4.5" />
                        <span className="hidden sm:inline">Filter View</span>
                        {(category || tab !== 'all' || sort !== 'newest') && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-black text-white">
                                {[category && 1, tab !== 'all' && 1, sort !== 'newest' && 1].filter(Boolean).length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Drawer sheet / modal */}
            {isMobile ? (
                <MobileSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Incidents">
                    {filterFormContent}
                </MobileSheet>
            ) : (
                <Modal isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter Incidents" maxWidth="md">
                    {filterFormContent}
                </Modal>
            )}

            {pendingIncidents.length > 0 && (
                <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <p className="text-[11px] font-bold tracking-widest text-amber-700 uppercase">
                            Pending offline reports ({pendingIncidents.length})
                        </p>
                        <button
                            type="button"
                            onClick={() => void syncNow()}
                            disabled={isSyncing}
                            className="text-[10px] font-bold text-amber-800 underline disabled:opacity-50"
                        >
                            Sync now
                        </button>
                    </div>
                    {pendingIncidents.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">{item.title || 'Incident report'}</p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">{item.category || 'General'} · will submit when online</p>
                                </div>
                                <span className="shrink-0 rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                    {item.status === SyncStatus.Failed ? 'Failed' : item.status === SyncStatus.Syncing ? 'Syncing' : 'Pending'}
                                </span>
                            </div>
                            {item.status === SyncStatus.Failed && (
                                <button type="button" onClick={() => void retryOperation(item.id)} className="mt-2 text-xs font-bold text-indigo-600">
                                    Retry
                                </button>
                            )}
                        </div>
                    ))}
                </div>
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
                                className="group rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] transition-all duration-300 hover:border-slate-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.035)]"
                            >
                                <Link href={`/resident/incidents/${incident.hashid}`} className="flex items-start gap-4">
                                    {/* Left Column: Avatar */}
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200/60 bg-slate-50 text-base font-black text-slate-700 shadow-xs select-none">
                                        {incident.reporter.name.charAt(0).toUpperCase()}
                                    </div>

                                    {/* Right Column: All Content & Actions */}
                                    <div className="min-w-0 flex-1 space-y-3.5">
                                        {/* User Meta Header Row */}
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                    <span className="hover:text-indigo-650 text-sm leading-tight font-black text-slate-900 transition-colors">
                                                        {incident.reporter.name}
                                                    </span>
                                                    <span className="truncate text-xs font-medium text-slate-400">
                                                        @{incident.reporter.name.toLowerCase().replace(/[^a-z0-9]/g, '')}
                                                    </span>
                                                    <span className="xs:inline hidden text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                                                        &middot; {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>

                                                {/* Category Hashtag & Tags */}
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-[10px] font-black tracking-wider text-indigo-600 uppercase">
                                                        #{incident.category}
                                                    </span>
                                                    {incident.is_private && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-amber-200/50 bg-amber-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase">
                                                            <Lock className="h-2.5 w-2.5" />
                                                            Private
                                                        </span>
                                                    )}
                                                    {incident.location && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-slate-200/50 bg-slate-50 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                                                            <MapPin className="h-2.5 w-2.5 text-indigo-500" />
                                                            {incident.location}
                                                        </span>
                                                    )}
                                                    {incident.zone ? (
                                                        <span className="border-indigo-250 inline-flex items-center gap-1 rounded-md border bg-indigo-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-indigo-700 uppercase">
                                                            Scope: {incident.zone.name}
                                                        </span>
                                                    ) : (
                                                        <span className="border-slate-250 inline-flex items-center gap-1 rounded-md border bg-slate-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-slate-500 uppercase">
                                                            Scope: Entire Estate
                                                        </span>
                                                    )}
                                                    <span className="xs:inline hidden text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                                        &middot; {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                                                    </span>
                                                    <span className="xs:hidden text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                                                        &middot; {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span
                                                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black tracking-wider ${statusStyles.bg} ${statusStyles.text} ${statusStyles.border}`}
                                            >
                                                {statusStyles.icon}
                                                {statusStyles.label.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Post Content */}
                                        <div className="min-w-0 space-y-1.5 overflow-hidden">
                                            <h2 className="group-hover:text-indigo-650 flex items-center gap-1.5 text-base font-black [overflow-wrap:anywhere] break-words text-slate-900 transition-colors">
                                                <span className="min-w-0 flex-1">{incident.title}</span>
                                                <ArrowRight className="text-indigo-650 h-4 w-4 shrink-0 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                                            </h2>
                                            <p className="line-clamp-3 text-xs leading-relaxed [overflow-wrap:anywhere] break-words text-slate-500">
                                                {incident.body}
                                            </p>
                                        </div>

                                        {/* Large Full-Width Media Preview */}
                                        {incident.attachment_url && incident.attachment_type === 'image' && (
                                            <div className="group/media relative aspect-video max-h-64 w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50">
                                                <img
                                                    src={incident.attachment_url}
                                                    alt={incident.title}
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover/media:scale-[1.015]"
                                                />
                                            </div>
                                        )}

                                        {/* Footer Action Icons */}
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                            <div className="flex items-center gap-4">
                                                {/* Upvote Icon button */}
                                                <button
                                                    onClick={(e) => handleUpvote(e, incident)}
                                                    disabled={isMyReport}
                                                    className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                                                        incident.is_upvoted
                                                            ? 'bg-indigo-50 font-black text-indigo-600'
                                                            : isMyReport
                                                              ? 'cursor-not-allowed text-slate-300'
                                                              : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'
                                                    }`}
                                                >
                                                    <ThumbsUp
                                                        className="h-4 w-4 transition-transform group-hover:scale-110"
                                                        fill={incident.is_upvoted ? 'currentColor' : 'none'}
                                                    />
                                                    <span>{incident.upvotes_count}</span>
                                                </button>

                                                {/* Comments count link */}
                                                <div className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-slate-400 transition-all hover:bg-slate-50 hover:text-indigo-600">
                                                    <MessageSquare className="h-4 w-4" />
                                                    <span>{incident.comments_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}

                    {/* Pagination Links */}
                    {incidents.links && incidents.links.length > 3 && (
                        <div className="mt-8 flex justify-center">
                            <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1.5">
                                {incidents.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        disabled={!link.url}
                                        className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                                : link.url
                                                  ? 'text-slate-600 hover:bg-white'
                                                  : 'cursor-not-allowed text-slate-300'
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

Index.layout = (page: React.ReactNode) => <ResidentLayout children={page} />;
