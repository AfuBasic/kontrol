import { Head, Link } from '@inertiajs/react';
import {
    History as HistoryIcon,
    Search,
    Calendar,
    Car,
    CheckCircle2,
    Clock,
    User,
    ArrowRight,
} from 'lucide-react';
import React from 'react';
import AccessTabs from '@/Components/Organization/AccessTabs';
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
        access_policy?: string;
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
    const hasPublicWindows = organization.access_policy === 'public_window';

    return (
        <OrganizationLayout title="Access - History">
            <Head title={`${organization.name} - History`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Access
                        </h1>
                        <p className="text-sm text-stone-500 mt-0.5">
                            Past visits, departures, and access records for {organization.name}.
                        </p>
                    </div>
                </div>

                {/* Unified Access Tabs */}
                <AccessTabs
                    activeTab="history"
                    hasPublicWindows={hasPublicWindows}
                />

                {/* History List */}
                <div className="space-y-3">
                    {logs.data.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-12 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <HistoryIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">No past activity recorded</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                                Completed check-ins and departures will appear here as people visit {organization.name}.
                            </p>
                        </div>
                    ) : (
                        logs.data.map((log) => (
                            <div
                                key={log.id}
                                className="rounded-2xl bg-white border border-stone-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-slate-800 font-bold text-sm shrink-0 mt-0.5">
                                        {log.visitor_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                                {log.visitor_name}
                                            </h3>
                                            {log.tag && (
                                                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-slate-700 border border-stone-200">
                                                    {log.tag}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                                            <span>Arrived {log.verified_at_human || 'earlier'}</span>
                                            {log.checked_out_at_human && (
                                                <>
                                                    <span>•</span>
                                                    <span>Departed {log.checked_out_at_human}</span>
                                                </>
                                            )}
                                            <span>•</span>
                                            <span>{log.entry_point || 'Main Gate'}</span>
                                            {log.vehicle_plate_number && (
                                                <>
                                                    <span>•</span>
                                                    <span className="font-mono text-slate-700 font-medium">
                                                        {log.vehicle_plate_number}
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-auto">
                                    {log.checked_out_at ? (
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 font-medium border border-stone-200">
                                            Departed
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                            Currently Here
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
