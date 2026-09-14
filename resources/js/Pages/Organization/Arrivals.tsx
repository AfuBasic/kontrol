import { Head, router } from '@inertiajs/react';
import {
    Clock,
    Check,
    AlertTriangle,
} from 'lucide-react';
import React from 'react';
import AccessTabs from '@/Components/Organization/AccessTabs';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface Arrival {
    id: number;
    tag: string | null;
    visitor_name: string;
    admission_basis: string;
    vehicle_plate_number: string | null;
    vehicle_make: string | null;
    vehicle_model: string | null;
    entry_point: string | null;
    verified_at: string | null;
    verified_at_human: string | null;
    confirmed_at: string | null;
    confirmed_at_human: string | null;
    confirmation_state: 'NOT_REQUIRED' | 'CONFIRMED' | 'PENDING' | 'OVERDUE';
    is_overdue: boolean;
    verified_by: { id: number; name: string } | null;
    confirmed_by: { id: number; name: string } | null;
    member: {
        id: number;
        name: string;
        identifier: string | null;
        category: string;
    } | null;
}

interface Metrics {
    currently_inside: number;
    pending_confirmation: number;
    overdue_confirmation: number;
    confirmed: number;
    confirmation_required: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        access_policy: string;
        arrival_confirmation_required: boolean;
        confirmation_window_minutes: number;
        confirmation_escalation: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    arrivals: Arrival[];
    metrics: Metrics;
    filters: {
        search?: string;
        admission_basis?: string;
    };
}

export default function Arrivals({ organization, membership, arrivals, metrics, filters }: Props) {
    const handleConfirm = (id: number) => {
        router.post(`/org/arrivals/${id}/confirm`);
    };

    const hasPublicWindows = organization.access_policy === 'public_window';
    const pendingTotal = (metrics.pending_confirmation ?? 0) + (metrics.overdue_confirmation ?? 0);

    return (
        <OrganizationLayout title="Access - Arrivals">
            <Head title={`${organization.name} - Arrivals`} />

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        Arrivals
                    </h1>
                    <p className="text-sm font-semibold text-slate-500 mt-1">
                        {arrivals.length === 0
                            ? 'No one is currently here'
                            : `${arrivals.length} ${arrivals.length === 1 ? 'person is' : 'people are'} currently here`}
                    </p>
                </div>

                {/* Sub Navigation */}
                <AccessTabs
                    activeTab="arrivals"
                    hasPublicWindows={hasPublicWindows}
                    pendingCount={pendingTotal}
                    activeCount={arrivals.length}
                />

                {/* Editorial Arrivals Flow */}
                {arrivals.length === 0 ? (
                    <div className="py-6 space-y-1">
                        <p className="text-base sm:text-lg font-bold text-slate-800">
                            It’s quiet right now.
                        </p>
                        <p className="text-sm text-slate-500">
                            No one is currently checked in for {organization.name}.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {arrivals.map((arrival) => {
                            const needsConfirmation =
                                arrival.confirmation_state === 'PENDING' ||
                                arrival.confirmation_state === 'OVERDUE';
                            const isOverdue = arrival.confirmation_state === 'OVERDUE';

                            // Needs confirmation earns card containment; already confirmed uses clean list styling
                            return needsConfirmation ? (
                                <div
                                    key={arrival.id}
                                    className={`rounded-3xl border p-5 shadow-xs transition-all space-y-3 ${
                                        isOverdue
                                            ? 'border-amber-300 bg-amber-50/70 ring-1 ring-amber-200/60'
                                            : 'border-slate-200 bg-white'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-base text-slate-900">
                                                    {arrival.visitor_name}
                                                </h3>
                                                {arrival.tag && (
                                                    <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                                                        {arrival.tag}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                Arrived {arrival.verified_at_human || 'recently'} · {arrival.entry_point || 'Main Gate'}
                                                {arrival.vehicle_plate_number && ` · ${arrival.vehicle_plate_number}`}
                                            </p>
                                            <span className="inline-block mt-2 text-xs font-bold text-amber-800">
                                                Waiting for confirmation
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleConfirm(arrival.id)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors self-start sm:self-auto shadow-xs"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            <span>Confirm arrival</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    key={arrival.id}
                                    className="py-3.5 border-b border-slate-100 flex items-center justify-between gap-4"
                                >
                                    <div>
                                        <p className="font-bold text-sm sm:text-base text-slate-900">
                                            {arrival.visitor_name}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Arrived {arrival.verified_at_human || 'recently'} · {arrival.entry_point || 'Main Gate'}
                                        </p>
                                    </div>

                                    <span className="text-xs font-bold text-emerald-600">
                                        Confirmed
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
