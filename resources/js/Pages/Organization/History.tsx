import { Head } from '@inertiajs/react';
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

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        History
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 mt-1">
                        Past visits and departures for {organization.name}.
                    </p>
                </div>

                {/* Sub Navigation */}
                <AccessTabs
                    activeTab="history"
                    hasPublicWindows={hasPublicWindows}
                />

                {/* Editorial History List */}
                {logs.data.length === 0 ? (
                    <div className="py-6 space-y-1">
                        <p className="text-base sm:text-lg font-bold text-slate-800">
                            No past activity recorded yet.
                        </p>
                        <p className="text-sm text-slate-500">
                            Completed visits will appear here once visitors arrive or leave.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {logs.data.map((log) => (
                            <div
                                key={log.id}
                                className="py-3.5 flex items-center justify-between gap-4"
                            >
                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-2 flex-wrap">
                                        <p className="font-bold text-sm sm:text-base text-slate-900">
                                            {log.visitor_name}
                                        </p>
                                        {log.tag && (
                                            <span className="font-mono text-xs text-slate-400">
                                                · {log.tag}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Arrived {log.verified_at_human || 'earlier'}
                                        {log.checked_out_at_human && ` · Left ${log.checked_out_at_human}`}
                                        {log.entry_point && ` · ${log.entry_point}`}
                                    </p>
                                </div>

                                <div className="shrink-0 text-xs font-semibold text-slate-400">
                                    {log.checked_out_at ? 'Departed' : 'Here now'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
