import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    Plus,
    Search,
    ShieldAlert,
    X,
} from 'lucide-react';
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
    const hasActiveFilters = Boolean(
        search ||
            selectedCategory ||
            (currentTab && currentTab !== 'all') ||
            (currentSort && currentSort !== 'newest')
    );

    return (
        <>
            <Head title="Security Incident Log - Kontrol" />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                                Incident Dispatch Log
                            </h1>
                            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-black text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {incidents.total || 0}
                            </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                            Monitor reported estate incidents and post official security dispatch updates.
                        </p>
                    </div>

                    <Link
                        href="/security/incidents/create"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Log Incident</span>
                    </Link>
                </div>

                {/* Filter and Tab Navigation Controls */}
                <div className="space-y-3">
                    {/* Status Tabs and Search */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
                            {[
                                { id: 'all', label: 'All Cases' },
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
                                placeholder="Search log by title, location..."
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

                    {/* Category Filter Pills */}
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

                {/* Filter Active Pill */}
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

                {/* Case Log List */}
                {incidentList.length === 0 ? (
                    <div className="py-12">
                        <EmptyState
                            icon={ShieldAlert}
                            title={hasActiveFilters ? 'No Matching Cases' : 'No Incident Logs'}
                            description={
                                hasActiveFilters
                                    ? 'Try changing or clearing your search criteria.'
                                    : 'No security incidents have been logged yet.'
                            }
                            action={
                                !hasActiveFilters
                                    ? {
                                          label: 'Log an Incident',
                                          href: '/security/incidents/create',
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
                                variant="security"
                                href={`/security/incidents/${incident.hashid}`}
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
        </>
    );
}
