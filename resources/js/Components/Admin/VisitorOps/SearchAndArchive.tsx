import React, { useState } from 'react';
import { Eye, Search, SlidersHorizontal, X } from 'lucide-react';

export type AuditLog = {
    id: number;
    code: string;
    visitor: {
        name: string;
        phone: string;
        type: string | null;
    };
    host: {
        id?: number;
        name: string;
        unit: string | null;
        address?: string | null;
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

type Props = {
    logs: AuditLog[];
    filters: {
        search?: string;
        date?: string;
        vehicle_plate?: string;
        host_id?: string | number;
        status?: string;
        gate?: string;
        verifier_id?: string | number;
    };
    hosts: Array<{ id: number; name: string }>;
    securityOfficers: Array<{ id: number; name: string }>;
    checkoutEnabled: boolean;
    onFilterChange: (filters: Record<string, any>) => void;
    onClearFilters: () => void;
    onSelectLog: (log: AuditLog) => void;
};

type SortField = 'visitor' | 'host' | 'status' | 'entry' | 'duration';

export default function SearchAndArchive({
    logs,
    filters,
    hosts,
    securityOfficers,
    checkoutEnabled,
    onFilterChange,
    onClearFilters,
    onSelectLog,
}: Props) {
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [sortField, setSortField] = useState<SortField>('entry');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedLogs = [...logs].sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortField === 'visitor') {
            valA = a.visitor.name || '';
            valB = b.visitor.name || '';
        } else if (sortField === 'host') {
            valA = a.host.name || '';
            valB = b.host.name || '';
        } else if (sortField === 'status') {
            valA = a.checked_out_at ? 'Checked Out' : 'Inside';
            valB = b.checked_out_at ? 'Checked Out' : 'Inside';
        } else if (sortField === 'entry') {
            valA = new Date(a.verified_at || 0).getTime();
            valB = new Date(b.verified_at || 0).getTime();
        } else if (sortField === 'duration') {
            valA = a.duration_minutes || 0;
            valB = b.duration_minutes || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return <span className="ml-1 opacity-0 group-hover:opacity-100 transition text-slate-300 font-normal">↕</span>;
        }
        return <span className="ml-1 text-primary-600 font-black">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
    };

    const hasActiveFilters = Boolean(
        filters.search ||
            filters.date ||
            filters.vehicle_plate ||
            filters.host_id ||
            filters.status ||
            filters.verifier_id
    );

    return (
        <div className="space-y-4 pt-4 border-t border-slate-200/80">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Investigation & Audit Archive
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-400">
                        Historical visitor logs, verification records, and entry/exit security audit trail.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsFilterVisible((prev) => !prev)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition shadow-2xs ${
                            isFilterVisible || hasActiveFilters
                                ? 'border-primary-300 bg-primary-50 text-primary-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        <span>Filter Records</span>
                    </button>

                    {hasActiveFilters && (
                        <button
                            onClick={onClearFilters}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
                        >
                            <X className="h-3.5 w-3.5" />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Drawer */}
            {isFilterVisible && (
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3 lg:grid-cols-5">
                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Search</label>
                        <input
                            type="text"
                            value={filters.search || ''}
                            onChange={(e) => onFilterChange({ search: e.target.value })}
                            placeholder="Visitor, code, phone..."
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Visit Date</label>
                        <input
                            type="date"
                            value={filters.date || ''}
                            onChange={(e) => onFilterChange({ date: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-hidden"
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Host Resident</label>
                        <select
                            value={filters.host_id || ''}
                            onChange={(e) => onFilterChange({ host_id: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-hidden"
                        >
                            <option value="">All Hosts</option>
                            {hosts.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Status</label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) => onFilterChange({ status: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-hidden"
                        >
                            <option value="">All Statuses</option>
                            {checkoutEnabled && <option value="inside">Currently Inside</option>}
                            {checkoutEnabled && <option value="checked_out">Checked Out</option>}
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Plate Number</label>
                        <input
                            type="text"
                            value={filters.vehicle_plate || ''}
                            onChange={(e) => onFilterChange({ vehicle_plate: e.target.value })}
                            placeholder="Plate #..."
                            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 focus:border-primary-500 focus:outline-hidden"
                        />
                    </div>
                </div>
            )}

            {/* Audit Log Table */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                                <th
                                    onClick={() => handleSort('visitor')}
                                    className="group cursor-pointer px-4 py-3 select-none hover:text-slate-900"
                                >
                                    <div className="flex items-center">
                                        <span>Visitor</span>
                                        {renderSortIcon('visitor')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('host')}
                                    className="group cursor-pointer px-4 py-3 select-none hover:text-slate-900"
                                >
                                    <div className="flex items-center">
                                        <span>Host</span>
                                        {renderSortIcon('host')}
                                    </div>
                                </th>
                                <th
                                    onClick={() => handleSort('status')}
                                    className="group cursor-pointer px-4 py-3 select-none hover:text-slate-900"
                                >
                                    <div className="flex items-center">
                                        <span>Status</span>
                                        {renderSortIcon('status')}
                                    </div>
                                </th>
                                <th className="px-4 py-3">Gate</th>
                                <th
                                    onClick={() => handleSort('entry')}
                                    className="group cursor-pointer px-4 py-3 select-none hover:text-slate-900"
                                >
                                    <div className="flex items-center">
                                        <span>Entry Time</span>
                                        {renderSortIcon('entry')}
                                    </div>
                                </th>
                                {checkoutEnabled && (
                                    <th
                                        onClick={() => handleSort('duration')}
                                        className="group cursor-pointer px-4 py-3 select-none hover:text-slate-900"
                                    >
                                        <div className="flex items-center">
                                            <span>Duration</span>
                                            {renderSortIcon('duration')}
                                        </div>
                                    </th>
                                )}
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            {sortedLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={checkoutEnabled ? 7 : 6} className="py-8 text-center text-xs font-semibold text-slate-400">
                                        No visitor records match the search parameters.
                                    </td>
                                </tr>
                            ) : (
                                sortedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/70 transition">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-bold text-slate-900">{log.visitor.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{log.visitor.phone}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="font-bold text-slate-900">{log.host.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium">{log.host.unit ?? 'Main'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {checkoutEnabled ? (
                                                log.checked_out_at ? (
                                                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                                        Checked Out
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        Inside
                                                    </span>
                                                )
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                                    Verified
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500">{log.gate}</td>
                                        <td className="px-4 py-3 text-slate-500">{log.verified_at}</td>
                                        {checkoutEnabled && (
                                            <td className="px-4 py-3">
                                                {log.checked_out_at ? (
                                                    <span className="text-slate-500">{log.duration_minutes} min</span>
                                                ) : (
                                                    <span className="font-bold text-emerald-600">Active Stay</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => onSelectLog(log)}
                                                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                                            >
                                                <Eye className="h-3 w-3" />
                                                <span>Details</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
