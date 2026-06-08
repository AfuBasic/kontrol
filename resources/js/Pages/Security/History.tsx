import { Head, Link, router, InfiniteScroll } from '@inertiajs/react';
import { Search, Calendar, Car, User, Filter, X, Clock, ShieldCheck, MapPin, Phone, UserPlus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import HistoryController from '@/actions/App/Http/Controllers/Security/HistoryController';
import { MobileInput, MobileSelect } from '@/Components/MobileInputs';
import MobileSheet from '@/Components/MobileSheet';
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
    verifier_name: string;
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
    };
    hosts: Host[];
};

export default function History({ logs, filters, hosts }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || '');
    const [plate, setPlate] = useState(filters.vehicle_plate || '');
    const [hostId, setHostId] = useState(filters.host_id || '');
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);

    const debouncedSearch = useDebounce(search, 500);
    const debouncedPlate = useDebounce(plate, 500);

    useEffect(() => {
        if (debouncedSearch !== filters.search || debouncedPlate !== filters.vehicle_plate || date !== filters.date || hostId !== filters.host_id) {
            router.get(
                HistoryController.index.url(),
                {
                    search: debouncedSearch,
                    date,
                    vehicle_plate: debouncedPlate,
                    host_id: hostId,
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
        router.get(HistoryController.index.url());
    };

    return (
        <>
            <Head title="Access History" />

            <div className="pt-2 pb-32">
                <div className="mb-8 px-2">
                    <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Access History</h1>
                    <p className="text-sm font-medium text-slate-500">Review and audit all estate entries</p>
                </div>

                {/* Search & Filters Toggle */}
                <div className="mb-8 flex gap-3 px-2">
                    <div className="flex-1">
                        <MobileInput icon={Search} placeholder="Visitor or Code..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button
                        onClick={() => setIsFilterVisible(true)}
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 transition-all active:scale-95 ${hostId || date || plate ? 'text-indigo-600 ring-indigo-500/30' : 'text-slate-400'}`}
                    >
                        <Filter className="h-5 w-5" />
                    </button>
                </div>

                {/* History List with Infinite Scroll */}
                <div className="px-2">
                    {logs.data.length > 0 ? (
                        <InfiniteScroll
                            data="logs"
                            className="grid gap-4"
                            loading={
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                                </div>
                            }
                        >
                            {logs.data.map((log) => (
                                <div
                                    key={log.id}
                                    onClick={() => setSelectedLog(log)}
                                    className="group relative overflow-hidden rounded-[2.25rem] bg-white p-6 shadow-xs ring-1 ring-slate-200 transition-all active:scale-[0.98] active:bg-slate-50"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-indigo-600 shadow-inner ring-1 ring-slate-100">
                                                <User className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg leading-tight font-bold text-slate-900">{log.visitor.name}</h3>
                                                <p className="mt-0.5 text-xs font-semibold text-slate-500">Host: {log.host.name}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-[11px] font-black tracking-widest text-indigo-600 uppercase ring-1 ring-indigo-100">
                                                {log.code}
                                            </span>
                                            <span className="text-[10px] font-bold tracking-tighter text-slate-400 uppercase">
                                                {log.verified_at_human}
                                            </span>
                                        </div>
                                    </div>

                                    {log.vehicle && (
                                        <div className="mt-5 flex items-center justify-between rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-500 shadow-sm">
                                                    <Car className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black tracking-[0.1em] text-slate-400 uppercase">Vehicle</p>
                                                    <p className="text-sm font-bold text-slate-900">
                                                        {log.vehicle.make} {log.vehicle.model}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black tracking-[0.1em] text-slate-400 uppercase">Plate</p>
                                                <p className="text-sm font-black text-slate-900">{log.vehicle.plate}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Purpose</span>
                                            <span className="text-[10px] font-bold text-slate-600">{log.purpose}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Guard</span>
                                            <span className="text-[10px] font-bold text-slate-600">{log.verifier_name}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Entry Time</p>
                                        <p className="text-sm font-bold text-slate-900">{selectedLog.verified_at}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Validated By</p>
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-indigo-500" />
                                            <p className="text-sm font-bold text-slate-900">{selectedLog.verifier_name}</p>
                                        </div>
                                    </div>
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
