import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, DoorOpen, MapPin, Radio, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AccessHeader from '@/Components/Organization/AccessHeader';
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

export default function ArrivalHistory({ organization, logs, filters }: Props) {
    const hasPublicWindows = organization.access_policy === 'public_window';
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/org/history', { search }, { preserveState: true, preserveScroll: true });
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search]);

    const formatDay = (isoString: string | null) => {
        if (!isoString) {
            return 'Earlier';
        }

        return new Date(isoString).toLocaleDateString('en-NG', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) {
            return 'Time unknown';
        }

        return new Date(isoString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const groupedLogs = logs.data.reduce<Record<string, Log[]>>((groups, log) => {
        const key = formatDay(log.verified_at);
        groups[key] = groups[key] || [];
        groups[key].push(log);

        return groups;
    }, {});

    const initialsFor = (name: string) =>
        name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();

    return (
        <OrganizationLayout title="Access - History" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - History`} />

            <div className="space-y-4 pt-1 sm:pt-4">
                <AccessHeader activeTab="history" hasPublicWindows={hasPublicWindows} />

                <div className="space-y-4 pt-2">
                    {/* Native Search Field */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search access history..."
                            className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                        />
                    </div>

                    <div className="px-1 pt-2 pb-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                        {logs.total} {logs.total === 1 ? 'RECORDED VISIT' : 'RECORDED VISITS'}
                    </div>

                    {logs.data.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                            <p className="text-sm font-bold text-slate-900">No matching visits found</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {search ? `No visits matched "${search}".` : 'Once security logs arrivals, this page will show the timeline by day.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                                <div key={date} className="space-y-3">
                                    <h3 className="px-1 text-[13px] font-bold text-slate-900">{date}</h3>
                                    <div className="space-y-3">
                                        {dayLogs.map((log) => {
                                            const isHere = !log.checked_out_at;
                                            const confirmed = Boolean(log.confirmed_at);

                                            return (
                                                <div
                                                    key={log.id}
                                                    className="flex flex-col justify-between gap-4 rounded-2xl bg-white px-4 py-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/5 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                                                >
                                                    <div className="flex min-w-0 items-start gap-4">
                                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f1f5f9] text-base font-bold tracking-tight text-slate-700">
                                                            {initialsFor(log.visitor_name)}
                                                        </div>

                                                        <div className="min-w-0 flex-1 pt-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <div className="truncate text-base font-bold text-slate-900">{log.visitor_name}</div>
                                                                {log.tag && (
                                                                    <span className="inline-flex shrink-0 items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                                                                        {log.tag}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                                                                <span className="capitalize">{log.admission_basis}</span>
                                                                {' · '}
                                                                {formatTime(log.verified_at)}
                                                            </p>
                                                            <div className="mt-1 flex items-center gap-1 text-[13px] text-slate-400">
                                                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                                <span className="truncate">
                                                                    {log.entry_point || 'Gate'}{' '}
                                                                    {log.vehicle_plate_number ? ` (${log.vehicle_plate_number.toUpperCase()})` : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 flex-col items-start justify-center gap-2 self-stretch py-0.5 sm:items-end">
                                                        <span
                                                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${isHere ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                                        >
                                                            {isHere ? <Radio className="h-3 w-3" /> : <DoorOpen className="h-3 w-3" />}
                                                            {isHere ? 'Here now' : `Left ${log.checked_out_at_human || ''}`}
                                                        </span>

                                                        {confirmed && (
                                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#eaf2ff] px-2 py-0.5 text-[11px] font-bold text-[#0b4aa2]">
                                                                <CheckCircle2 className="h-3 w-3" />
                                                                Confirmed
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {logs.last_page > 1 && (
                                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
                                    <p className="text-xs font-semibold text-slate-500">
                                        Page {logs.current_page} of {logs.last_page} ({logs.total} total visits)
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {logs.links[0]?.url ? (
                                            <Link
                                                href={logs.links[0].url}
                                                preserveScroll
                                                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-slate-50"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                                <span>Previous</span>
                                            </Link>
                                        ) : (
                                            <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-2xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-300 ring-1 ring-slate-100">
                                                <ChevronLeft className="h-4 w-4" />
                                                <span>Previous</span>
                                            </span>
                                        )}

                                        {logs.links[logs.links.length - 1]?.url ? (
                                            <Link
                                                href={logs.links[logs.links.length - 1].url!}
                                                preserveScroll
                                                className="inline-flex items-center gap-1.5 rounded-2xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200/80 transition hover:bg-slate-50"
                                            >
                                                <span>Next</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-2xl bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-300 ring-1 ring-slate-100">
                                                <span>Next</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
