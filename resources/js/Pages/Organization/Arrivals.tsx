import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Check, Clock, MapPin, Radio, Search, ShieldCheck, UserCheck, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AccessHeader from '@/Components/Organization/AccessHeader';
import FilterChips from '@/Components/Organization/FilterChips';
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

export default function Arrivals({ organization, arrivals, metrics, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState('all');
    const [confirmingIds, setConfirmingIds] = useState<number[]>([]);

    const hasPublicWindows = organization.access_policy === 'public_window';
    const pendingTotal = (metrics.pending_confirmation ?? 0) + (metrics.overdue_confirmation ?? 0);

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/org/arrivals', { search, status: status === 'all' ? undefined : status }, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search, status]);

    const handleConfirm = (id: number) => {
        setConfirmingIds((prev) => [...prev, id]);
        router.post(
            `/org/arrivals/${id}/confirm`,
            {},
            {
                onFinish: () => setConfirmingIds((prev) => prev.filter((i) => i !== id)),
            },
        );
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

    // Client side filter
    const displayArrivals = arrivals.filter((arrival) => {
        if (status === 'all') return true;
        if (status === 'needs_attention') return arrival.confirmation_state === 'OVERDUE' || arrival.confirmation_state === 'PENDING';
        if (status === 'cleared') return arrival.confirmation_state !== 'OVERDUE' && arrival.confirmation_state !== 'PENDING';
        return true;
    });

    return (
        <OrganizationLayout title="Access - Arrivals" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - Arrivals`} />

            <div className="space-y-4 pt-1 sm:pt-4">
                <AccessHeader
                    activeTab="arrivals"
                    pendingCount={pendingTotal}
                    activeCount={metrics.confirmed ?? 0}
                />

                {/* Directory with search, filters, and list */}
                <div className="space-y-4 pt-2">
                    {/* Native Search Field */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search arrivals..."
                            className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                        />
                    </div>

                    {/* Status Filters */}
                    <FilterChips
                        variant="status"
                        value={status}
                        onChange={(id) => {
                            if (id === 'more') {
                                // Normally opens a filter sheet, doing nothing for now
                            } else {
                                setStatus(id);
                            }
                        }}
                        options={[
                            { id: 'all', label: 'All' },
                            { id: 'cleared', label: 'Inside', color: 'mint', count: metrics.confirmed ?? 0 },
                            { id: 'needs_attention', label: 'Waiting', color: 'amber', count: pendingTotal },
                            { id: 'more', label: 'More' },
                        ]}
                    />

                    {/* Section Header */}
                    <div className="flex items-center justify-between px-1 pt-2 pb-2">
                        <h2 className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">
                            Current Arrivals ({displayArrivals.length})
                        </h2>
                    </div>

                    {/* Arrivals List: Card Rows */}
                    {displayArrivals.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                            <p className="text-sm font-bold text-slate-900">No matching arrivals found</p>
                            <p className="mt-1 text-sm text-slate-500">{search ? `No arrivals matched "${search}".` : 'No arrivals found.'}</p>
                        </div>
                    ) : (
                        <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                            {displayArrivals.map((arrival, index) => {
                                const overdue = arrival.confirmation_state === 'OVERDUE';
                                const pending = arrival.confirmation_state === 'PENDING';
                                const needsAttention = overdue || pending;
                                const isConfirming = confirmingIds.includes(arrival.id);

                                return (
                                    <div
                                        key={arrival.id}
                                        className={`flex flex-col justify-between gap-3 p-3.5 transition hover:bg-slate-50 active:bg-slate-100 sm:flex-row sm:items-center ${needsAttention ? 'bg-amber-50/10' : ''} ${
                                            index !== displayArrivals.length - 1 ? 'border-b border-slate-100' : ''
                                        }`}
                                    >
                                        <div className="flex min-w-0 items-start gap-3.5">
                                            {/* Avatar */}
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold tracking-tight text-slate-600">
                                                {initialsFor(arrival.visitor_name)}
                                            </div>

                                            {/* Identity */}
                                            <div className="min-w-0 flex-1 py-0.5">
                                                <div className="truncate text-[15px] font-bold text-slate-900 leading-tight">{arrival.visitor_name}</div>
                                                <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                                                    <span className={needsAttention ? 'text-amber-600 font-semibold' : 'text-emerald-600 font-semibold'}>{needsAttention ? 'Waiting' : 'Inside'}</span>
                                                    {' · '}
                                                    <span>{arrival.entry_point || 'North Gate'}</span>
                                                </p>
                                                <p className="mt-0.5 truncate text-[12px] text-slate-400">
                                                    {needsAttention ? (overdue ? 'Overdue' : 'Waiting for confirmation') : `Arrived ${arrival.verified_at_human || 'recently'}`}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column: Actions / Status */}
                                        <div className="flex shrink-0 items-center justify-end">
                                            {needsAttention && (
                                                <button
                                                    type="button"
                                                    disabled={isConfirming}
                                                    onClick={() => handleConfirm(arrival.id)}
                                                    className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-bold text-white transition-opacity ${
                                                        isConfirming ? 'cursor-not-allowed opacity-60' : ''
                                                    }`}
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                    {isConfirming ? 'Confirming...' : 'Confirm'}
                                                </button>
                                            )}
                                            {!needsAttention && <ChevronRight className="h-4 w-4 text-slate-300 ml-2" strokeWidth={2.5} />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
