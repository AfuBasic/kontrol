import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Check, Clock, MapPin, Radio, ShieldCheck, UserCheck } from 'lucide-react';
import React, { useState } from 'react';
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

export default function Arrivals({ organization, arrivals, metrics }: Props) {
    const [confirmingIds, setConfirmingIds] = useState<number[]>([]);

    const hasPublicWindows = organization.access_policy === 'public_window';
    const pendingArrivals = arrivals.filter((arrival) => arrival.confirmation_state === 'PENDING' || arrival.confirmation_state === 'OVERDUE');
    const confirmedArrivals = arrivals.filter((arrival) => arrival.confirmation_state !== 'PENDING' && arrival.confirmation_state !== 'OVERDUE');
    const pendingTotal = (metrics.pending_confirmation ?? 0) + (metrics.overdue_confirmation ?? 0);
    const hasPending = pendingArrivals.length > 0;

    const handleConfirm = (id: number) => {
        setConfirmingIds((prev) => [...prev, id]);
        router.post(`/org/arrivals/${id}/confirm`, {}, {
            onFinish: () => setConfirmingIds((prev) => prev.filter((i) => i !== id)),
        });
    };

    const initialsFor = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();

    const detailLine = (arrival: Arrival) => {
        const parts = [
            arrival.entry_point || 'Gate',
            arrival.verified_at_human ? `arrived ${arrival.verified_at_human}` : 'arrived recently',
            arrival.vehicle_plate_number ? arrival.vehicle_plate_number.toUpperCase() : null,
        ].filter(Boolean);

        return parts.join(' - ');
    };

    return (
        <OrganizationLayout title="Access - Arrivals" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - Arrivals`} />

            <div className="space-y-5">
                {/* Header with metrics and tabs */}
                <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-black text-[#0b4aa2]">Current presence</p>
                            <h1 className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-4xl">
                                Who is at {organization.name} right now
                            </h1>
                        </div>

                        <div className="grid grid-cols-3 gap-2 lg:w-[27rem]">
                            <div className="rounded-[1.35rem] bg-[#0f172a] p-4 text-white">
                                <p className="text-2xl font-black">{metrics.currently_inside ?? arrivals.length}</p>
                                <p className="mt-1 text-xs font-bold text-slate-300">Here now</p>
                            </div>
                            <div className="rounded-[1.35rem] bg-amber-50 p-4 text-amber-900 ring-1 ring-amber-100">
                                <p className="text-2xl font-black">{pendingTotal}</p>
                                <p className="mt-1 text-xs font-bold">To confirm</p>
                            </div>
                            <div className="rounded-[1.35rem] bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-100">
                                <p className="text-2xl font-black">{metrics.confirmed ?? 0}</p>
                                <p className="mt-1 text-xs font-bold">Confirmed</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <AccessTabs
                            activeTab="arrivals"
                            hasPublicWindows={hasPublicWindows}
                            pendingCount={pendingTotal}
                            activeCount={arrivals.length}
                        />
                    </div>
                </section>

                {/* Empty state */}
                {arrivals.length === 0 && (
                    <section className="grid gap-4 rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:grid-cols-[1fr_14rem] sm:gap-5 sm:rounded-[2rem] sm:p-8">
                        <div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">No active arrivals.</h2>
                            <p className="mt-3 max-w-xl text-sm leading-6 font-semibold text-slate-500">
                                Security has not checked anyone in for {organization.name}. When someone arrives, this page becomes the
                                live operating queue.
                            </p>
                        </div>
                    </section>
                )}

                {/* Mobile: Priority surface when pending confirmations exist */}
                {arrivals.length > 0 && hasPending && (
                    <section className="lg:hidden">
                        <div className="mb-3 flex items-center gap-2.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <h2 className="text-sm font-black text-slate-900">Needs confirmation</h2>
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900">
                                {pendingArrivals.length}
                            </span>
                        </div>

                        <div className="space-y-3">
                            {pendingArrivals.map((arrival) => {
                                const overdue = arrival.confirmation_state === 'OVERDUE';
                                const isConfirming = confirmingIds.includes(arrival.id);

                                return (
                                    <article
                                        key={arrival.id}
                                        className={`rounded-[1.5rem] p-4 ring-1 ${
                                            overdue ? 'bg-rose-50 ring-rose-200' : 'bg-amber-50 ring-amber-200'
                                        }`}
                                    >
                                        <div className="flex gap-3">
                                            <div
                                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                                                    overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                                }`}
                                            >
                                                {initialsFor(arrival.visitor_name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h3 className="truncate text-base font-black text-slate-950">
                                                        {arrival.visitor_name}
                                                    </h3>
                                                    {overdue && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-black text-rose-700">
                                                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                                                            Overdue
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-0.5 text-sm font-bold text-slate-600">
                                                    {arrival.member?.category || arrival.admission_basis}
                                                </p>
                                                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                    <span className="truncate">{detailLine(arrival)}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isConfirming}
                                            onClick={() => handleConfirm(arrival.id)}
                                            className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 text-sm font-black text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)] transition-opacity ${
                                                isConfirming ? 'cursor-not-allowed opacity-60' : ''
                                            }`}
                                        >
                                            <Check className="h-4 w-4" />
                                            {isConfirming ? 'Confirming...' : 'Confirm arrival'}
                                        </button>
                                    </article>
                                );
                            })}
                        </div>

                        {/* Secondary: confirmed list, quiet on mobile when pending exists */}
                        {confirmedArrivals.length > 0 && (
                            <div className="mt-5">
                                <div className="mb-3 flex items-center gap-2.5">
                                    <Radio className="h-4 w-4 text-slate-400" />
                                    <h2 className="text-sm font-black text-slate-700">Currently here</h2>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                                        {confirmedArrivals.length}
                                    </span>
                                </div>
                                <div className="divide-y divide-slate-100 rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200/80">
                                    {confirmedArrivals.map((arrival) => (
                                        <div key={arrival.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eaf2ff] text-xs font-black text-[#0b4aa2]">
                                                {initialsFor(arrival.visitor_name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-black text-slate-900">{arrival.visitor_name}</p>
                                                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                                                    {arrival.entry_point || 'Gate'} · {arrival.verified_at_human || 'recently'}
                                                </p>
                                            </div>
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-black text-emerald-700">
                                                <UserCheck className="h-3 w-3" />
                                                Cleared
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Mobile: No pending - show confirmed list as primary */}
                {arrivals.length > 0 && !hasPending && (
                    <section className="lg:hidden">
                        <div className="mb-3 flex items-center gap-2.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <h2 className="text-sm font-black text-slate-900">All confirmed</h2>
                        </div>
                        <div className="divide-y divide-slate-100 rounded-[1.5rem] bg-white p-4 ring-1 ring-slate-200/80">
                            {confirmedArrivals.map((arrival) => (
                                <article key={arrival.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf2ff] text-sm font-black text-[#0b4aa2]">
                                        {initialsFor(arrival.visitor_name)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="truncate text-base font-black text-slate-950">{arrival.visitor_name}</h3>
                                                <p className="mt-0.5 text-sm font-bold text-slate-500">
                                                    {arrival.member?.name || arrival.admission_basis}
                                                </p>
                                            </div>
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Cleared
                                            </span>
                                        </div>
                                        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                {arrival.verified_at_human || 'recently'}
                                            </span>
                                            <span>{arrival.entry_point || 'Gate'}</span>
                                            {arrival.vehicle_plate_number && <span>{arrival.vehicle_plate_number.toUpperCase()}</span>}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Desktop: Two-col split, always shown on lg+ */}
                {arrivals.length > 0 && (
                    <section className="hidden lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-4">
                        {/* Left: needs confirmation */}
                        <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-950">Needs confirmation</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">Visitors your team should acknowledge.</p>
                                </div>
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                            </div>

                            {pendingArrivals.length === 0 ? (
                                <div className="mt-6 rounded-[1.5rem] bg-emerald-50 p-5 text-emerald-900 ring-1 ring-emerald-100">
                                    <p className="font-black">Nothing waiting.</p>
                                    <p className="mt-1 text-sm leading-6 font-semibold text-emerald-800">
                                        Every active arrival has been cleared or does not require confirmation.
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 space-y-3">
                                    {pendingArrivals.map((arrival) => {
                                        const overdue = arrival.confirmation_state === 'OVERDUE';
                                        const isConfirming = confirmingIds.includes(arrival.id);

                                        return (
                                            <article
                                                key={arrival.id}
                                                className={`rounded-[1.5rem] p-4 ring-1 ${
                                                    overdue ? 'bg-rose-50 ring-rose-200' : 'bg-amber-50 ring-amber-200'
                                                }`}
                                            >
                                                <div className="flex gap-3">
                                                    <div
                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                                                            overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                                        }`}
                                                    >
                                                        {initialsFor(arrival.visitor_name)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="truncate text-base font-black text-slate-950">
                                                                {arrival.visitor_name}
                                                            </h3>
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black ${
                                                                    overdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                                                }`}
                                                            >
                                                                {overdue && (
                                                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                                                                )}
                                                                {overdue ? 'Overdue' : 'Waiting'}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-sm font-bold text-slate-600">
                                                            {arrival.member?.category || arrival.admission_basis}
                                                        </p>
                                                        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                            <span>{detailLine(arrival)}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={isConfirming}
                                                    onClick={() => handleConfirm(arrival.id)}
                                                    className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-4 text-sm font-black text-white transition-opacity ${
                                                        isConfirming ? 'cursor-not-allowed opacity-60' : ''
                                                    }`}
                                                >
                                                    <Check className="h-4 w-4" />
                                                    {isConfirming ? 'Confirming...' : 'Confirm arrival'}
                                                </button>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Right: currently here */}
                        <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-950">Currently here</h2>
                                    <p className="mt-1 text-sm font-semibold text-slate-500">Confirmed and cleared arrivals.</p>
                                </div>
                                <Radio className="h-5 w-5 text-slate-400" />
                            </div>

                            <div className="mt-5 divide-y divide-slate-100">
                                {confirmedArrivals.length === 0 ? (
                                    <div className="rounded-[1.5rem] bg-slate-50 p-5">
                                        <p className="font-black text-slate-950">No cleared visitors yet.</p>
                                        <p className="mt-1 text-sm leading-6 font-semibold text-slate-500">
                                            Pending arrivals move here after confirmation.
                                        </p>
                                    </div>
                                ) : (
                                    confirmedArrivals.map((arrival) => (
                                        <article key={arrival.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf2ff] text-sm font-black text-[#0b4aa2]">
                                                {initialsFor(arrival.visitor_name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-base font-black text-slate-950">
                                                            {arrival.visitor_name}
                                                        </h3>
                                                        <p className="mt-1 text-sm font-bold text-slate-500">
                                                            {arrival.member?.name || arrival.admission_basis}
                                                        </p>
                                                    </div>
                                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                                                        <UserCheck className="h-3.5 w-3.5" />
                                                        Cleared
                                                    </span>
                                                </div>
                                                <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                                    <span className="inline-flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {arrival.verified_at_human || 'recently'}
                                                    </span>
                                                    <span>{arrival.entry_point || 'Gate'}</span>
                                                    {arrival.vehicle_plate_number && (
                                                        <span>{arrival.vehicle_plate_number.toUpperCase()}</span>
                                                    )}
                                                </p>
                                            </div>
                                        </article>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </OrganizationLayout>
    );
}
