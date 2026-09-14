import { Head, router, Link } from '@inertiajs/react';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Car,
    User,
    Check,
    Search,
    Shield,
    History,
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

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            Access
                        </h1>
                        <p className="text-sm text-stone-500 mt-0.5">
                            Real-time visitors and active arrivals for {organization.name}.
                        </p>
                    </div>
                </div>

                {/* Unified Access Tabs */}
                <AccessTabs
                    activeTab="arrivals"
                    hasPublicWindows={hasPublicWindows}
                    pendingCount={pendingTotal}
                    activeCount={arrivals.length}
                />

                {/* Human Operational Summary */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-base">
                            {arrivals.length}
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">
                                {arrivals.length === 0
                                    ? 'No one is currently checked in'
                                    : arrivals.length === 1
                                    ? '1 person is currently here'
                                    : `${arrivals.length} people are currently here`}
                            </h2>
                            <p className="text-xs text-stone-500">
                                Admitted through estate security gates
                            </p>
                        </div>
                    </div>

                    {pendingTotal > 0 && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            {pendingTotal} need confirmation
                        </span>
                    )}
                </div>

                {/* Arrivals List */}
                <div className="space-y-3">
                    {arrivals.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-12 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">It's quiet right now</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                                No one is currently checked in at the gate for {organization.name}.
                            </p>
                        </div>
                    ) : (
                        arrivals.map((arrival) => {
                            const needsConfirmation =
                                arrival.confirmation_state === 'PENDING' ||
                                arrival.confirmation_state === 'OVERDUE';
                            const isOverdue = arrival.confirmation_state === 'OVERDUE';

                            return (
                                <div
                                    key={arrival.id}
                                    className={`rounded-2xl bg-white border p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                                        isOverdue
                                            ? 'border-amber-300 ring-1 ring-amber-200/60'
                                            : 'border-stone-200/80'
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3.5">
                                            <div
                                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 ${
                                                    needsConfirmation
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-emerald-100 text-emerald-800'
                                                }`}
                                            >
                                                {arrival.visitor_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                                        {arrival.visitor_name}
                                                    </h3>
                                                    {arrival.tag && (
                                                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-stone-100 text-slate-700 border border-stone-200">
                                                            {arrival.tag}
                                                        </span>
                                                    )}
                                                    {arrival.member && (
                                                        <span className="text-[11px] capitalize px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                                                            {arrival.member.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                                                    <span>Arrived {arrival.verified_at_human || 'recently'}</span>
                                                    <span>•</span>
                                                    <span>{arrival.entry_point || 'Main Gate'}</span>
                                                    {arrival.vehicle_plate_number && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-mono text-slate-700 font-medium">
                                                                {arrival.vehicle_plate_number}
                                                            </span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Confirmation Action or Status */}
                                        <div className="flex items-center gap-2 self-start sm:self-auto pt-1 sm:pt-0">
                                            {needsConfirmation ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleConfirm(arrival.id)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    <span>Confirm arrival</span>
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span>Arrival confirmed</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Operational note if overdue */}
                                    {isOverdue && (
                                        <div className="pt-2 border-t border-amber-100 flex items-center gap-2 text-xs text-amber-800 bg-amber-50/70 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 p-3 rounded-b-2xl">
                                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                            <span>
                                                This visitor was admitted over {organization.confirmation_window_minutes || 15} minutes ago and needs attention.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
