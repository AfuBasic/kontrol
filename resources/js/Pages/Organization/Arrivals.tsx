import { Head, router, Link } from '@inertiajs/react';
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    Car,
    Tag,
    User,
    Check,
    Search,
    Shield,
    History,
} from 'lucide-react';
import React from 'react';
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

    return (
        <OrganizationLayout title="Active Arrivals">
            <Head title={`${organization.name} - Active Arrivals`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            Live Active Arrivals
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Visitors and access members currently on estate grounds destination for {organization.name}.
                        </p>
                    </div>

                    <Link
                        href="/org/arrivals/history"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition-colors"
                    >
                        <History className="w-3.5 h-3.5" />
                        Historical Log
                    </Link>
                </div>

                {/* Overdue alert banner if any */}
                {metrics.overdue_confirmation > 0 && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>
                                <strong>{metrics.overdue_confirmation} arrival(s) overdue</strong> for confirmation.
                                Visitors have exceeded the {organization.confirmation_window_minutes}-minute expected arrival window.
                            </span>
                        </div>
                    </div>
                )}

                {/* Active Arrivals List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {arrivals.length === 0 ? (
                        <div className="col-span-full p-12 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                            No active visitors or members on-site for this organization.
                        </div>
                    ) : (
                        arrivals.map((arrival) => (
                            <div
                                key={arrival.id}
                                className={`rounded-xl border p-4 space-y-3 shadow-sm transition-all ${
                                    arrival.confirmation_state === 'OVERDUE'
                                        ? 'bg-rose-950/10 border-rose-500/30'
                                        : arrival.confirmation_state === 'CONFIRMED'
                                        ? 'bg-emerald-950/10 border-emerald-500/20'
                                        : 'bg-zinc-900/40 border-zinc-800/80'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        {arrival.tag ? (
                                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                                                {arrival.tag}
                                            </span>
                                        ) : (
                                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                                PASS
                                            </span>
                                        )}
                                        <span className="text-xs font-semibold text-zinc-200">
                                            {arrival.visitor_name}
                                        </span>
                                    </div>

                                    <span
                                        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                            arrival.confirmation_state === 'CONFIRMED'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : arrival.confirmation_state === 'OVERDUE'
                                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
                                                : arrival.confirmation_state === 'PENDING'
                                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                        }`}
                                    >
                                        {arrival.confirmation_state.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="text-[11px] text-zinc-400 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Admitted At Gate:</span>
                                        <span className="text-zinc-300 font-medium">
                                            {arrival.verified_at_human} ({arrival.entry_point || 'Main Gate'})
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-500">Admission Basis:</span>
                                        <span className="capitalize text-zinc-300 font-medium">
                                            {arrival.admission_basis.replace('_', ' ')}
                                        </span>
                                    </div>
                                    {arrival.vehicle_plate_number && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-zinc-500">Vehicle:</span>
                                            <span className="text-zinc-300 font-mono flex items-center gap-1">
                                                <Car className="w-3 h-3 text-zinc-400" />
                                                {arrival.vehicle_plate_number}
                                            </span>
                                        </div>
                                    )}
                                    {arrival.confirmed_at && (
                                        <div className="flex items-center justify-between text-emerald-400 font-medium pt-1 border-t border-zinc-800/60">
                                            <span>Confirmed At:</span>
                                            <span>{arrival.confirmed_at_human}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Confirmation action button */}
                                {organization.arrival_confirmation_required && !arrival.confirmed_at && (
                                    <div className="pt-2 border-t border-zinc-800/60">
                                        <button
                                            type="button"
                                            onClick={() => handleConfirm(arrival.id)}
                                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Confirm Arrival at Facility
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
