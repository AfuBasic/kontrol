import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Activity, Plus, Search, ShieldAlert, SlidersHorizontal, X } from 'lucide-react';
import EmptyState from '@/Components/States/EmptyState';
import IncidentCard from '@/Components/Incidents/IncidentCard';
import IncidentCategoryLabel from '@/Components/Incidents/IncidentCategoryLabel';
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
}

export default function Index({ incidents, filters, categories }: Props) {
    const [search, setSearch] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [currentTab, setCurrentTab] = useState(filters?.tab || 'all');
    const [currentSort, setCurrentSort] = useState(filters?.sort || 'newest');

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
        router.get('/security/incidents', {}, { preserveState: true });
    };

    const incidentList = incidents?.data || [];
    const hasActiveFilters = Boolean(search || selectedCategory || (currentTab && currentTab !== 'all') || (currentSort && currentSort !== 'newest'));
    const activeFilterCount = [search, selectedCategory, currentTab !== 'all', currentSort !== 'newest'].filter(Boolean).length;
    const totalCases = incidents?.total ?? incidentList.length;
    const activeCasesOnPage = incidentList.filter((incident) => !['solved', 'closed'].includes(incident.status)).length;
    const selectedCategoryLabel = categories.find((category) => category.value === selectedCategory)?.label || selectedCategory;

    return (
        <>
            <Head title="Security Incident Log - Kontrol" />

            <div className="space-y-5 py-3 pb-4 sm:py-6">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/70">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.18em] text-primary-600 uppercase">
                                <Activity className="h-3.5 w-3.5" />
                                Dispatch Desk
                            </span>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl leading-tight font-black tracking-tight text-slate-950">Incident Log</h1>
                                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-950 px-2 text-xs font-black text-white">
                                    {totalCases}
                                </span>
                            </div>
                            <p className="mt-2 max-w-md text-sm leading-relaxed font-medium text-slate-500">
                                Track reports, check urgency, and post official dispatch updates.
                            </p>
                        </div>

                        <div className="shrink-0 rounded-2xl bg-emerald-50 px-3 py-2 text-center ring-1 ring-emerald-100">
                            <span className="block text-lg leading-none font-black text-emerald-700">{activeCasesOnPage}</span>
                            <span className="mt-1 block text-[9px] font-black tracking-wider text-emerald-600 uppercase">Active</span>
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
                            { id: 'all', label: 'All Cases' },
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
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </form>

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={clearAllFilters}
                                className="relative flex min-h-[48px] min-w-12 items-center justify-center rounded-2xl border border-primary-200 bg-primary-50 text-primary-700 shadow-xs"
                                aria-label="Clear active filters"
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-[10px] font-black text-white">
                                    {activeFilterCount}
                                </span>
                            </button>
                        )}
                    </div>

                    <div className="-mx-4 overflow-x-auto px-4 pb-1">
                        <div className="flex min-w-max items-center gap-2">
                            <button
                                type="button"
                                onClick={() => handleCategoryClick('')}
                                className={`min-h-[38px] shrink-0 rounded-2xl px-4 text-xs font-black transition-all ${
                                    !selectedCategory
                                        ? 'bg-slate-950 text-white shadow-sm shadow-slate-950/10'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
                                        className={`min-h-[38px] shrink-0 rounded-2xl border px-3.5 text-xs font-black transition-all ${
                                            isSelected
                                                ? 'border-primary-600 bg-primary-600 text-white shadow-sm shadow-primary-600/20'
                                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <IncidentCategoryLabel
                                            category={cat.value}
                                            size="xs"
                                            forceLight
                                            className={isSelected ? '!text-white' : ''}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-600 shadow-xs">
                        <span className="min-w-0 truncate">Showing filtered cases{selectedCategoryLabel ? ` in ${selectedCategoryLabel}` : ''}</span>
                        <button type="button" onClick={clearAllFilters} className="shrink-0 font-black text-primary-600">
                            Reset filters
                        </button>
                    </div>
                )}

                {/* Case Log List */}
                {incidentList.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={ShieldAlert}
                            title={hasActiveFilters ? 'No Matching Cases' : 'No Incident Logs'}
                            description={
                                hasActiveFilters ? 'Try changing or clearing your search criteria.' : 'No security incidents have been logged yet.'
                            }
                            forceLight
                            action={
                                !hasActiveFilters ? (
                                    <Link
                                        href="/security/incidents/create"
                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                                    >
                                        Log an Incident
                                    </Link>
                                ) : undefined
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
        </>
    );
}
