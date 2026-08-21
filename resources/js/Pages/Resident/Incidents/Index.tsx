import React, { useCallback, useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Filter,
    Plus,
    RefreshCw,
    Search,
    ShieldAlert,
    SlidersHorizontal,
    Sparkles,
    X,
} from 'lucide-react';
import MobileSheet from '@/Components/MobileSheet';
import EmptyState from '@/Components/States/EmptyState';
import IncidentCard from '@/Components/Incidents/IncidentCard';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import ResidentLayout from '@/Layouts/ResidentLayout';
import { type PendingIncident, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
import type { Incident, PaginatedData, SharedData } from '@/types';

interface Props {
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
}

export default function Index({
    incidents = { data: [], links: [], total: 0 } as unknown as PaginatedData<Incident>,
    filters = {},
    categories = [],
    allowResidentReporting = true,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const { operations = [] } = useSyncStatus();

    const [search, setSearch] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [currentTab, setCurrentTab] = useState(filters?.tab || 'all');
    const [currentSort, setCurrentSort] = useState(filters?.sort || 'newest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [pendingIncidents, setPendingIncidents] = useState<PendingIncident[]>([]);

    const refreshPending = useCallback(async () => {
        try {
            const stored = await ResidentStore.getPendingIncidents();
            const merged = stored.map((item) => {
                const op = operations.find((o) => o.id === item.id);
                return op ? { ...item, status: op.status, error: op.lastError ?? item.error } : item;
            });
            setPendingIncidents(merged.filter((i) => i.status !== SyncStatus.Synced));

            const synced = stored.filter(
                (i) => operations.find((o) => o.id === i.id)?.status === SyncStatus.Synced
            );
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
            category: selectedCategory || undefined,
            tab: currentTab !== 'all' ? currentTab : undefined,
            sort: currentSort !== 'newest' ? currentSort : undefined,
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

    const handleTabChange = (tabId: string) => {
        setCurrentTab(tabId);
        applyFilters({ tab: tabId !== 'all' ? tabId : undefined });
    };

    const handleCategoryClick = (catVal: string) => {
        const next = selectedCategory === catVal ? '' : catVal;
        setSelectedCategory(next);
        applyFilters({ category: next || undefined });
    };

    const clearAllFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setCurrentTab('all');
        setCurrentSort('newest');
        router.get('/resident/incidents', {}, { preserveState: true });
    };

    const incidentList = incidents?.data || [];
    const hasActiveFilters = Boolean(search || selectedCategory || (currentTab && currentTab !== 'all') || (currentSort && currentSort !== 'newest'));

    return (
        <ResidentLayout>
            <Head title="Incidents & Maintenance - Kontrol" />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                                Incidents
                            </h1>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {incidents?.total || 0}
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                            Report issues and stay informed about estate maintenance & safety.
                        </p>
                    </div>

                    {allowResidentReporting && (
                        <Link
                            href="/resident/incidents/create"
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Report Incident</span>
                        </Link>
                    )}
                </div>

                {/* Offline Queue Notice */}
                {pendingIncidents.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                                <RefreshCw className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" />
                                <div>
                                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                        {pendingIncidents.length} offline report(s) queued for sync
                                    </p>
                                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                                        Will sync automatically once your connection restores.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter and Tab Navigation Controls */}
                <div className="space-y-3">
                    {/* Top Row: Search & Status Tabs */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Status Tabs */}
                        <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
                            {[
                                { id: 'all', label: 'All' },
                                { id: 'open', label: 'Active' },
                                { id: 'solved', label: 'Resolved' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                        currentTab === tab.id
                                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100'
                                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search incidents..."
                                className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilters({ search: undefined });
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Category Filter Pills (Horizontal Scroll) */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                        <button
                            type="button"
                            onClick={() => handleCategoryClick('')}
                            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                !selectedCategory
                                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                            }`}
                        >
                            All Categories
                        </button>
                        {categories.map((cat) => {
                            const isSelected = selectedCategory === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => handleCategoryClick(cat.value)}
                                    className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                                        isSelected
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                                    }`}
                                >
                                    <IncidentCategoryLabel
                                        category={cat.value}
                                        size="xs"
                                        className={isSelected ? '!text-white' : ''}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Active Filter Clear Pill */}
                {hasActiveFilters && (
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
                        <span>Filtered view active</span>
                        <button
                            type="button"
                            onClick={clearAllFilters}
                            className="font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                            Reset filters
                        </button>
                    </div>
                )}

                {/* Incident Feed Cards */}
                {incidentList.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={ShieldAlert}
                            title={hasActiveFilters ? 'No Matching Incidents' : 'No Incidents Reported'}
                            description={
                                hasActiveFilters
                                    ? 'Try changing or clearing your search and filters.'
                                    : 'Your estate feed is currently quiet with no open maintenance or safety reports.'
                            }
                            action={
                                allowResidentReporting && !hasActiveFilters
                                    ? {
                                          label: 'Report an Incident',
                                          href: '/resident/incidents/create',
                                      }
                                    : undefined
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {incidentList.map((incident) => (
                            <IncidentCard
                                key={incident.id}
                                incident={incident}
                                variant="resident"
                                href={`/resident/incidents/${incident.hashid}`}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {incidents.links && incidents.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1.5 pt-4">
                        {incidents.links.map((link, i) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={i}
                                        className="rounded-xl px-3 py-2 text-xs font-bold text-slate-400 opacity-50 dark:text-slate-600"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${
                                        link.active
                                            ? 'bg-indigo-600 text-white shadow-xs'
                                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </ResidentLayout>
    );
}
