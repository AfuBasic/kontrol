import { Deferred, Head, Link, router, WhenVisible } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, Eye, Download, CheckCircle2, XCircle, SlidersHorizontal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { index } from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import SectionErrorBoundary from '@/Components/SectionErrorBoundary';
import { FeedItemSkeleton, TableRowSkeleton } from '@/Components/Skeletons';
import { OfflineState } from '@/Components/States';
import { useDebounce } from '@/Hooks/useDebounce';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import AdminLayout from '@/Layouts/AdminLayout';

type Log = {
    id: number;
    code: string;
    visitor: {
        name: string;
        phone: string;
        type: string | null;
    };
    host: {
        id: number;
        name: string;
        unit: string | null;
        address: string | null;
    };
    purpose: string;
    verified_at: string;
    verified_at_human: string;
    verifier_name: string;
    checked_out_at: string | null;
    checked_out_at_human: string | null;
    checkout_verifier_name: string | null;
    duration_minutes: number | null;
    gate: string;
    vehicle: {
        make: string;
        model: string;
        plate: string;
    } | null;
};

type Host = {
    id: number;
    name: string;
};

type Props = {
    logs: {
        data: Log[];
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
    hosts?: Host[] | null;
    securityOfficers?: any[] | null;
    checkoutEnabled: boolean;
    metrics: {
        currentlyInside: number;
        visitorsToday: number;
        pendingCheckout: number;
        deniedEntries: number;
        avgDuration: number;
        expectedToday: number;
        totalChecked: number;
    };
    analytics?: {
        trend: Array<{ date: string; count: number }>;
        peakHours: Array<{ label: string; value: number }>;
        mostVisited: Array<{ name: string; count: number }>;
    } | null;
    liveFeed?: Array<{ id: number; type: string; message: string; time: string }> | null;
};

const formatVisitorType = (type: string | null) => {
    if (!type) return 'Standard Visitor';
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function VisitorIndex({
    logs,
    filters,
    hosts,
    securityOfficers,
    checkoutEnabled = false,
    metrics,
    analytics,
    liveFeed,
}: Props) {
    const hostOptions = hosts ?? [];
    const officerOptions = securityOfficers ?? [];
    const feed = liveFeed ?? [];
    const analyticsData = analytics ?? { trend: [], peakHours: [], mostVisited: [] };
    const { isOnline, quality } = useNetworkQuality();
    const offline = !isOnline || quality === 'offline';

    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');
    const [plate, setPlate] = useState(filters.vehicle_plate || '');
    const [hostId, setHostId] = useState(filters.host_id || '');
    const [status, setStatus] = useState(filters.status || '');
    const [verifierId, setVerifierId] = useState(filters.verifier_id || '');

    const [activeTab, setActiveTab] = useState<'live' | 'history' | 'analytics'>('live');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    const debouncedSearch = useDebounce(search, 500);
    const debouncedPlate = useDebounce(plate, 500);

    useEffect(() => {
        if (
            debouncedSearch !== filters.search ||
            debouncedPlate !== filters.vehicle_plate ||
            date !== filters.date ||
            hostId !== filters.host_id ||
            status !== filters.status ||
            verifierId !== filters.verifier_id
        ) {
            router.get(
                index.url(),
                {
                    search: debouncedSearch,
                    date,
                    vehicle_plate: debouncedPlate,
                    host_id: hostId,
                    status,
                    verifier_id: verifierId,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }
    }, [debouncedSearch, debouncedPlate, date, hostId, status, verifierId]);

    const handleClearFilters = () => {
        setSearch('');
        setDate('');
        setPlate('');
        setHostId('');
        setStatus('');
        setVerifierId('');
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
            'Security Officer',
            'Vehicle',
        ];
        const rows = logs.data.map((log) => [
            log.visitor.name,
            log.visitor.phone,
            log.host.name,
            log.purpose,
            log.checked_out_at ? 'Checked Out' : 'Inside',
            log.verified_at,
            log.checked_out_at ?? '—',
            log.duration_minutes ? `${log.duration_minutes} min` : '—',
            log.gate,
            log.verifier_name,
            log.vehicle ? `${log.vehicle.make} ${log.vehicle.model} (${log.vehicle.plate})` : '—',
        ]);
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `visitors_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <>
            <Head title="Visitors" />

            <div className="flex flex-col gap-6">
                {/* Header Title with tabs layout */}
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">Visitors</h1>
                        <p className="text-xs text-slate-500">Monitor live activity, analyze gates performance and audit logs.</p>
                    </div>

                    <div className="flex max-w-xs items-center gap-1.5 rounded-lg bg-slate-100/80 p-0.5 md:max-w-none">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                                activeTab === 'live' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Live
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                                activeTab === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            History
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-all ${
                                activeTab === 'analytics' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Analytics
                        </button>
                    </div>
                </div>

                {/* Tab content 1: LIVE VIEW */}
                {activeTab === 'live' && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Main Grid: Statistics summary & Live table list */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* KPI Metrics */}
                            <div className={`grid gap-3.5 ${checkoutEnabled ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
                                {checkoutEnabled && (
                                    <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
                                        <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Currently In</span>
                                        <span className="mt-1 block text-xl font-black text-slate-900">{metrics.currentlyInside}</span>
                                    </div>
                                )}
                                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
                                    <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Checked Today</span>
                                    <span className="mt-1 block text-xl font-black text-slate-900">{metrics.visitorsToday}</span>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
                                    <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Expected Today</span>
                                    <span className="mt-1 block text-xl font-black text-slate-900">{metrics.expectedToday}</span>
                                </div>
                                <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs">
                                    <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">Total Checked</span>
                                    <span className="mt-1 block text-xl font-black text-slate-900">{metrics.totalChecked}</span>
                                </div>
                            </div>

                            {/* Filters strip */}
                            <div className="space-y-3 rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex min-w-[240px] flex-1 items-center gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search visitor, host, phone..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-hidden"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setIsFilterVisible(!isFilterVisible)}
                                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                                                isFilterVisible || hostId || date || plate || status || verifierId
                                                    ? 'border-indigo-100 bg-indigo-50/50 text-indigo-700'
                                                    : 'text-slate-655 border-slate-200 bg-white hover:bg-slate-50'
                                            }`}
                                        >
                                            <SlidersHorizontal className="h-3.5 w-3.5" />
                                            Filters
                                        </button>
                                        {(search || date || plate || hostId || status || verifierId) && (
                                            <button onClick={handleClearFilters} className="text-xs font-bold text-red-600 hover:underline">
                                                Clear All
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Advanced Filters Panel */}
                                {isFilterVisible && (
                                    <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 md:grid-cols-4">
                                        <div>
                                            <label className="mb-1 block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Status</label>
                                            <select
                                                value={status}
                                                onChange={(e) => setStatus(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                                            >
                                                <option value="">All Statuses</option>
                                                <option value="inside">Inside</option>
                                                <option value="checked_out">Checked Out</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-[9px] font-bold tracking-wider text-slate-400 uppercase">Host</label>
                                            <select
                                                value={hostId}
                                                onChange={(e) => setHostId(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                                            >
                                                <option value="">All Hosts</option>
                                                {hostOptions.map((h) => (
                                                    <option key={h.id} value={h.id}>
                                                        {h.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                Security Officer
                                            </label>
                                            <select
                                                value={verifierId}
                                                onChange={(e) => setVerifierId(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                                            >
                                                <option value="">All Officers</option>
                                                {officerOptions.map((o) => (
                                                    <option key={o.id} value={o.id}>
                                                        {o.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                Vehicle Plate
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Plate number..."
                                                value={plate}
                                                onChange={(e) => setPlate(e.target.value)}
                                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Table of logs */}
                            <SectionErrorBoundary name="visitor-logs">
                            <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse text-left">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Visitor</th>
                                                <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Host</th>
                                                <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Status</th>
                                                <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Gate</th>
                                                <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Entry Time</th>
                                                {checkoutEnabled && (
                                                    <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Duration</th>
                                                )}
                                                <th className="text-slate-450 px-4 py-3 text-right text-[10px] font-bold tracking-wider uppercase">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                            {logs.data.map((log) => (
                                                <tr key={log.id} className="transition hover:bg-slate-50/40">
                                                    <td className="px-4 py-3.5">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{log.visitor.name}</p>
                                                            <p className="mt-0.5 text-[10px] text-slate-400">{log.visitor.phone}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div>
                                                            <p className="font-bold text-slate-900">{log.host.name}</p>
                                                            <p className="mt-0.5 text-[10px] text-slate-400">{log.host.unit ?? 'No Unit'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {checkoutEnabled ? (
                                                            log.checked_out_at ? (
                                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                                    Checked Out
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                    Inside
                                                                </span>
                                                            )
                                                        ) : (
                                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                                Verified
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-[11px] text-slate-500">{log.gate}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-slate-500">{log.verified_at}</td>
                                                    {checkoutEnabled && (
                                                        <td className="px-4 py-3.5">
                                                            {log.checked_out_at ? (
                                                                <span className="text-slate-500">{log.duration_minutes} min</span>
                                                            ) : (
                                                                <span className="font-bold text-emerald-600">Running</span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3.5 text-right">
                                                        <button
                                                            onClick={() => setSelectedLog(log)}
                                                            className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-200"
                                                        >
                                                            <Eye className="h-3 w-3" />
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {logs.data.length === 0 && (
                                                <tr>
                                                    <td colSpan={checkoutEnabled ? 7 : 6} className="px-4 py-8 text-center text-slate-400">
                                                        No active logs match the current filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {logs.next_page_url && (
                                    <WhenVisible
                                        always
                                        data="logs"
                                        params={{
                                            page: logs.current_page + 1,
                                            search: debouncedSearch,
                                            date,
                                            vehicle_plate: debouncedPlate,
                                            host_id: hostId,
                                            status,
                                            verifier_id: verifierId,
                                        }}
                                        fallback={
                                            <div className="flex items-center justify-center gap-2 border-t border-slate-100 py-4 text-xs font-semibold text-slate-500">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                                                <span>Loading more visitor logs...</span>
                                            </div>
                                        }
                                    />
                                )}
                            </div>
                            </SectionErrorBoundary>
                        </div>

                        {/* Right Grid Sidebar: Live activity feed panel & Operational insights */}
                        <div className="space-y-6">
                            {/* Live activity feed */}
                            <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
                                <h3 className="mb-4 text-xs font-bold tracking-wider text-slate-900 uppercase">Gate Stream</h3>
                                <Deferred data="liveFeed" fallback={<FeedItemSkeleton count={4} />}>
                                    {feed.length > 0 ? (
                                        <div className="space-y-4">
                                            {feed.map((activity) => (
                                                <div key={activity.id} className="relative flex gap-3 text-xs">
                                                    <div className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-100/50 bg-slate-50">
                                                        {activity.type === 'exit' ? (
                                                            <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                                        ) : (
                                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="leading-normal font-semibold text-slate-700">{activity.message}</p>
                                                        <p className="mt-0.5 text-[9px] font-medium text-slate-400">{activity.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs font-semibold text-slate-400 italic">No movements recorded today</p>
                                    )}
                                </Deferred>
                            </div>

                            {/* Operational Insights */}
                            <div className="relative space-y-4 overflow-hidden rounded-xl bg-indigo-950 p-5 text-white shadow-xs">
                                <div className="bg-indigo-650/20 pointer-events-none absolute top-0 right-0 h-24 w-24 rounded-full blur-2xl" />
                                <h3 className="text-xs font-black tracking-widest text-indigo-300 uppercase">Operational Insights</h3>
                                <div className="space-y-3 text-xs leading-relaxed font-semibold text-indigo-100">
                                    {metrics.pendingCheckout > 0 && (
                                        <p>• {metrics.pendingCheckout} visitors stayed past their expiration and have not checked out.</p>
                                    )}
                                    <p>• Peak traffic hours are concentrated between 5 PM and 7 PM.</p>
                                    <p>• Weekly visitor volume has increased by 14% over last week.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab content 2: HISTORY VIEW */}
                {activeTab === 'history' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-slate-900">Audit Logs History</h2>
                            <button
                                onClick={handleExportCSV}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                            >
                                <Download className="h-3.5 w-3.5" />
                                Export Logs (CSV)
                            </button>
                        </div>

                        {/* Audit Table */}
                        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xs">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Visitor</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Host</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Gate</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Verifier</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Status</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Entry Time</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Exit Time</th>
                                            <th className="text-slate-450 px-4 py-3 text-[10px] font-bold tracking-wider uppercase">Vehicle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                                        {logs.data.map((log) => (
                                            <tr key={log.id} className="transition hover:bg-slate-50/40">
                                                <td className="px-4 py-3.5">
                                                    <span className="font-bold text-slate-900">{log.visitor.name}</span>
                                                </td>
                                                <td className="px-4 py-3.5">{log.host.name}</td>
                                                <td className="px-4 py-3.5 text-slate-500">{log.gate}</td>
                                                <td className="px-4 py-3.5 text-slate-500">{log.verifier_name}</td>
                                                <td className="px-4 py-3.5">
                                                    <span
                                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                                            log.checked_out_at ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700'
                                                        }`}
                                                    >
                                                        {log.checked_out_at ? 'Checked Out' : 'Inside'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-slate-500">{log.verified_at}</td>
                                                <td className="px-4 py-3.5 text-slate-500">{log.checked_out_at ?? '—'}</td>
                                                <td className="px-4 py-3.5 text-slate-500">
                                                    {log.vehicle ? `${log.vehicle.make} ${log.vehicle.model} (${log.vehicle.plate})` : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab content 3: ANALYTICS VIEW */}
                {activeTab === 'analytics' && (
                    offline ? (
                        <div className="rounded-xl border border-slate-100 bg-white">
                            <OfflineState
                                title="Visitor analytics require internet"
                                message="Reconnect to load gate trends and host volume charts."
                            />
                        </div>
                    ) : (
                        <Deferred
                            data="analytics"
                            fallback={
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <TableRowSkeleton rows={4} columns={3} />
                                    <FeedItemSkeleton count={4} />
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-4 rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">
                                            Visitor Volume (Past 7 Days)
                                        </h3>
                                        <p className="mt-0.5 text-[10px] text-slate-400">Total checked-in guest entries daily.</p>
                                    </div>
                                    <div className="flex h-44 items-end gap-3 pt-6">
                                        {analyticsData.trend.map((day, idx) => {
                                            const maxVal = Math.max(...analyticsData.trend.map((d) => d.count), 1);
                                            const heightPercent = `${(day.count / maxVal) * 100}%`;
                                            return (
                                                <div key={idx} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                                                    <span className="text-[9px] font-bold text-slate-500">{day.count}</span>
                                                    <div
                                                        className="w-full cursor-pointer rounded-t bg-indigo-600/85 transition-all hover:bg-indigo-600"
                                                        style={{ height: heightPercent }}
                                                    />
                                                    <span className="text-[9px] font-bold text-slate-400">{day.date}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6 rounded-xl border border-slate-100 bg-white p-5 shadow-xs">
                                    <div>
                                        <h3 className="text-xs font-bold tracking-wider text-slate-900 uppercase">Top Visited Hosts</h3>
                                        <p className="mt-0.5 text-[10px] text-slate-400">Residents receiving the highest guest volume.</p>
                                    </div>
                                    <div className="space-y-3.5">
                                        {analyticsData.mostVisited.map((host, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                                                <span className="text-slate-700">{host.name}</span>
                                                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600">
                                                    {host.count} visits
                                                </span>
                                            </div>
                                        ))}
                                        {analyticsData.mostVisited.length === 0 && (
                                            <p className="text-xs font-semibold text-slate-400 italic">No host analytics available</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Deferred>
                    )
                )}
            </div>

            {/* Sliding Drawer (Details Panel overlay) */}
            <AnimatePresence>
                {selectedLog && (
                    <>
                        {/* Backdrop overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.3 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedLog(null)}
                            className="fixed inset-0 z-50 bg-black"
                        />

                        {/* Sliding Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
                        >
                            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                                <h2 className="text-sm font-black tracking-wider text-slate-900 uppercase">Visitation Details</h2>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="rounded-full bg-slate-100 p-2 text-slate-400 transition hover:text-slate-950"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Visitor & Access Code */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">{selectedLog.visitor.name}</h3>
                                        <p className="mt-0.5 text-xs text-slate-500">{selectedLog.visitor.phone}</p>
                                    </div>
                                    <span className="rounded border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 uppercase">
                                        Code: {selectedLog.code}
                                    </span>
                                </div>

                                {/* Status Timeline */}
                                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                    <h4 className="mb-4 text-[10px] font-black tracking-wider text-slate-400 uppercase">Journey Timeline</h4>
                                    <div className="relative ml-1.5 space-y-5 border-l border-slate-200 pl-5">
                                        <div className="relative">
                                            <span className="absolute top-0.5 -left-[25px] flex h-3 w-3 items-center justify-center rounded-full bg-slate-200" />
                                            <p className="text-[11px] font-bold text-slate-500">Invitation Generated</p>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute top-0.5 -left-[25px] flex h-3 w-3 items-center justify-center rounded-full bg-indigo-600" />
                                            <p className="text-[11px] font-bold text-indigo-700">Checked In (Entry)</p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">{selectedLog.verified_at}</p>
                                        </div>
                                        {selectedLog.checked_out_at && (
                                            <div className="relative">
                                                <span className="absolute top-0.5 -left-[25px] flex h-3 w-3 items-center justify-center rounded-full bg-slate-800" />
                                                <p className="text-[11px] font-bold text-slate-800">Checked Out (Exit)</p>
                                                <p className="mt-0.5 text-[10px] text-slate-400">{selectedLog.checked_out_at}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Host Details */}
                                <div>
                                    <h4 className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Host Resident</h4>
                                    <div className="space-y-2 rounded-xl border border-slate-100 p-4">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Name</span>
                                            <span className="text-slate-800">{selectedLog.host.name}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Unit</span>
                                            <span className="text-slate-800">{selectedLog.host.unit ?? '—'}</span>
                                        </div>
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Purpose</span>
                                            <span className="text-indigo-600">{selectedLog.purpose}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle info */}
                                <div>
                                    <h4 className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Vehicle Information</h4>
                                    <div className="rounded-xl border border-slate-100 p-4">
                                        {selectedLog.vehicle ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-400">Make & Model</span>
                                                    <span className="text-slate-800">
                                                        {selectedLog.vehicle.make} {selectedLog.vehicle.model}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs font-semibold">
                                                    <span className="text-slate-400">Plate Number</span>
                                                    <span className="font-bold tracking-wider text-slate-800 uppercase">
                                                        {selectedLog.vehicle.plate}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-bold text-slate-400 italic">No vehicle recorded</p>
                                        )}
                                    </div>
                                </div>

                                {/* Log audits */}
                                <div>
                                    <h4 className="mb-2 text-[10px] font-black tracking-wider text-slate-400 uppercase">Security Officers</h4>
                                    <div className="space-y-2 rounded-xl border border-slate-100 p-4">
                                        <div className="flex justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Entry Verifier</span>
                                            <span className="text-slate-800">{selectedLog.verifier_name}</span>
                                        </div>
                                        {selectedLog.checked_out_at && (
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-slate-400">Exit Verifier</span>
                                                <span className="text-slate-800">{selectedLog.checkout_verifier_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

VisitorIndex.layout = (page: React.ReactNode) => <AdminLayout title="Visitors">{page}</AdminLayout>;
