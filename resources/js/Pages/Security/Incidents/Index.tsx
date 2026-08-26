import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Activity, Check, Plus, Search, ShieldAlert, SlidersHorizontal, X } from 'lucide-react';
import MobileSheet from '@/Components/MobileSheet';
import EmptyState from '@/Components/States/EmptyState';
import IncidentCard from '@/Components/Incidents/IncidentCard';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
import type { Incident, IncidentPriority, PaginatedData } from '@/types';

const PRIORITY_OPTIONS: Array<{
    value: IncidentPriority;
    label: string;
    tone: string;
    activeTone: string;
}> = [
    {
        value: 'critical',
        label: 'Critical',
        tone: 'border-rose-200 bg-rose-50 text-rose-700',
        activeTone: 'border-rose-500 bg-rose-600 text-white',
    },
    {
        value: 'high',
        label: 'High',
        tone: 'border-orange-200 bg-orange-50 text-orange-700',
        activeTone: 'border-orange-500 bg-orange-600 text-white',
    },
    {
        value: 'medium',
        label: 'Medium',
        tone: 'border-slate-200 bg-slate-50 text-slate-700',
        activeTone: 'border-slate-700 bg-slate-900 text-white',
    },
    {
        value: 'low',
        label: 'Low',
        tone: 'border-slate-200 bg-white text-slate-500',
        activeTone: 'border-slate-600 bg-slate-700 text-white',
    },
];

interface Props {
    incidents: PaginatedData<Incident>;
    filters: {
        category?: string;
        status?: string;
        tab?: string;
        search?: string;
        sort?: string;
        priority?: IncidentPriority;
    };
    categories: Array<{ value: string; label: string }>;
}

export default function Index({ incidents, filters, categories }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [selectedPriority, setSelectedPriority] = useState<IncidentPriority | ''>(filters?.priority || '');
    const [draftCategory, setDraftCategory] = useState(filters?.category || '');
    const [draftPriority, setDraftPriority] = useState<IncidentPriority | ''>(filters?.priority || '');
    const [currentTab, setCurrentTab] = useState(filters?.tab || 'all');
    const [currentSort, setCurrentSort] = useState(filters?.sort || 'newest');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

    const applyFilters = (newParams: Record<string, string | undefined>) => {
        const params: Record<string, string | undefined> = {
            search: search || undefined,
            category: selectedCategory || undefined,
            priority: selectedPriority || undefined,
            tab: currentTab !== 'all' ? currentTab : undefined,
            sort: currentSort !== 'newest' ? currentSort : undefined,
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

    const handleTabChange = (tabId: string) => {
        setCurrentTab(tabId);
        applyFilters({ tab: tabId !== 'all' ? tabId : undefined });
    };

    const openFilterSheet = () => {
        setDraftCategory(selectedCategory);
        setDraftPriority(selectedPriority);
        setIsFilterSheetOpen(true);
    };

    const applySheetFilters = () => {
        setSelectedCategory(draftCategory);
        setSelectedPriority(draftPriority);
        applyFilters({
            category: draftCategory || undefined,
            priority: draftPriority || undefined,
        });
        setIsFilterSheetOpen(false);
    };

    const clearSheetFilters = () => {
        setSelectedCategory('');
        setSelectedPriority('');
        setDraftCategory('');
        setDraftPriority('');
        applyFilters({
            category: undefined,
            priority: undefined,
        });
        setIsFilterSheetOpen(false);
    };

    const clearAllFilters = () => {
        setSearch('');
        setSelectedCategory('');
        setSelectedPriority('');
        setDraftCategory('');
        setDraftPriority('');
        setCurrentTab('all');
        setCurrentSort('newest');
        router.get('/security/incidents', {}, { preserveState: true, preserveScroll: true });
    };

    const incidentList = incidents?.data || [];
    const hasActiveFilters = Boolean(
        search || selectedCategory || selectedPriority || (currentTab && currentTab !== 'all') || (currentSort && currentSort !== 'newest'),
    );
    const hasVisibleFilterChips = Boolean(search || selectedCategory || selectedPriority || (currentSort && currentSort !== 'newest'));
    const sheetFilterCount = [selectedCategory, selectedPriority].filter(Boolean).length;
    const activeCasesOnPage = incidentList.filter((incident) => !['solved', 'closed'].includes(incident.status)).length;
    const selectedCategoryLabel = categories.find((category) => category.value === selectedCategory)?.label || selectedCategory;
    const selectedPriorityLabel = PRIORITY_OPTIONS.find((priority) => priority.value === selectedPriority)?.label || selectedPriority;

    return (
        <>
            <Head title="Security Incident Dispatch - Kontrol" />

            <div className="space-y-5 py-3 pb-4 sm:py-6">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] text-primary-600 uppercase">
                                <Activity className="h-3.5 w-3.5" />
                                Incidents
                            </span>
                            <h1 className="mt-2 text-2xl leading-tight font-black tracking-tight text-slate-950">Incident Dispatch</h1>
                            <p className="mt-2 max-w-md text-sm leading-relaxed font-medium text-slate-500">
                                Monitor and respond to estate incidents across the active work queue.
                            </p>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-emerald-50 px-3 py-2 text-center ring-1 ring-emerald-100">
                            <span className="block text-lg leading-none font-black text-emerald-700">{activeCasesOnPage}</span>
                            <span className="mt-1 block text-[9px] font-black tracking-wider text-emerald-600 uppercase">Visible Active</span>
                        </div>
                    </div>

                    <Link
                        href="/security/incidents/create"
                        className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition-all hover:bg-slate-800 active:scale-[0.98]"
                    >
                        <Plus className="h-5 w-5" strokeWidth={2.5} />
                        <span>Log incident</span>
                    </Link>
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-xs">
                        {[
                            { id: 'all', label: 'All' },
                            { id: 'open', label: 'Active' },
                            { id: 'solved', label: 'Resolved' },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleTabChange(tab.id)}
                                className={`min-h-[40px] rounded-xl px-3 text-xs font-black transition-all ${
                                    currentTab === tab.id
                                        ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        <form onSubmit={handleSearchSubmit} className="relative flex-1" noValidate>
                            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title, reporter, location..."
                                className="min-h-[48px] w-full rounded-2xl border border-slate-200 bg-white py-2 pr-9 pl-10 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 focus:outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilters({ search: undefined });
                                    }}
                                    aria-label="Clear incident search"
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </form>

                        <button
                            type="button"
                            onClick={openFilterSheet}
                            className={`relative flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl border px-3.5 text-xs font-black shadow-xs transition-all ${
                                sheetFilterCount
                                    ? 'border-primary-200 bg-primary-50 text-primary-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                            }`}
                            aria-label={sheetFilterCount ? `${sheetFilterCount} incident filters active` : 'Open incident filters'}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span>Filter</span>
                            {sheetFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-black text-white">
                                    {sheetFilterCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {hasVisibleFilterChips && (
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 shadow-xs">
                        {selectedCategory && (
                            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-2.5 py-1 font-bold text-primary-700">
                                <IncidentCategoryLabel
                                    category={{ value: selectedCategory, label: selectedCategoryLabel }}
                                    size="xs"
                                    forceLight
                                    className="min-w-0 [&>span]:max-w-[11rem] [&>span]:truncate"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory('');
                                        applyFilters({ category: undefined });
                                    }}
                                    aria-label={`Remove ${selectedCategoryLabel} filter`}
                                    className="text-primary-500 hover:text-primary-800"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        )}

                        {selectedPriority && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold text-slate-700">
                                {selectedPriorityLabel} priority
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPriority('');
                                        applyFilters({ priority: undefined });
                                    }}
                                    aria-label={`Remove ${selectedPriorityLabel} priority filter`}
                                    className="text-slate-400 hover:text-slate-700"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        )}

                        {search && (
                            <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold text-slate-600">
                                <span className="min-w-0 truncate">Search: {search}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('');
                                        applyFilters({ search: undefined });
                                    }}
                                    aria-label="Clear search filter"
                                    className="text-slate-400 hover:text-slate-700"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        )}

                        {currentSort !== 'newest' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold text-slate-600">
                                Sort: {currentSort}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentSort('newest');
                                        applyFilters({ sort: undefined });
                                    }}
                                    aria-label="Clear sort filter"
                                    className="text-slate-400 hover:text-slate-700"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </span>
                        )}

                        <button type="button" onClick={clearAllFilters} className="ml-auto shrink-0 font-black text-primary-600">
                            Clear
                        </button>
                    </div>
                )}

                {/* Case Log List */}
                {incidentList.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={ShieldAlert}
                            title={hasActiveFilters ? 'No incidents match these filters' : 'No incidents reported'}
                            description={
                                hasActiveFilters
                                    ? 'Try changing or clearing your search criteria.'
                                    : 'New incident reports will appear here for security to review and respond to.'
                            }
                            forceLight
                            action={
                                hasActiveFilters ? (
                                    <button
                                        type="button"
                                        onClick={clearAllFilters}
                                        className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                                    >
                                        Clear filters
                                    </button>
                                ) : (
                                    <Link
                                        href="/security/incidents/create"
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                                    >
                                        Log an Incident
                                    </Link>
                                )
                            }
                        />
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {incidentList.map((incident) => (
                            <IncidentCard key={incident.id} incident={incident} variant="security" href={`/security/incidents/${incident.hashid}`} />
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
                                        className="rounded-xl px-3 py-2 text-xs font-bold text-slate-400 opacity-50"
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
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <MobileSheet isOpen={isFilterSheetOpen} onClose={() => setIsFilterSheetOpen(false)} title="Filter incidents">
                <div className="space-y-6 px-1 pb-2">
                    <section>
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black tracking-[0.18em] text-slate-500 uppercase">Category</p>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500">
                                {categories.length} configured
                            </span>
                        </div>

                        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                            <button
                                type="button"
                                onClick={() => setDraftCategory('')}
                                aria-pressed={!draftCategory}
                                className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black transition-all ${
                                    !draftCategory
                                        ? 'border-primary-200 bg-primary-50 text-primary-700'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span>All categories</span>
                                {!draftCategory && <Check className="h-4 w-4 shrink-0" />}
                            </button>

                            {categories.map((category) => {
                                const isSelected = draftCategory === category.value;

                                return (
                                    <button
                                        key={category.value}
                                        type="button"
                                        onClick={() => setDraftCategory(isSelected ? '' : category.value)}
                                        aria-pressed={isSelected}
                                        className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                                            isSelected
                                                ? 'border-primary-200 bg-primary-50 text-primary-700'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <IncidentCategoryLabel
                                            category={category}
                                            size="sm"
                                            forceLight
                                            className={`min-w-0 [&>span]:line-clamp-2 [&>span]:text-left ${isSelected ? '!text-primary-700' : ''}`}
                                        />
                                        {isSelected && <Check className="h-4 w-4 shrink-0 text-primary-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section>
                        <p className="text-xs font-black tracking-[0.18em] text-slate-500 uppercase">Priority</p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {PRIORITY_OPTIONS.map((priority) => {
                                const isSelected = draftPriority === priority.value;

                                return (
                                    <button
                                        key={priority.value}
                                        type="button"
                                        onClick={() => setDraftPriority(isSelected ? '' : priority.value)}
                                        aria-pressed={isSelected}
                                        className={`min-h-[46px] rounded-2xl border px-3 text-sm font-black transition-all ${
                                            isSelected ? priority.activeTone : priority.tone
                                        }`}
                                    >
                                        {priority.label}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 pt-4 pb-2 backdrop-blur">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={clearSheetFilters}
                                className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-600"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={applySheetFilters}
                                className="min-h-[48px] rounded-2xl bg-slate-950 px-4 text-sm font-black text-white shadow-lg shadow-slate-950/10"
                            >
                                Apply filters
                            </button>
                        </div>
                    </div>
                </div>
            </MobileSheet>
        </>
    );
}
