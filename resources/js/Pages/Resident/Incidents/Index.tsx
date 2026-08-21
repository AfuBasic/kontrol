import React, { useCallback, useEffect, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Filter,
    Plus,
    RefreshCw,
    Search,
    Shield,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import MobileSheet from '@/Components/MobileSheet';
import IncidentCard from '@/Components/Incidents/IncidentCard';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import { useSyncStatus } from '@/Hooks/useSyncStatus';
import { type PendingIncident, ResidentStore } from '@/Resilience/OfflineStorage/ResidentStore';
import { SyncStatus } from '@/Resilience/SyncStatus';
import type { Incident, PaginatedData } from '@/types';

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
    totalIncidentsCount?: number;
}

export default function Index({
    incidents = { data: [], links: [], total: 0 } as unknown as PaginatedData<Incident>,
    filters: rawFilters = {},
    categories = [],
    allowResidentReporting = true,
    totalIncidentsCount,
}: Props) {
    // PHP's request()->only() returns [] (array) when no keys match, which JSON-encodes
    // to a JS array. Guard against this so filters.sort doesn't resolve to Array.prototype.sort.
    const filters = Array.isArray(rawFilters) ? {} : (rawFilters ?? {});

    const { operations = [] } = useSyncStatus();

    const [search, setSearch] = useState(typeof filters.search === 'string' ? filters.search : '');
    const [selectedCategory, setSelectedCategory] = useState(typeof filters.category === 'string' ? filters.category : '');
    const [currentTab, setCurrentTab] = useState(typeof filters.tab === 'string' ? filters.tab : 'all');
    const [currentSort, setCurrentSort] = useState((typeof filters.sort === 'string' ? filters.sort : '') || 'newest');
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
        setIsFilterSheetOpen(false);
        router.get('/resident/incidents', {}, { preserveState: true });
    };

    const incidentList = incidents?.data || [];
    const hasActiveFilters = Boolean(
        search ||
        selectedCategory ||
        (currentTab && currentTab !== 'all') ||
        (currentSort && currentSort !== 'newest')
    );

    // Count how many non-default filter dimensions are active
    const activeFilterCount = [
        Boolean(search),
        Boolean(selectedCategory),
        Boolean(currentTab && currentTab !== 'all'),
        Boolean(currentSort && currentSort !== 'newest'),
    ].filter(Boolean).length;

    // Total incidents in estate (unfiltered). If totalIncidentsCount is provided from backend, use it.
    // Otherwise fallback to incidents.total if no filters are active, or default to checking list.
    const estateTotalCount = typeof totalIncidentsCount === 'number'
        ? totalIncidentsCount
        : (!hasActiveFilters ? (incidents?.total ?? 0) : null);

    // STATE A: True Zero State (Estate genuinely has zero incident records)
    const isTrueZeroState = estateTotalCount === 0 || (estateTotalCount === null && incidentList.length === 0 && !hasActiveFilters);

    // STATE B: Filtered Zero State (Estate has incidents, but current search/filter returns zero)
    const isFilteredZeroState = !isTrueZeroState && incidentList.length === 0;

    // Filter Sheet Content
    const filterSheetContent = (
        <div className="space-y-6 pt-2">
            {/* Status Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                    Status Group
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'open', label: 'Active' },
                        { id: 'solved', label: 'Resolved' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setCurrentTab(item.id)}
                            className={`min-h-[44px] rounded-2xl px-3 py-2 text-xs font-bold border transition-all ${
                                currentTab === item.id
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
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
                    Category Filters
                </label>
                <div className="mt-2 grid max-h-48 grid-cols-1 gap-2 overflow-y-auto pr-1">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('')}
                        className={`min-h-[44px] rounded-2xl px-4 py-2 text-left text-xs font-bold border transition-all ${
                            !selectedCategory
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                    >
                        All Categories
                    </button>
                    {categories.map((c) => (
                        <button
                            key={c.value}
                            type="button"
                            onClick={() => setSelectedCategory(c.value)}
                            className={`min-h-[44px] truncate rounded-2xl px-4 py-2 text-left text-xs font-bold border transition-all ${
                                selectedCategory === c.value
                                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                            }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Sort Options */}
            <div>
                <label className="ml-1 text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">
                    Sort By
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentSort('newest')}
                        className={`min-h-[44px] rounded-2xl px-4 py-2 text-xs font-bold border transition-all ${
                            currentSort === 'newest'
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                    >
                        Newest First
                    </button>
                    <button
                        type="button"
                        onClick={() => setCurrentSort('popular')}
                        className={`min-h-[44px] rounded-2xl px-4 py-2 text-xs font-bold border transition-all ${
                            currentSort === 'popular'
                                ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                        }`}
                    >
                        Most Upvoted
                    </button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                <button
                    type="button"
                    onClick={clearAllFilters}
                    className="min-h-[44px] flex-1 rounded-2xl bg-slate-100 py-2.5 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300"
                >
                    Reset All
                </button>
                <button
                    type="button"
                    onClick={() => {
                        applyFilters({
                            category: selectedCategory || undefined,
                            tab: currentTab !== 'all' ? currentTab : undefined,
                            sort: currentSort !== 'newest' ? currentSort : undefined,
                        });
                        setIsFilterSheetOpen(false);
                    }}
                    className="min-h-[44px] flex-[2] rounded-2xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-700 active:scale-95"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Incidents & Maintenance - Kontrol" />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
                {/* 1. RESTORED INCIDENT BOARD HERO (Dark Navy Surface + Purple CTA) */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white shadow-xl shadow-slate-900/10 dark:shadow-black/40">
                    {/* Ambient Glow Accents */}
                    <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl" />

                    <div className="relative z-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-purple-400 uppercase">
                                Community Issue Tracker
                            </span>
                            <div className="mt-1 flex items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                    Incident Board
                                </h1>
                                {typeof estateTotalCount === 'number' && estateTotalCount > 0 && (
                                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-black text-slate-300 ring-1 ring-slate-700">
                                        {estateTotalCount}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-300">
                                Collaborative issue logging, maintenance progress tracking, and resolution updates across your estate.
                            </p>
                        </div>

                        {allowResidentReporting ? (
                            <div className="shrink-0">
                                <Link
                                    href="/resident/incidents/create"
                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-600/40 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" strokeWidth={3} />
                                    <span>Report Incident</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="shrink-0">
                                <span className="inline-flex items-center rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-bold text-slate-400 ring-1 ring-slate-700/60">
                                    Reporting Disabled by Estate Policy
                                </span>
                            </div>
                        )}
                    </div>
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

                {/* 2. STATE A: TRUE ZERO STATE (Estate has 0 incidents in total) */}
                {isTrueZeroState ? (
                    <div className="rounded-3xl border border-slate-100 bg-white p-8 sm:p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                            <Shield className="h-8 w-8" strokeWidth={1.75} />
                        </div>
                        <h2 className="mt-4 text-lg font-black text-slate-900 dark:text-slate-100">
                            No incidents reported
                        </h2>
                        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            There are currently no incidents or maintenance requests recorded for your estate. If something happens, you can report it here and follow its progress to resolution.
                        </p>
                    </div>
                ) : (
                    /* 3. STATES B & C: SEARCH, CONTROLS, AND FEED */
                    <div className="space-y-4">
                        {/* Search Bar + Filter Trigger & Status Tabs */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Search & Filter Sheet Button */}
                            <div className="flex flex-1 items-center gap-2">
                                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search keywords, locations..."
                                        className="min-h-[42px] w-full rounded-2xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                applyFilters({ search: undefined });
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                </form>

                                <button
                                    type="button"
                                    onClick={() => setIsFilterSheetOpen(true)}
                                    className={`relative flex min-h-[42px] items-center gap-2 rounded-2xl border px-3.5 text-xs font-bold transition-all active:scale-95 ${
                                        activeFilterCount > 0
                                            ? 'border-purple-500 bg-purple-50/50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800'
                                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                                    }`}
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    <span className="hidden sm:inline">Filters</span>
                                    {activeFilterCount > 0 && (
                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-black text-white">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </button>
                            </div>

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
                        </div>

                        {/* Category Filter Pills (Horizontal Scroll) */}
                        {categories.length > 0 && (
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
                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xs'
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
                        )}

                        {/* Active Filter Recovery Bar */}
                        {hasActiveFilters && (
                            <div className="flex items-center justify-between rounded-2xl bg-purple-50/60 px-4 py-2.5 text-xs text-purple-900 border border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/40 dark:text-purple-300">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                                    <span>Filtered view active ({incidents.total || 0} matching)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="font-bold text-purple-700 hover:underline dark:text-purple-300"
                                >
                                    Reset filters
                                </button>
                            </div>
                        )}

                        {/* STATE B: Filtered Zero State (No matches for current query) */}
                        {isFilteredZeroState ? (
                            <div className="rounded-3xl border border-slate-100 bg-white p-8 sm:p-12 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                                    <Search className="h-6 w-6" />
                                </div>
                                <h3 className="mt-4 text-base font-black text-slate-900 dark:text-slate-100">
                                    {search ? `No incidents match "${search}"` : 'No matching incidents'}
                                </h3>
                                <p className="mx-auto mt-1.5 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                                    We couldn't find any incidents matching your active filters. Try changing your criteria or clear all filters to see all incidents.
                                </p>
                                <div className="mt-5">
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-95 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                    >
                                        Clear all filters
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* STATE C: POPULATED STATE (Incident Feed Cards) */
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
                        {incidents.links && incidents.links.length > 3 && !isFilteredZeroState && (
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
                                                    ? 'bg-purple-600 text-white shadow-xs'
                                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Mobile Filter Sheet Modal */}
            <MobileSheet
                isOpen={isFilterSheetOpen}
                onClose={() => setIsFilterSheetOpen(false)}
                title="Filter Incidents"
            >
                {filterSheetContent}
            </MobileSheet>
        </>
    );
}
