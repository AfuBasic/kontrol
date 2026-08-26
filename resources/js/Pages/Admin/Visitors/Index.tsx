import React, { useCallback, useEffect, useState } from 'react';
import { Head, Link, router, WhenVisible } from '@inertiajs/react';
import { Calendar, Download, LayoutList, Lock, Table2 } from 'lucide-react';

import { index, calendar } from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import ActivityFiltersBar from '@/Components/Admin/Visitors/ActivityFiltersBar';
import ActivityTimeline from '@/Components/Admin/Visitors/ActivityTimeline';
import OnPropertyNow from '@/Components/Admin/Visitors/OnPropertyNow';
import RecordDetail from '@/Components/Admin/Visitors/RecordDetail';
import VisitorTable from '@/Components/Admin/Visitors/VisitorTable';
import type { ActivityView, SortDirection, SortField, VisitorFilters, VisitorRecord } from '@/Components/Admin/Visitors/types';
import { OfflineState } from '@/Components/States';
import { useDebounce } from '@/Hooks/useDebounce';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';

type Props = {
    logs: {
        data: VisitorRecord[];
        links: unknown[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        next_page_url: string | null;
    };
    filters: VisitorFilters;
    hosts?: Array<{ id: number; name: string }> | null;
    securityOfficers?: Array<{ id: number; name: string }> | null;
    checkoutEnabled: boolean;
    currentlyInsideList?: VisitorRecord[] | null;
    expectedTodayCount?: number;
};

export default function VisitorIndex({ logs, filters, hosts, checkoutEnabled = false, currentlyInsideList = [], expectedTodayCount = 0 }: Props) {
    const hostOptions = hosts ?? [];
    const onProperty = currentlyInsideList ?? [];
    const activeView: ActivityView = filters.view === 'table' ? 'table' : 'activity';

    const { isOnline, quality } = useNetworkQuality();
    const offline = !isOnline || quality === 'offline';

    const [selectedRecord, setSelectedRecord] = useState<VisitorRecord | null>(null);
    const [searchDraft, setSearchDraft] = useState(filters.search ?? '');
    const debouncedSearch = useDebounce(searchDraft, 300);

    const applyFilters = useCallback(
        (next: Record<string, string | number | undefined>) => {
            const merged: Record<string, string | number | undefined> = { ...filters, ...next };
            Object.keys(merged).forEach((key) => {
                if (merged[key] === '' || merged[key] === undefined || merged[key] === null) {
                    delete merged[key];
                }
            });
            // Defaults stay out of the query string.
            if (merged.sort === 'verified_at') {
                delete merged.sort;
            }
            if (merged.direction === 'desc' && (!merged.sort || merged.sort === 'verified_at')) {
                delete merged.direction;
            }
            if (merged.view === 'activity') {
                delete merged.view;
            }
            router.get(index.url(), merged, { preserveState: true, replace: true });
        },
        [filters],
    );

    useEffect(() => {
        if ((filters.search ?? '') === (debouncedSearch ?? '')) {
            return;
        }
        applyFilters({ search: debouncedSearch || undefined });
    }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = (next: Record<string, string | number | undefined>) => {
        if ('search' in next) {
            setSearchDraft(String(next.search ?? ''));
            return;
        }
        applyFilters(next);
    };

    const handleClearFilters = () => {
        setSearchDraft('');
        // Drop search/filter fields only - keep table/timeline view and sort.
        const kept: Record<string, string | number | undefined> = {};
        if (filters.sort && filters.sort !== 'verified_at') {
            kept.sort = filters.sort;
        }
        if (filters.direction && !(filters.direction === 'desc' && (!filters.sort || filters.sort === 'verified_at'))) {
            kept.direction = filters.direction;
        }
        if (filters.view && filters.view !== 'activity') {
            kept.view = filters.view;
        }
        router.get(index.url(), kept, { preserveState: true, replace: true });
    };

    const handleViewChange = (view: ActivityView) => {
        if (view === activeView) {
            return;
        }
        applyFilters({ view });
    };

    const handleSort = (field: SortField) => {
        const currentSort = (filters.sort ?? 'verified_at') as SortField;
        const currentDirection = (filters.direction ?? 'desc') as SortDirection;

        if (currentSort === field) {
            applyFilters({
                sort: field,
                direction: currentDirection === 'asc' ? 'desc' : 'asc',
            });
            return;
        }

        // New column: latest-first for times; A→Z for names/status.
        const defaultDirection: SortDirection = field === 'visitor' || field === 'host' || field === 'status' ? 'asc' : 'desc';

        applyFilters({ sort: field, direction: defaultDirection });
    };

    const handleExportCSV = () => {
        const headers = ['Visitor', 'Phone', 'Host', 'Purpose', 'Issued', 'Verified', 'Verifier', 'Checked Out', 'Duration (min)', 'Gate', 'Vehicle'];
        const rows = logs.data.map((log) => [
            log.visitor.name,
            log.visitor.phone ?? '',
            log.host.name,
            log.purpose ?? '',
            log.issued_at ?? '',
            log.verified_at,
            log.verifier_name,
            log.checked_out_at ?? '',
            log.duration_minutes ?? '',
            log.gate,
            log.vehicle ? `${log.vehicle.make} ${log.vehicle.model} (${log.vehicle.plate})` : '',
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `visitors-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const toolbarFilters: VisitorFilters = {
        ...filters,
        search: searchDraft,
    };

    const infiniteParams = {
        page: logs.current_page + 1,
        ...filters,
        ...(searchDraft ? { search: searchDraft } : {}),
    };

    return (
        <>
            <Head title="Visitors" />

            <div className="w-full space-y-6 pb-20">
                {offline && <OfflineState title="Connection interrupted" message="Live updates will resume automatically when internet returns." />}

                <header className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-[2rem]">Visitors</h1>
                        <p className="mt-1 text-sm font-medium text-gray-500">Who is on the property, and what happened at the gate.</p>
                        <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
                            <Lock className="h-3 w-3 shrink-0" aria-hidden />
                            <span>Immutable record · verified at the gate</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                            href={calendar.url()}
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
                        >
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            Calendar
                        </Link>

                        <button
                            type="button"
                            onClick={handleExportCSV}
                            className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
                        >
                            <Download className="h-3.5 w-3.5 text-gray-400" />
                            Export CSV
                        </button>
                    </div>
                </header>

                <OnPropertyNow
                    visitors={onProperty}
                    checkoutEnabled={checkoutEnabled}
                    expectedTodayCount={expectedTodayCount}
                    onSelect={setSelectedRecord}
                />

                {/* Activity journal - tools + feed as one surface */}
                <section aria-labelledby="activity-heading" className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-gray-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                        <div className="min-w-0">
                            <h2 id="activity-heading" className="text-sm font-semibold tracking-tight text-gray-900">
                                Activity
                            </h2>
                            <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                {activeView === 'activity'
                                    ? 'Operational journal · expand any event for the full audit trail'
                                    : 'Ledger table · filter, sort, and scroll'}
                            </p>
                        </div>

                        <div
                            className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5"
                            role="tablist"
                            aria-label="Activity view"
                        >
                            <TabButton
                                active={activeView === 'activity'}
                                onClick={() => handleViewChange('activity')}
                                icon={LayoutList}
                                label="Timeline"
                            />
                            <TabButton
                                active={activeView === 'table'}
                                onClick={() => handleViewChange('table')}
                                icon={Table2}
                                label={
                                    <>
                                        <span className="sm:hidden">Cards</span>
                                        <span className="hidden sm:inline">Table</span>
                                    </>
                                }
                            />
                        </div>
                    </div>

                    <div className="border-b border-gray-100 bg-gray-50/50 px-3 py-2.5 sm:px-4">
                        <ActivityFiltersBar
                            filters={toolbarFilters}
                            hosts={hostOptions}
                            checkoutEnabled={checkoutEnabled}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                        />
                    </div>

                    <div className="px-3 py-3 sm:px-4 sm:py-4">
                        {activeView === 'activity' ? (
                            <ActivityTimeline
                                logs={logs.data}
                                filters={toolbarFilters}
                                checkoutEnabled={checkoutEnabled}
                                onSelect={setSelectedRecord}
                            />
                        ) : (
                            <VisitorTable
                                logs={logs.data}
                                filters={toolbarFilters}
                                checkoutEnabled={checkoutEnabled}
                                onSort={handleSort}
                                onSelect={setSelectedRecord}
                            />
                        )}

                        {logs.next_page_url && (
                            <WhenVisible
                                always
                                fallback={
                                    <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-gray-500">
                                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                                        <span>{activeView === 'table' ? 'Loading more…' : 'Loading more…'}</span>
                                    </div>
                                }
                                params={{
                                    data: infiniteParams,
                                    only: ['logs'],
                                    preserveUrl: true,
                                }}
                            >
                                <div className="flex items-center justify-center gap-2 py-3 text-xs font-semibold text-gray-500">
                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                                    <span>Loading more…</span>
                                </div>
                            </WhenVisible>
                        )}
                    </div>
                </section>
            </div>

            <RecordDetail record={selectedRecord} checkoutEnabled={checkoutEnabled} onClose={() => setSelectedRecord(null)} />
        </>
    );
}

function TabButton({
    active,
    onClick,
    icon: Icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ComponentType<{ className?: string }>;
    label: React.ReactNode;
}) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ease-out active:scale-[0.97] ${
                active ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
            }`}
        >
            <Icon className="h-3.5 w-3.5" />
            {label}
        </button>
    );
}
