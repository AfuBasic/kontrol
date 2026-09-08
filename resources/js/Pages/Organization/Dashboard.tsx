import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Shield,
    Calendar,
    ArrowRight,
    Car,
    Tag,
} from 'lucide-react';
import React from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface MetricProps {
    currently_inside: number;
    today_entries: number;
    pending_confirmation: number;
    overdue_confirmation: number;
    confirmed: number;
    confirmation_required: boolean;
}

interface Arrival {
    id: number;
    tag: string | null;
    visitor_name: string;
    admission_basis: string;
    vehicle_plate_number: string | null;
    entry_point: string | null;
    verified_at_human: string | null;
    confirmation_state: 'NOT_REQUIRED' | 'CONFIRMED' | 'PENDING' | 'OVERDUE';
    is_overdue: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        access_policy: string;
        arrival_confirmation_required: boolean;
        confirmation_window_minutes: number;
        estate_name: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    metrics: MetricProps;
    recent_arrivals: Arrival[];
}

export default function Dashboard({ organization, membership, metrics, recent_arrivals }: Props) {
    return (
        <OrganizationLayout title="Organization Overview">
            <Head title={`${organization.name} - Overview`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            {organization.name}
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                {organization.type}
                            </span>
                        </h1>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            {organization.estate_name} • Policy:{' '}
                            <span className="capitalize text-zinc-300 font-medium">
                                {organization.access_policy.replace('_', ' ')}
                            </span>
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/org/arrivals"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Live Arrivals
                        </Link>
                        <Link
                            href="/org/access-list"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
                        >
                            <Users className="w-3.5 h-3.5" />
                            Access List
                        </Link>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 shadow-sm">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                            <span>Currently On-Site</span>
                            <Users className="w-4 h-4 text-indigo-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
                            {metrics.currently_inside}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Active within perimeter</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 shadow-sm">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                            <span>Today's Entries</span>
                            <Clock className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-white tracking-tight">
                            {metrics.today_entries}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">Total recorded today</p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 shadow-sm">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                            <span>Pending Confirmation</span>
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
                            {metrics.pending_confirmation}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            Awaiting staff check-in
                        </p>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80 shadow-sm">
                        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
                            <span>Overdue Confirmations</span>
                            <AlertTriangle className="w-4 h-4 text-rose-400" />
                        </div>
                        <div className="mt-2 text-2xl font-bold text-rose-400 tracking-tight">
                            {metrics.overdue_confirmation}
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1">
                            &gt;{organization.confirmation_window_minutes}m past gate entry
                        </p>
                    </div>
                </div>

                {/* Recent Arrivals Table / Feed */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-zinc-400" />
                            <h2 className="text-sm font-semibold text-zinc-200">Recent Arrivals On-Site</h2>
                        </div>
                        <Link
                            href="/org/arrivals"
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                        >
                            View All <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {recent_arrivals.length === 0 ? (
                        <div className="p-8 text-center text-xs text-zinc-500">
                            No visitors or members currently checked in on-site.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800/60">
                            {recent_arrivals.map((arrival) => (
                                <div
                                    key={arrival.id}
                                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-zinc-800/30 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        {arrival.tag && (
                                            <span className="shrink-0 font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                {arrival.tag}
                                            </span>
                                        )}
                                        <div>
                                            <div className="text-xs font-semibold text-zinc-200">
                                                {arrival.visitor_name}
                                            </div>
                                            <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                                                <span>{arrival.verified_at_human}</span>
                                                {arrival.entry_point && <span>• Gate: {arrival.entry_point}</span>}
                                                {arrival.vehicle_plate_number && (
                                                    <span className="flex items-center gap-1">
                                                        <Car className="w-3 h-3 text-zinc-400" />
                                                        {arrival.vehicle_plate_number}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                arrival.confirmation_state === 'CONFIRMED'
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : arrival.confirmation_state === 'OVERDUE'
                                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                                    : arrival.confirmation_state === 'PENDING'
                                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                                            }`}
                                        >
                                            {arrival.confirmation_state.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
