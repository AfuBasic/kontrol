import { Head, Link } from '@inertiajs/react';
import {
    History as HistoryIcon,
    Search,
    Calendar,
    Car,
    CheckCircle2,
    XCircle,
    Clock,
    ArrowLeft,
} from 'lucide-react';
import React from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface Log {
    id: number;
    tag: string | null;
    visitor_name: string;
    admission_basis: string;
    vehicle_plate_number: string | null;
    entry_point: string | null;
    verified_at: string | null;
    verified_at_human: string | null;
    checked_out_at: string | null;
    checked_out_at_human: string | null;
    confirmed_at: string | null;
    confirmation_state: string;
}

interface PaginatedLogs {
    data: Log[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: {
        id: number;
        name: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    logs: PaginatedLogs;
    filters: {
        search?: string;
        date?: string;
        status?: string;
    };
}

export default function ArrivalHistory({ organization, membership, logs, filters }: Props) {
    return (
        <OrganizationLayout title="Arrival History">
            <Head title={`${organization.name} - Arrival History`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/org/arrivals"
                                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-medium"
                            >
                                <ArrowLeft className="w-3 h-3" /> Live Arrivals
                            </Link>
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <HistoryIcon className="w-5 h-5 text-indigo-400" />
                            Arrival History & Logs
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Audit trail of past visits, departures, and confirmed arrivals for {organization.name}.
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-300">
                            <thead className="bg-zinc-900/80 text-zinc-400 font-semibold uppercase tracking-wider text-[10px] border-b border-zinc-800">
                                <tr>
                                    <th className="py-3 px-4">Visitor / Member</th>
                                    <th className="py-3 px-4">Tag</th>
                                    <th className="py-3 px-4">Basis</th>
                                    <th className="py-3 px-4">Check-In Time</th>
                                    <th className="py-3 px-4">Check-Out Time</th>
                                    <th className="py-3 px-4">Confirmation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-zinc-500">
                                            No arrival history records found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-zinc-800/30 transition-colors">
                                            <td className="py-3.5 px-4 font-medium text-zinc-100">
                                                <div>{log.visitor_name}</div>
                                                {log.vehicle_plate_number && (
                                                    <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1 mt-0.5">
                                                        <Car className="w-3 h-3" />
                                                        {log.vehicle_plate_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono">
                                                {log.tag ? (
                                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs">
                                                        {log.tag}
                                                    </span>
                                                ) : (
                                                    <span className="text-zinc-500">—</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 capitalize text-zinc-400">
                                                {log.admission_basis.replace('_', ' ')}
                                            </td>
                                            <td className="py-3.5 px-4 text-zinc-300">
                                                {log.verified_at_human} ({log.entry_point || 'Gate'})
                                            </td>
                                            <td className="py-3.5 px-4 text-zinc-300">
                                                {log.checked_out_at_human || (
                                                    <span className="text-amber-400/80 font-medium">Still Inside</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                        log.confirmation_state === 'CONFIRMED'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : log.confirmation_state === 'OVERDUE'
                                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                                    }`}
                                                >
                                                    {log.confirmation_state.replace('_', ' ')}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </OrganizationLayout>
    );
}
