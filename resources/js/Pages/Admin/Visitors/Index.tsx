import React, { useState, useEffect } from 'react';
import { Head, router, WhenVisible } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    AlertOctagon,
    Building2,
    Calendar,
    Car,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    LogIn,
    LogOut,
    Plus,
    QrCode,
    Search,
    Shield,
    X,
    XCircle,
} from 'lucide-react';

import { index, calendar } from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import SectionErrorBoundary from '@/Components/SectionErrorBoundary';
import { FeedItemSkeleton } from '@/Components/Skeletons';
import { OfflineState } from '@/Components/States';
import { useDebounce } from '@/Hooks/useDebounce';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import AdminLayout from '@/Layouts/AdminLayout';

import OperationalHeader from '@/Components/Admin/VisitorOps/OperationalHeader';
import OperationalSummary from '@/Components/Admin/VisitorOps/OperationalSummary';
import AttentionPanel, { AttentionItem } from '@/Components/Admin/VisitorOps/AttentionPanel';
import CurrentlyInsideWorkspace, { ActiveVisitor } from '@/Components/Admin/VisitorOps/CurrentlyInsideWorkspace';
import ExpectedArrivalsFeed, { ExpectedVisitor } from '@/Components/Admin/VisitorOps/ExpectedArrivalsFeed';
import LiveActivityFeed, { FeedItem } from '@/Components/Admin/VisitorOps/LiveActivityFeed';
import SearchAndArchive, { AuditLog } from '@/Components/Admin/VisitorOps/SearchAndArchive';

type Props = {
    logs: {
        data: AuditLog[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        next_page_url: string | null;
    };
    filters: {
        search?: string;
        date?: string;
        vehicle_plate?: string;
        host_id?: string | number;
        status?: string;
        gate?: string;
        verifier_id?: string | number;
    };
    hosts?: Array<{ id: number; name: string }> | null;
    securityOfficers?: Array<{ id: number; name: string }> | null;
    checkoutEnabled: boolean;
    currentlyInsideList?: ActiveVisitor[] | null;
    expectedArrivals?: ExpectedVisitor[] | null;
    attentionItems?: AttentionItem[] | null;
    metrics: {
        currentlyInside: number;
        visitorsToday: number;
        pendingCheckout: number;
        deniedEntries: number;
        avgDuration: number;
        expectedToday: number;
        totalChecked: number;
    };
    liveFeed?: FeedItem[] | null;
};

export default function VisitorIndex({
    logs,
    filters,
    hosts,
    securityOfficers,
    checkoutEnabled = false,
    currentlyInsideList = [],
    expectedArrivals = [],
    attentionItems = [],
    metrics,
    liveFeed = [],
}: Props) {
    const hostOptions = hosts ?? [];
    const officerOptions = securityOfficers ?? [];
    const feed = liveFeed ?? [];
    const activeVisitors = currentlyInsideList ?? [];
    const upcomingArrivals = expectedArrivals ?? [];
    const alerts = attentionItems ?? [];

    const { isOnline, quality } = useNetworkQuality();
    const offline = !isOnline || quality === 'offline';

    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const handleFilterChange = (newFilters: Record<string, any>) => {
        const merged = { ...filters, ...newFilters };
        router.get(index.url(), merged, { preserveState: true, replace: true });
    };

    const handleClearFilters = () => {
        router.get(index.url(), {}, { preserveState: true, replace: true });
    };

    // Client-side CSV export
    const handleExportCSV = () => {
        const headers = [
            'Visitor',
            'Phone',
            'Host',
            'Purpose',
            'Status',
            'Entry Time',
            'Exit Time',
            'Duration',
            'Gate',
            'Vehicle',
        ];
        const rows = logs.data.map((log) => [
            log.visitor.name,
            log.visitor.phone,
            log.host.name,
            log.purpose,
            log.checked_out_at ? 'Checked Out' : 'Inside',
            log.verified_at,
            log.checked_out_at ?? 'N/A',
            log.duration_minutes ? `${log.duration_minutes} min` : 'Active',
            log.gate,
            log.vehicle ? `${log.vehicle.make} ${log.vehicle.model} (${log.vehicle.plate})` : 'N/A',
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `visitor-operations-export-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Head title="Visitor Operations Center" />

            <div className="w-full space-y-6 pb-24">
                {offline && (
                    <OfflineState
                        title="Connection interrupted"
                        message="Operating in offline mode. Live updates will resume automatically when internet returns."
                    />
                )}

                {/* Real-time Operational Header */}
                <OperationalHeader
                    onExportCSV={handleExportCSV}
                    calendarUrl={calendar.url()}
                    currentlyInsideCount={metrics.currentlyInside}
                    expectedTodayCount={metrics.expectedToday}
                />

                {/* Live Operational Counters */}
                <OperationalSummary
                    currentlyInside={metrics.currentlyInside}
                    expectedToday={metrics.expectedToday}
                    visitorsToday={metrics.visitorsToday}
                    checkoutEnabled={checkoutEnabled}
                />

                {/* Top Operational Area */}
                {checkoutEnabled ? (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Currently Inside Workspace (Left) */}
                        <div className="lg:col-span-8">
                            <CurrentlyInsideWorkspace visitors={activeVisitors} />
                        </div>
                        {/* Gate Stream (Right) */}
                        <div className="lg:col-span-4">
                            <LiveActivityFeed items={feed} />
                        </div>
                    </div>
                ) : (
                    <div>
                        <LiveActivityFeed items={feed} />
                    </div>
                )}

                {/* Today's Expected Arrivals Feed (Full Width) */}
                <ExpectedArrivalsFeed arrivals={upcomingArrivals} />

                {/* Search & Investigation Audit Archive (Full Width) */}
                <SearchAndArchive
                    logs={logs.data}
                    filters={filters}
                    hosts={hostOptions}
                    securityOfficers={officerOptions}
                    checkoutEnabled={checkoutEnabled}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    onSelectLog={(log) => setSelectedLog(log)}
                />

                {/* Infinite Scroll trigger */}
                {logs.next_page_url && (
                    <WhenVisible
                        always
                        fallback={
                            <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-4 text-xs font-semibold text-slate-500">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                                <span>Loading more audit logs...</span>
                            </div>
                        }
                        params={{
                            data: {
                                page: logs.current_page + 1,
                                ...filters,
                            },
                            only: ['logs'],
                            preserveUrl: true,
                        }}
                    >
                        <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-4 text-xs font-semibold text-slate-500">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                            <span>Loading more audit logs...</span>
                        </div>
                    </WhenVisible>
                )}
            </div>

            {/* Log Details Modal */}
            <AnimatePresence>
                {selectedLog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Visitor Operation Details</h3>
                                    <p className="text-xs font-semibold text-slate-400">Pass Code: #{selectedLog.code}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 text-xs font-medium text-slate-700">
                                <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4">
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Visitor</span>
                                        <p className="text-sm font-bold text-slate-900">{selectedLog.visitor.name}</p>
                                        <p className="text-slate-500">{selectedLog.visitor.phone}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold uppercase text-slate-400">Host</span>
                                        <p className="text-sm font-bold text-slate-900">{selectedLog.host.name}</p>
                                        <p className="text-slate-500">Unit: {selectedLog.host.unit ?? 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-400">Purpose</span>
                                        <span className="font-bold text-slate-900">{selectedLog.purpose}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-400">Gate Location</span>
                                        <span className="font-bold text-slate-900">{selectedLog.gate}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-400">Check-in Time</span>
                                        <span className="font-bold text-slate-900">{selectedLog.verified_at}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-400">Verifier Officer</span>
                                        <span className="font-bold text-slate-900">{selectedLog.verifier_name}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-400">Status</span>
                                        <span className="font-bold text-emerald-600">
                                            {checkoutEnabled
                                                ? selectedLog.checked_out_at
                                                    ? 'Checked Out'
                                                    : 'Currently Inside'
                                                : 'Verified'}
                                        </span>
                                    </div>
                                    {selectedLog.vehicle && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-400">Vehicle</span>
                                            <span className="font-bold text-slate-900">
                                                {selectedLog.vehicle.make} {selectedLog.vehicle.model} ({selectedLog.vehicle.plate})
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end bg-slate-50 px-6 py-3">
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs border border-slate-200 hover:bg-slate-100"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
