import { Head, router } from '@inertiajs/react';
import { Search, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AccessHeader from '@/Components/Organization/AccessHeader';
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
    verified_by: { id: number; name: string } | null;
    member: {
        id: number;
        name: string;
        identifier: string | null;
        category: string;
    } | null;
}

interface Metrics {
    currently_inside: number;
}

interface Props {
    organization: {
        id: number;
        name: string;
        estate_name?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    onSiteVisitors: Arrival[];
    metrics: Metrics;
    filters: {
        search?: string;
        admission_basis?: string;
    };
}

export default function OnSite({ organization, onSiteVisitors, metrics, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/org/on-site', { search: search || undefined }, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const initialsFor = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();

    // Client side filter
    const displayVisitors = onSiteVisitors || [];

    return (
        <OrganizationLayout title="Access - On-site" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - On-site Visitors`} />

            <div className="flex flex-col gap-3.5 px-4 pt-1 pb-24 max-w-[480px] mx-auto">
                <AccessHeader
                    activeTab="on_site"
                    activeCount={metrics.currently_inside ?? onSiteVisitors.length}
                />

                {/* Directory with search, filters, and list */}
                <div className="flex flex-col gap-3">
                    {/* Native Search Field */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search on-site visitors..."
                            className="w-full rounded-full border border-slate-200/90 bg-white py-2 pr-4 pl-10 text-xs !text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                        />
                    </div>

                    {/* Section Header */}
                    <div className="flex items-center justify-between px-1 pt-2 pb-2">
                        <h2 className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">
                            Currently On-site ({displayVisitors.length})
                        </h2>
                    </div>

                    {/* On-site List: Card Rows */}
                    {displayVisitors.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                            <p className="text-sm font-bold text-slate-900">No visitors currently on-site</p>
                            <p className="mt-1 text-sm text-slate-500">{search ? `No active visitors matched "${search}".` : 'There are no active visitors on-site right now.'}</p>
                        </div>
                    ) : (
                        <div className="mb-6 overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                            {displayVisitors.map((arrival, index) => {
                                return (
                                    <div
                                        key={arrival.id}
                                        className={`flex flex-col justify-between gap-3 p-3.5 transition hover:bg-slate-50 active:bg-slate-100 sm:flex-row sm:items-center ${
                                            index !== displayVisitors.length - 1 ? 'border-b border-slate-100' : ''
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
                                                    <span className="text-emerald-600 font-semibold">On-site</span>
                                                    {' · '}
                                                    <span>{arrival.entry_point || 'Gate'}</span>
                                                    {arrival.vehicle_plate_number ? ` · ${arrival.vehicle_plate_number.toUpperCase()}` : ''}
                                                </p>
                                                <p className="mt-0.5 truncate text-[12px] text-slate-400">
                                                    {arrival.verified_at_human ? `Entered ${arrival.verified_at_human}` : 'Entered recently'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="flex shrink-0 items-center justify-end">
                                            <ChevronRight className="h-4 w-4 text-slate-300 ml-2" strokeWidth={2.5} />
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
