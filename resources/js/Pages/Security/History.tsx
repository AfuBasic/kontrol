import { Head, router, InfiniteScroll } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Search, Calendar, Car, User, Filter, Clock, ShieldCheck, UserPlus, Loader2, MapPin, Phone, Zap, Building2, Tag, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import * as HistoryController from '@/actions/App/Http/Controllers/Security/HistoryController';
import { MobileInput, MobileSelect } from '@/Components/MobileInputs';
import MobileSheet from '@/Components/MobileSheet';
import SecurityActiveQueue, { type SecurityActiveVisit } from '@/Components/Security/SecurityActiveQueue';
import { useDebounce } from '@/Hooks/useDebounce';
import SecurityLayout from '@/Layouts/SecurityLayout';

type Log = {
    id: number;
    code: string;
    visitor: {
        name: string;
        phone: string | null;
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
    verified_at_time?: string | null;
    verifier_name: string;
    gate?: string | null;
    entry_point?: string | null;
    exit_point?: string | null;
    checked_out_at?: string | null;
    checked_out_at_human?: string | null;
    checked_out_at_time?: string | null;
    checkout_verifier_name?: string | null;
    tag?: string | null;
    is_quick_entry?: boolean;
    entry_type?: string;
    entry_type_label?: string;
    destination_name?: string;
    duration_minutes?: number | null;
    outside_hours?: boolean;
    vehicle: {
        make: string;
        model: string;
        plate: string;
    } | null;
};

const formatStayDuration = (minutes: number, _log?: Log) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
};

type Host = {
    id: number;
    name: string;
};

const formatVisitorType = (type: string | null) => {
    if (!type) return 'Standard Visitor';
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

type Props = {
    logs: {
        data: Log[];
        links: any[];
        next_page_url: string | null;
        current_page: number;
        last_page: number;
        total: number;
    };
    filters: {
        search?: string;
        date?: string;
        vehicle_plate?: string;
        host_id?: string | number;
        tab?: string;
    };
    hosts: Host[];
    checkoutEnabled?: boolean;
    activeVisits?: SecurityActiveVisit[];
    activeCount?: number;
};

export default function History({
    logs,
    filters,
    hosts,
    checkoutEnabled = false,
    activeVisits = [],
    activeCount = 0,
}: Props) {
    const paramTab = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : null;
    const initialTab = paramTab === 'active' && checkoutEnabled ? 'active' : 'history';
    const [activeTab, setActiveTab] = useState<'active' | 'history'>(initialTab);
    const [historyFilterTab, setHistoryFilterTab] = useState<'all' | 'visitor_pass' | 'quick_entry'>(
        filters.tab === 'quick_entry' || filters.tab === 'visitor_pass' ? filters.tab : 'all',
    );

    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');
    const [plate, setPlate] = useState(filters.vehicle_plate || '');
    const [hostId, setHostId] = useState(filters.host_id || '');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    const debouncedSearch = useDebounce(search, 500);
    const debouncedPlate = useDebounce(plate, 500);

    const switchTab = (tab: 'active' | 'history') => {
        setActiveTab(tab);
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.set('tab', tab);
            window.history.replaceState({}, '', url.toString());
        }
    };

    const handleSubTabChange = (subTab: 'all' | 'visitor_pass' | 'quick_entry') => {
        setHistoryFilterTab(subTab);
        router.get(
            HistoryController.index.url(),
            {
                search: debouncedSearch,
                date,
                vehicle_plate: debouncedPlate,
                host_id: hostId,
                tab: subTab !== 'all' ? subTab : undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        if (debouncedSearch !== filters.search || debouncedPlate !== filters.vehicle_plate || date !== filters.date || hostId !== filters.host_id) {
            router.get(
                HistoryController.index.url(),
                {
                    search: debouncedSearch,
                    date,
                    vehicle_plate: debouncedPlate,
                    host_id: hostId,
                    tab: historyFilterTab !== 'all' ? historyFilterTab : activeTab,
                },
                {
                    preserveState: true,
                    replace: true,
                },
            );
        }
    }, [debouncedSearch, debouncedPlate, date, hostId]);

    const clearFilters = () => {
        setSearch('');
        setDate('');
        setPlate('');
        setHostId('');
        setHistoryFilterTab('all');
        router.get(HistoryController.index.url());
    };

    return (
        <>
            <Head title="Access Records · Security" />

            <div className="pt-2 pb-32">
                <div className="mb-6 px-2">
                    <h1 className="mb-1 text-2xl font-black tracking-tight text-slate-900">Access Operations</h1>
                    <p className="text-xs font-medium text-slate-500">Active visitors inside & gate history audit</p>
                </div>

                {/* Segmented View Switcher when checkout monitoring is enabled */}
                {checkoutEnabled && (
                    <div className="mb-6 px-2">
                        <div className="relative flex rounded-xl bg-slate-100 p-1 font-semibold">
                            <button
                                onClick={() => switchTab('active')}
                                className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-colors duration-200 ${
                                    activeTab === 'active' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {activeTab === 'active' && (
                                    <motion.div
                                        layoutId="securityActiveTabPill"
                                        className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center justify-center gap-1.5">
                                    <span>Active Inside</span>
                                    {activeCount > 0 && (
                                        <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-100 px-1 text-[10px] font-bold text-emerald-800">
                                            {activeCount}
                                        </span>
                                    )}
                                </span>
                            </button>

                            <button
                                onClick={() => switchTab('history')}
                                className={`relative flex-1 rounded-lg py-2 text-xs font-bold transition-colors duration-200 ${
                                    activeTab === 'history' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                {activeTab === 'history' && (
                                    <motion.div
                                        layoutId="securityActiveTabPill"
                                        className="absolute inset-0 rounded-lg bg-white shadow-2xs"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">History</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* History Sub-Filter: All | Visitor Passes | Quick Entry */}
                {activeTab === 'history' && (
                    <div className="mb-4 flex items-center gap-1.5 px-2">
                        <button
                            type="button"
                            onClick={() => handleSubTabChange('all')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                historyFilterTab === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            All Entries
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubTabChange('visitor_pass')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                historyFilterTab === 'visitor_pass'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            Visitor Passes
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubTabChange('quick_entry')}
                            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                                historyFilterTab === 'quick_entry'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                            }`}
                        >
                            <Zap className="h-3.5 w-3.5" />
                            <span>Quick Entry</span>
                        </button>
                    </div>
                )}

                {/* Search & Filters Toggle */}
                <div className="mb-6 flex gap-3 px-2">
                    <div className="flex-1">
                        <MobileInput icon={Search} placeholder="Visitor or Code..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {activeTab === 'history' && (
                        <button
                            onClick={() => setIsFilterVisible(true)}
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 transition-all active:scale-95 ${hostId || date || plate ? 'text-indigo-600 ring-indigo-500/30' : 'text-slate-400'}`}
                        >
                            <Filter className="h-5 w-5" />
                        </button>
                    )}
                </div>

                {/* Content Section */}
                <div className="px-2">
                    {checkoutEnabled && activeTab === 'active' ? (
                        <SecurityActiveQueue activeVisits={activeVisits} />
                    ) : logs.data.length > 0 ? (
                        <InfiniteScroll
                            data="logs"
                            className="grid gap-4"
                            loading={
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            }
                        >
                            {logs.data.map((log) => {
                                const isQuick = Boolean(log.is_quick_entry);
                                const isOrgCred = log.entry_type === 'organization_credential';
                                const destination = log.destination_name || log.host.name;
                                const isCheckedOut = Boolean(log.checked_out_at);
                                const isRedundantPurpose =
                                    !log.purpose ||
                                    log.purpose === 'Quick Entry' ||
                                    log.purpose === `Visit to ${destination}` ||
                                    log.purpose.toLowerCase() === destination.toLowerCase();

                                return (
                                    <div
                                        key={log.id}
                                        onClick={() => setSelectedLog(log)}
                                        className="group relative flex flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all active:scale-[0.99] active:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                                    >
                                        {/* TOP ROW: Visitor + Destination vs Status (CHECKED OUT / INSIDE) */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline gap-2 flex-wrap">
                                                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                                        {log.visitor.name}
                                                    </h3>
                                                    {log.outside_hours && (
                                                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-700 uppercase ring-1 ring-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300">
                                                            Outside Hours
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Destination / Organization */}
                                                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    {isQuick || isOrgCred ? (
                                                        <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    ) : (
                                                        <User className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                    )}
                                                    <span className="truncate">{destination}</span>
                                                    {log.host.unit && !isQuick && (
                                                        <span className="text-slate-400">· Unit {log.host.unit}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status: CHECKED OUT (or INSIDE if pending) */}
                                            <div className="shrink-0 text-right">
                                                {isCheckedOut ? (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                                                        <span className="text-xs font-black tracking-wider">CHECKED OUT</span>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                                                        <span className="text-xs font-black tracking-wider">INSIDE</span>
                                                    </div>
                                                )}
                                                <div className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                                    {isCheckedOut
                                                        ? `${log.checked_out_at_time || log.checked_out_at}`
                                                        : `Since ${log.verified_at_time || log.verified_at}`}
                                                </div>
                                            </div>
                                        </div>

                                        {/* MIDDLE: Operational Dual Gate & Time Facts */}
                                        <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-2.5 dark:bg-slate-800/50">
                                            <div>
                                                <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                                    Entry Gate & Time
                                                </span>
                                                <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {log.entry_point || log.gate || 'Gate not recorded'}
                                                </p>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                    {log.verified_at_time || log.verified_at}
                                                </span>
                                            </div>

                                            <div>
                                                <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                                    {isCheckedOut ? 'Exit Gate & Time' : 'Gate Status'}
                                                </span>
                                                {isCheckedOut ? (
                                                    <>
                                                        <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                            {log.exit_point || log.entry_point || 'Main Entrance'}
                                                        </p>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            {log.checked_out_at_time || log.checked_out_at}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <p className="mt-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                                        Currently Inside
                                                    </p>
                                                )}
                                            </div>

                                            <div className="col-span-2 sm:col-span-1">
                                                <span className="block text-[9px] font-black tracking-wider text-slate-400 uppercase">
                                                    {isCheckedOut && log.duration_minutes !== null && log.duration_minutes !== undefined ? 'Duration' : 'Entry Type'}
                                                </span>
                                                <p className="mt-0.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                                                    {isCheckedOut && log.duration_minutes !== null && log.duration_minutes !== undefined
                                                        ? formatStayDuration(log.duration_minutes, log)
                                                        : (log.entry_type_label || (isQuick ? 'Quick Entry' : 'Visitor Pass'))}
                                                </p>
                                                {isCheckedOut && (
                                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                        {log.entry_type_label || (isQuick ? 'Quick Entry' : 'Visitor Pass')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* LOWER: Guard, Identifier, Vehicle, Purpose */}
                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {log.tag ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                        <Tag className="h-3 w-3" />
                                                        <span>Visitor Tag #{log.tag}</span>
                                                    </span>
                                                ) : log.code ? (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                        <span>Pass #{log.code}</span>
                                                    </span>
                                                ) : null}

                                                {log.vehicle && (
                                                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                                                        <Car className="h-3 w-3 text-slate-400" />
                                                        <span>{log.vehicle.plate}</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="text-[11px] text-slate-400">
                                                Guard: <span className="font-semibold text-slate-600 dark:text-slate-300">{log.verifier_name}</span>
                                            </div>
                                        </div>

                                        {!isRedundantPurpose && (
                                            <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 italic">
                                                "{log.purpose}"
                                            </p>
                                        )}

                                        {/* BOTTOM: Secondary View Details trigger */}
                                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                                            <span className="text-[11px] text-slate-400">
                                                {log.verified_at}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedLog(log);
                                                }}
                                                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                            >
                                                <span>View Audit Details</span>
                                                <ChevronRight className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </InfiniteScroll>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-[2.25rem] bg-slate-50 py-24 ring-1 ring-slate-100">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                                <Search className="h-10 w-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900">No history found</h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Sheet */}
            <MobileSheet isOpen={isFilterVisible} onClose={() => setIsFilterVisible(false)} title="Filter Logs">
                <div className="space-y-6 pt-4">
                    <MobileInput label="By Date" type="date" icon={Calendar} value={date} onChange={(e) => setDate(e.target.value)} />

                    <MobileSelect
                        label="By Host"
                        icon={UserPlus}
                        value={hostId}
                        onChange={(e) => setHostId(e.target.value)}
                        options={[{ value: '', label: 'All Hosts' }, ...hosts.map((h) => ({ value: h.id, label: h.name }))]}
                    />

                    <MobileInput
                        label="Vehicle Plate"
                        placeholder="Plate number..."
                        icon={Car}
                        value={plate}
                        onChange={(e) => setPlate(e.target.value)}
                    />

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={clearFilters}
                            className="flex-1 rounded-[1.25rem] bg-slate-100 py-4 text-sm font-black text-slate-600 transition-transform active:scale-95"
                        >
                            Reset
                        </button>
                        <button
                            onClick={() => setIsFilterVisible(false)}
                            className="flex-[2] rounded-[1.25rem] bg-indigo-600 py-4 text-sm font-black text-white shadow-xl shadow-indigo-500/20 transition-transform active:scale-95"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            </MobileSheet>

            {/* Details Sheet */}
            <MobileSheet isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Visitation Details">
                {selectedLog && (
                    <div className="space-y-8 pt-4">
                        {/* Header Info */}
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-indigo-50 text-indigo-600 shadow-inner">
                                <User className="h-12 w-12" />
                            </div>
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">{selectedLog.visitor.name}</h3>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-[11px] font-black tracking-[0.2em] text-emerald-700 uppercase">
                                    {selectedLog.code}
                                </span>
                                <span className="text-xs font-bold text-slate-300">•</span>
                                <span className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                                    {formatVisitorType(selectedLog.visitor.type)}
                                </span>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 gap-5">
                            {/* Host Information */}
                            <div className="rounded-[2rem] bg-slate-50 p-6 ring-1 ring-slate-200/50">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">Host & Location</h4>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Resident Name</p>
                                        <p className="text-lg leading-none font-bold text-slate-900">{selectedLog.host.name}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Unit Number</p>
                                            <p className="text-sm font-bold text-slate-900">{selectedLog.host.unit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Address</p>
                                            <p className="line-clamp-1 text-sm font-bold text-slate-900">{selectedLog.host.address || 'Internal'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visitor Contact */}
                            {selectedLog.visitor.phone && (
                                <div className="rounded-[2rem] bg-slate-50 p-6 ring-1 ring-slate-200/50">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <h4 className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">Visitor Contact</h4>
                                    </div>
                                    <div>
                                        <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Phone Number</p>
                                        <p className="text-lg font-bold text-slate-900">{selectedLog.visitor.phone}</p>
                                    </div>
                                </div>
                            )}

                            {/* Vehicle Information */}
                            {selectedLog.vehicle && (
                                <div className="rounded-[2rem] bg-slate-50 p-6 ring-1 ring-slate-200/50">
                                    <div className="mb-5 flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-100">
                                            <Car className="h-5 w-5" />
                                        </div>
                                        <h4 className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">Vehicle Details</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Make & Model</p>
                                            <p className="text-sm font-bold text-slate-900">
                                                {selectedLog.vehicle.make} {selectedLog.vehicle.model}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Plate Number</p>
                                            <p className="text-sm font-black tracking-widest text-indigo-600 uppercase">
                                                {selectedLog.vehicle.plate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline Info */}
                            <div className="rounded-[2rem] border-2 border-dashed border-slate-200 p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">Verification</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Entry Gate & Time</p>
                                        <p className="text-sm font-bold text-slate-900">
                                            {selectedLog.entry_point || selectedLog.gate || 'Main Entrance'} • {selectedLog.verified_at}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Validated By</p>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-indigo-500" />
                                            <p className="text-sm font-bold text-slate-900">{selectedLog.verifier_name}</p>
                                        </div>
                                    </div>
                                    {selectedLog.checked_out_at && (
                                        <>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                                <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Exit Gate & Time</p>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {selectedLog.exit_point || selectedLog.entry_point || selectedLog.gate || 'Main Entrance'} •{' '}
                                                    {selectedLog.checked_out_at}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Checkout Officer</p>
                                                <div className="flex items-center gap-2">
                                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {selectedLog.checkout_verifier_name || 'Security'}
                                                    </p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Purpose</p>
                                        <p className="text-sm font-black text-indigo-600">{selectedLog.purpose}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedLog(null)}
                            className="w-full rounded-[1.5rem] bg-slate-900 py-5 text-base font-black text-white shadow-2xl transition-transform active:scale-[0.98]"
                        >
                            Close Details
                        </button>
                    </div>
                )}
            </MobileSheet>
        </>
    );
}

History.layout = (page: React.ReactNode) => <SecurityLayout variant="light">{page}</SecurityLayout>;
