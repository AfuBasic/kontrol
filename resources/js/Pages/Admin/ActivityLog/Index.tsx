import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import ActivityDateGroup from '@/Components/Admin/Activity/ActivityDateGroup';
import ActivityModuleFilter from '@/Components/Admin/Activity/ActivityModuleFilter';
import ActivitySkeletons from '@/Components/Admin/Activity/ActivitySkeletons';
import activityLog from '@/routes/admin/activity-log';
import type { ActivityItem, ActivityLogIndexProps } from '@/types/activity';

export default function ActivityLogIndex({
    activities: initialActivities,
    filters,
    meta,
}: ActivityLogIndexProps) {
    const [activities, setActivities] = useState<ActivityItem[]>(initialActivities.data || []);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(initialActivities.next_page_url);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [currentModule, setCurrentModule] = useState(filters.module || 'all');
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync state when props change due to filtering
    useEffect(() => {
        setActivities(initialActivities.data || []);
        setNextPageUrl(initialActivities.next_page_url);
    }, [initialActivities]);

    // Handle debounced search navigation
    const triggerSearch = useCallback((newSearch: string, newModule: string) => {
        router.get(
            activityLog.index.url(),
            {
                search: newSearch.trim() || undefined,
                module: newModule !== 'all' ? newModule : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            triggerSearch(val, currentModule);
        }, 350);
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        triggerSearch('', currentModule);
    };

    const handleSelectModule = (mod: string) => {
        setCurrentModule(mod);
        triggerSearch(searchQuery, mod);
    };

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextPageUrl && !loadingMore) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [nextPageUrl, loadingMore]);

    const loadMore = () => {
        if (!nextPageUrl || loadingMore) return;
        setLoadingMore(true);

        router.visit(nextPageUrl, {
            preserveState: true,
            preserveScroll: true,
            only: ['activities'],
            onSuccess: (page) => {
                const response = (page.props as unknown as ActivityLogIndexProps).activities;
                const newItems = response.data || [];
                setActivities((prev) => [...prev, ...newItems]);
                setNextPageUrl(response.next_page_url);
                setLoadingMore(false);
            },
            onError: () => {
                setLoadingMore(false);
            },
        });
    };

    // Group activities by calendar date
    const grouped = useMemo(() => {
        return activities.reduce(
            (acc, act) => {
                try {
                    const dateStr = format(parseISO(act.timestamp), 'yyyy-MM-dd');
                    if (!acc[dateStr]) {
                        acc[dateStr] = [];
                    }
                    acc[dateStr].push(act);
                } catch {
                    const fallback = 'Recent';
                    if (!acc[fallback]) {
                        acc[fallback] = [];
                    }
                    acc[fallback].push(act);
                }
                return acc;
            },
            {} as Record<string, ActivityItem[]>,
        );
    }, [activities]);

    return (
        <>
            <Head title="Estate Activity" />

            <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Page Title & Context */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                    <div>
                        <h1 className="font-bold text-2xl text-slate-900 tracking-tight sm:text-3xl dark:text-slate-100">
                            Estate Activity
                        </h1>
                        <p className="mt-1 text-slate-500 text-sm dark:text-slate-400">
                            See the important actions and operational changes happening across your estate.
                        </p>
                    </div>

                    {meta && (
                        <div className="mt-2 flex items-center gap-3 text-xs text-slate-500 sm:mt-0 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                {meta.today_count} actions today
                            </span>
                            <span>•</span>
                            <span>Last: {meta.last_activity_at}</span>
                        </div>
                    )}
                </div>

                {/* Search & Module Filters */}
                <div className="sticky top-0 z-20 mt-6 space-y-3 bg-slate-50/95 py-3 backdrop-blur-md dark:bg-slate-950/95">
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by action, resident, security or admin name..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-10 pl-10 text-slate-900 text-sm placeholder:text-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-100 dark:focus:ring-slate-100"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <ActivityModuleFilter
                        currentModule={currentModule}
                        onSelectModule={handleSelectModule}
                    />
                </div>

                {/* Activity Feed Body */}
                <div className="mt-6 space-y-8">
                    {activities.length > 0 ? (
                        <>
                            {Object.entries(grouped).map(([date, items]) => (
                                <ActivityDateGroup key={date} date={date} items={items} />
                            ))}

                            {/* Infinite scroll loader trigger */}
                            <div ref={loadMoreRef} className="py-6 text-center">
                                {loadingMore && <ActivitySkeletons count={2} />}

                                {!nextPageUrl && !loadingMore && (
                                    <div className="flex flex-col items-center gap-2 py-8 text-slate-400 text-xs dark:text-slate-500">
                                        <div className="h-px w-24 bg-slate-200 dark:bg-slate-800" />
                                        <span>Beginning of recorded activity</span>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 border-dashed bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                                <MagnifyingGlassIcon className="h-6 w-6" />
                            </div>
                            <h3 className="mt-4 font-semibold text-base text-slate-900 dark:text-slate-100">
                                No activity found
                            </h3>
                            <p className="mt-1 max-w-sm text-slate-500 text-sm dark:text-slate-400">
                                {searchQuery || currentModule !== 'all'
                                    ? 'Try changing your search keywords or switching module filters.'
                                    : 'Operational actions and changes will appear here as your estate operates.'}
                            </p>
                            {(searchQuery || currentModule !== 'all') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery('');
                                        setCurrentModule('all');
                                        triggerSearch('', 'all');
                                    }}
                                    className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 text-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                >
                                    Reset filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
