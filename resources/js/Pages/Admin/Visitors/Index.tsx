import { Head, Link, router, InfiniteScroll } from '@inertiajs/react';
import { AnimatePresence } from 'framer-motion';
import { Search, Calendar, Car, User, Filter, X, Eye, ShieldCheck, Phone, MapPin, Clock, UserPlus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { index } from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import { MobileInput, MobileSelect } from '@/Components/MobileInputs';
import MobileSheet from '@/Components/MobileSheet';
import Modal from '@/Components/Modal';
import { useDebounce } from '@/Hooks/useDebounce';
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
    };
    hosts: Host[];
};

const formatVisitorType = (type: string | null) => {
    if (!type) return 'Standard Visitor';
    return type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export default function VisitorIndex({ logs, filters, hosts }: Props) {
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
                index.url(),
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
        router.get(index.url());
    };

    return (
        <>
            <Head title="Visitor Logs" />

            {/* Desktop Header */}
            <div className="mb-8 hidden items-center justify-between md:flex">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Visitor Logs</h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">Track and audit all estate visitor entries</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                        className={`inline-flex h-11 items-center gap-2 rounded-xl border px-5 text-sm font-bold transition-all active:scale-95 ${isFilterVisible || date || hostId || plate ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Filter className="h-4 w-4" />
                        {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
            </div>

            {/* Mobile Header */}
            <div className="mb-6 md:hidden">
                <h1 className="text-2xl font-black tracking-tight text-slate-900">Visitor Logs</h1>
                <p className="text-xs font-medium text-slate-500">Estate entry audit history</p>
            </div>

            {/* Global Search & Mobile Filter Trigger */}
            <div className="mb-6 flex gap-3 md:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by visitor or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 w-full rounded-[1.25rem] border-slate-200 bg-white pl-12 text-sm font-medium shadow-xs focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 focus:outline-none md:h-11 md:rounded-xl md:pl-11 md:text-sm"
                    />
                </div>
                <button
                    onClick={() => setIsFilterVisible(true)}
                    className={`flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white shadow-xs ring-1 ring-slate-200 transition-all active:scale-95 md:hidden ${hostId || date || plate ? 'text-indigo-600 ring-indigo-500/30' : 'text-slate-400'}`}
                >
                    <Filter className="h-5 w-5" />
                </button>
            </div>

            {/* Desktop Filters */}
            <AnimatePresence>
                {isFilterVisible && (
                    <div className="mb-8 hidden flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs md:flex">
                        <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Host Resident</label>
                            <select
                                value={hostId}
                                onChange={(e) => setHostId(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="">All Hosts</option>
                                {hosts.map((host) => (
                                    <option key={host.id} value={host.id}>
                                        {host.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex min-w-[200px] flex-1 flex-col gap-2">
                            <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Plate Number</label>
                            <input
                                type="text"
                                placeholder="ABC-123"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-medium focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="flex h-10 items-center gap-2 rounded-lg bg-slate-100 px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
                            >
                                <X className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* Data Display */}
            <div className="md:overflow-hidden md:rounded-[2rem] md:border md:border-slate-200 md:bg-white md:shadow-xs">
                {/* Desktop Table View */}
                <div className="hidden md:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-500">
                            <thead className="bg-slate-50/50 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                <tr>
                                    <th className="px-6 py-5">Visitor & Host</th>
                                    <th className="px-6 py-5">Access Code</th>
                                    <th className="px-6 py-5">Vehicle</th>
                                    <th className="px-6 py-5">Entry Time</th>
                                    <th className="px-6 py-5">Security</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="group transition-colors hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner ring-1 ring-indigo-100">
                                                        <User className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <div className="leading-tight font-bold text-slate-900">{log.visitor.name}</div>
                                                        <div className="text-[11px] font-medium text-slate-500">Host: {log.host.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-black tracking-widest text-emerald-700 uppercase ring-1 ring-emerald-600/20">
                                                    {log.code}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.vehicle ? (
                                                    <div className="flex items-center gap-2">
                                                        <Car className="h-4 w-4 text-slate-400" />
                                                        <div>
                                                            <div className="leading-none font-bold text-slate-900">
                                                                {log.vehicle.make} {log.vehicle.model}
                                                            </div>
                                                            <div className="mt-0.5 text-[10px] font-black tracking-tighter text-indigo-600 uppercase">
                                                                {log.vehicle.plate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-medium text-slate-400 italic">No vehicle</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="leading-none font-bold text-slate-900">{log.verified_at}</div>
                                                <div className="mt-1 text-[10px] font-bold text-slate-400 uppercase">{log.verified_at_human}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-bold text-slate-900">
                                                    <ShieldCheck className="h-4 w-4 text-indigo-500" />
                                                    {log.verifier_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-black tracking-widest text-slate-600 uppercase transition-all hover:bg-indigo-600 hover:text-white active:scale-95"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                                                    <Search className="h-8 w-8" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900">No logs found</h3>
                                                <p className="mt-1 text-sm font-medium text-slate-500">Try adjusting your filters or search terms.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Desktop Pagination */}
                    {logs.total > 0 && (
                        <div className="flex items-center justify-between border-t border-slate-100 bg-white px-6 py-4">
                            <div className="text-xs font-black tracking-widest text-slate-400 uppercase">
                                Showing <span className="text-slate-900">{logs.from}</span> to <span className="text-slate-900">{logs.to}</span> of{' '}
                                <span className="text-slate-900">{logs.total}</span> logs
                            </div>
                            <div className="flex items-center gap-2">
                                {logs.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 text-[11px] font-black uppercase transition-all ${
                                            link.active
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                : link.url
                                                  ? 'text-slate-600 hover:bg-slate-100'
                                                  : 'cursor-not-allowed text-slate-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Card View with Infinite Scroll */}
                <div className="md:hidden">
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
                                            <ShieldCheck className="h-4 w-4 text-indigo-500" />
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
                            <h3 className="text-xl font-bold text-slate-900">No logs found</h3>
                            <p className="mt-1 text-sm font-medium text-slate-500">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Filter Sheet */}
            <MobileSheet isOpen={isFilterVisible && window.innerWidth < 768} onClose={() => setIsFilterVisible(false)} title="Filter Logs">
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

            {/* Desktop Details Modal */}
            <Modal
                isOpen={!!selectedLog && window.innerWidth >= 768}
                onClose={() => setSelectedLog(null)}
                title="Visitor Access Details"
                maxWidth="2xl"
            >
                {selectedLog && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">{selectedLog.visitor.name}</h3>
                                <div className="mt-1 flex items-center gap-2 text-[11px] font-black tracking-widest uppercase">
                                    <span className="text-emerald-600">{selectedLog.code}</span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-400">{formatVisitorType(selectedLog.visitor.type)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Host & Location
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <p className="text-sm font-black text-slate-900">{selectedLog.host.name}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Unit</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedLog.host.unit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Address</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedLog.host.address || 'Estate'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <Phone className="h-3.5 w-3.5" />
                                    Visitor Contact
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <p className="text-sm font-black text-slate-900">{selectedLog.visitor.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <Car className="h-3.5 w-3.5" />
                                    Vehicle Details
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    {selectedLog.vehicle ? (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Make & Model</p>
                                                <p className="text-xs font-bold text-slate-700">
                                                    {selectedLog.vehicle.make} {selectedLog.vehicle.model}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase">Plate Number</p>
                                                <p className="text-sm font-black tracking-widest text-indigo-600 uppercase">
                                                    {selectedLog.vehicle.plate}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs font-medium text-slate-400 italic">No vehicle recorded</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center gap-2 text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Log Details
                                </div>
                                <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Entry Time</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedLog.verified_at}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Security</p>
                                            <p className="text-xs font-bold text-slate-700">{selectedLog.verifier_name}</p>
                                        </div>
                                        <div className="flex justify-between border-t border-slate-200 pt-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Purpose</p>
                                            <p className="text-xs font-black text-indigo-600">{selectedLog.purpose}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 mt-4 flex justify-end gap-3 border-t border-slate-100 pt-6">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-black text-slate-600 transition-all hover:bg-slate-200 active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Mobile Details Sheet */}
            <MobileSheet isOpen={!!selectedLog && window.innerWidth < 768} onClose={() => setSelectedLog(null)} title="Visitation Details">
                {selectedLog && (
                    <div className="space-y-8 pt-4">
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
                                <span className="text-[11px] font-black tracking-widest text-slate-500 uppercase">
                                    {formatVisitorType(selectedLog.visitor.type)}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
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
                                            <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Unit</p>
                                            <p className="text-sm font-bold text-slate-900">{selectedLog.host.unit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Address</p>
                                            <p className="line-clamp-1 text-sm font-bold text-slate-900">{selectedLog.host.address || 'Internal'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[2rem] bg-slate-50 p-6 ring-1 ring-slate-200/50">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-slate-100">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">Contact</h4>
                                </div>
                                <div>
                                    <p className="mb-1 text-[10px] font-bold tracking-tight text-slate-400 uppercase">Phone Number</p>
                                    <p className="text-lg font-bold text-slate-900">{selectedLog.visitor.phone}</p>
                                </div>
                            </div>

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

                            <div className="rounded-[2rem] border-2 border-dashed border-slate-200 p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">Log Info</h4>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Entry Time</p>
                                        <p className="text-sm font-bold text-slate-900">{selectedLog.verified_at}</p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-bold tracking-tight text-slate-400 uppercase">Security</p>
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

VisitorIndex.layout = (page: React.ReactNode) => <AdminLayout title="Visitor Logs">{page}</AdminLayout>;
