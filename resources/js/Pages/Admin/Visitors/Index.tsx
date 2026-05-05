import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    Calendar,
    Car,
    User,
    Filter,
    X,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Eye,
    ShieldCheck,
    Phone,
    MapPin,
    Clock,
    UserPlus,
    FileText,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDebounce } from '@/Hooks/useDebounce';
import { index } from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';

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
    };
    filters: {
        search?: string;
        date?: string;
        vehicle_plate?: string;
        host_id?: string | number;
    };
    hosts: Host[];
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

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Visitor Logs</h1>
                    <p className="mt-1 text-sm text-gray-500">Track and audit all estate visitor entries</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsFilterVisible(!isFilterVisible)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${isFilterVisible || date || hostId || plate ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Filter className="h-4 w-4" />
                        {isFilterVisible ? 'Hide Filters' : 'Show Filters'}
                    </button>
                </div>
            </div>

            <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by visitor or code..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {isFilterVisible && (
                    <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                            <label className="text-xs font-bold tracking-wider text-gray-500 uppercase">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                            <label className="text-xs font-bold tracking-wider text-gray-500 uppercase">Host Resident</label>
                            <select
                                value={hostId}
                                onChange={(e) => setHostId(e.target.value)}
                                className="appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            >
                                <option value="">All Hosts</option>
                                {hosts.map((host) => (
                                    <option key={host.id} value={host.id}>
                                        {host.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
                            <label className="text-xs font-bold tracking-wider text-gray-500 uppercase">Plate Number</label>
                            <input
                                type="text"
                                placeholder="e.g. ABC-123"
                                value={plate}
                                onChange={(e) => setPlate(e.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                className="flex h-10 items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-300"
                            >
                                <X className="h-4 w-4" />
                                Reset
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs font-bold tracking-wider text-gray-700 uppercase">
                            <tr>
                                <th className="px-6 py-4">Visitor & Host</th>
                                <th className="px-6 py-4">Access Code</th>
                                <th className="px-6 py-4">Vehicle Details</th>
                                <th className="px-6 py-4">Verified At</th>
                                <th className="px-6 py-4">Security Guard</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {logs.data.length > 0 ? (
                                logs.data.map((log) => (
                                    <tr key={log.id} className="transition-colors hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{log.visitor.name}</div>
                                                    <div className="text-xs text-gray-500">Host: {log.host.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 uppercase ring-1 ring-emerald-600/20">
                                                {log.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.vehicle ? (
                                                <div className="flex items-center gap-2">
                                                    <Car className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {log.vehicle.make} {log.vehicle.model}
                                                        </div>
                                                        <div className="text-xs font-bold tracking-tighter text-indigo-600 uppercase">
                                                            {log.vehicle.plate}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No vehicle</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-gray-900">{log.verified_at}</div>
                                            <div className="text-[10px] text-gray-400">{log.verified_at_human}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{log.verifier_name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="mb-4 rounded-full bg-gray-100 p-4">
                                                <Search className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-gray-900">No logs found</h3>
                                            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                    <div className="text-sm text-gray-700">
                        Showing <span className="font-bold">{logs.from}</span> to <span className="font-bold">{logs.to}</span> of{' '}
                        <span className="font-bold">{logs.total}</span> logs
                    </div>
                    <div className="flex items-center gap-2">
                        {logs.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url || '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 text-sm font-medium transition-all ${
                                    link.active
                                        ? 'bg-indigo-600 text-white'
                                        : link.url
                                          ? 'text-gray-700 hover:bg-gray-100'
                                          : 'cursor-not-allowed text-gray-400'
                                }`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Visitor Access Details" maxWidth="2xl">
                {selectedLog && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 flex items-center gap-4 border-b border-gray-100 pb-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedLog.visitor.name}</h3>
                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                    <span className="font-bold text-emerald-600 uppercase">{selectedLog.code}</span>
                                    <span>•</span>
                                    <span>{selectedLog.visitor.type || 'Standard Visitor'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    <MapPin className="h-3.5 w-3.5" />
                                    Host & Location
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                    <p className="text-sm font-bold text-gray-900">{selectedLog.host.name}</p>
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Unit</p>
                                            <p className="text-sm font-medium text-gray-700">{selectedLog.host.unit || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Address</p>
                                            <p className="text-sm font-medium text-gray-700">{selectedLog.host.address || 'Estate'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    <Phone className="h-3.5 w-3.5" />
                                    Visitor Contact
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                    <p className="text-sm font-bold text-gray-900">{selectedLog.visitor.phone}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    <Car className="h-3.5 w-3.5" />
                                    Vehicle Details
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                    {selectedLog.vehicle ? (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Make & Model</p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {selectedLog.vehicle.make} {selectedLog.vehicle.model}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Plate Number</p>
                                                <p className="text-sm font-black text-indigo-600">{selectedLog.vehicle.plate}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">No vehicle information recorded</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Verification
                                </div>
                                <div className="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Time</p>
                                            <p className="text-xs font-medium text-gray-700">{selectedLog.verified_at}</p>
                                        </div>
                                        <div className="flex justify-between">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Guard</p>
                                            <p className="text-xs font-medium text-gray-700">{selectedLog.verifier_name}</p>
                                        </div>
                                        <div className="flex justify-between border-t border-gray-200 pt-3">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Purpose</p>
                                            <p className="text-xs font-bold text-indigo-600">{selectedLog.purpose}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 mt-4 flex justify-end gap-3 border-t border-gray-100 pt-6">
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="rounded-lg bg-gray-100 px-6 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
