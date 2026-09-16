import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, DoorOpen, MapPin, Radio } from 'lucide-react';
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

export default function ArrivalHistory({ organization, logs }: Props) {
    const hasPublicWindows = organization.access_policy === 'public_window';

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

    return (
        <OrganizationLayout title="Access - History" contentClassName="max-w-[86rem]">
            <Head title={`${organization.name} - History`} />

            <div className="space-y-5 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
                <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-black text-[#0b4aa2]">Arrival history</p>
                            <h1 className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-4xl">Movement record for {organization.name}</h1>
                            <p className="mt-3 text-sm leading-6 font-semibold text-slate-500 sm:text-base">
                                Review completed and active visits as a chronological ledger, not a raw audit table.
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] bg-[#0f172a] p-4 text-white lg:min-w-48">
                            <p className="text-3xl font-black">{logs.total}</p>
                            <p className="mt-1 text-xs font-bold text-slate-300">Recorded visits</p>
                        </div>
                    </div>

                    <div className="mt-6">
                        <AccessTabs activeTab="history" hasPublicWindows={hasPublicWindows} />
                    </div>
                </section>

                {logs.data.length === 0 ? (
                    <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-8">
                        <div className="flex max-w-2xl gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight text-slate-950">No visits recorded yet.</h2>
                                <p className="mt-3 text-sm leading-6 font-semibold text-slate-500">
                                    Once security logs arrivals for your organization, this page will show the timeline by day.
                                </p>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                        <div className="space-y-8">
                            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                                <div key={date}>
                                    {/* Mobile: date as inline heading */}
                                    <div className="mb-3 flex items-center gap-3 lg:hidden">
                                        <p className="text-sm font-black text-slate-950">{date}</p>
                                        <span className="h-px flex-1 bg-slate-100" />
                                        <p className="text-xs font-bold text-slate-400">
                                            {dayLogs.length} {dayLogs.length === 1 ? 'visit' : 'visits'}
                                        </p>
                                    </div>

                                    {/* Desktop: date in left column */}
                                    <div className="hidden gap-4 lg:grid lg:grid-cols-[12rem_minmax(0,1fr)]">
                                        <div>
                                            <div className="sticky top-24 rounded-[1.35rem] bg-slate-50 p-4 ring-1 ring-slate-100">
                                                <p className="text-sm font-black text-slate-950">{date}</p>
                                                <p className="mt-1 text-xs font-bold text-slate-500">
                                                    {dayLogs.length} {dayLogs.length === 1 ? 'visit' : 'visits'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {dayLogs.map((log) => {
                                                const isHere = !log.checked_out_at;
                                                const confirmed = Boolean(log.confirmed_at);

                                                return (
                                                    <article
                                                        key={log.id}
                                                        className="grid gap-3 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-100 sm:grid-cols-[5.5rem_minmax(0,1fr)_auto] sm:items-center"
                                                    >
                                                        <time className="text-sm font-black text-slate-500">{formatTime(log.verified_at)}</time>

                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h2 className="truncate text-base font-black text-slate-950">{log.visitor_name}</h2>
                                                                {log.tag && (
                                                                    <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                                                                        {log.tag}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                                                <span className="inline-flex items-center gap-1">
                                                                    <MapPin className="h-3.5 w-3.5" />
                                                                    {log.entry_point || 'Gate'}
                                                                </span>
                                                                <span>{log.admission_basis}</span>
                                                                {log.vehicle_plate_number && <span>{log.vehicle_plate_number.toUpperCase()}</span>}
                                                            </p>
                                                        </div>

                                                        <div className="flex flex-wrap gap-2 sm:justify-end">
                                                            <span
                                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                                    isHere ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
                                                                }`}
                                                            >
                                                                {isHere ? <Radio className="h-3.5 w-3.5" /> : <DoorOpen className="h-3.5 w-3.5" />}
                                                                {isHere ? 'Here now' : `Left ${log.checked_out_at_human || ''}`}
                                                            </span>
                                                            {confirmed && (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[11px] font-black text-[#0b4aa2]">
                                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    Confirmed
                                                                </span>
                                                            )}
                                                        </div>
                                                    </article>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Mobile: inline log entries */}
                                    <div className="space-y-3 lg:hidden">
                                        {dayLogs.map((log) => {
                                            const isHere = !log.checked_out_at;
                                            const confirmed = Boolean(log.confirmed_at);

                                            return (
                                                <article
                                                    key={log.id}
                                                    className="rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-100"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h2 className="truncate text-base font-black text-slate-950">{log.visitor_name}</h2>
                                                                {log.tag && (
                                                                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-slate-500 ring-1 ring-slate-200">
                                                                        {log.tag}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                                                                <time>{formatTime(log.verified_at)}</time>
                                                                <span className="inline-flex items-center gap-1">
                                                                    <MapPin className="h-3.5 w-3.5" />
                                                                    {log.entry_point || 'Gate'}
                                                                </span>
                                                                {log.vehicle_plate_number && <span>{log.vehicle_plate_number.toUpperCase()}</span>}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ${
                                                                isHere ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200/70 text-slate-600'
                                                            }`}
                                                        >
                                                            {isHere ? <Radio className="h-3.5 w-3.5" /> : <DoorOpen className="h-3.5 w-3.5" />}
                                                            {isHere ? 'Here' : 'Left'}
                                                        </span>
                                                    </div>
                                                    {confirmed && (
                                                        <div className="mt-2.5 flex">
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[11px] font-black text-[#0b4aa2]">
                                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                                Confirmed
                                                            </span>
                                                        </div>
                                                    )}
                                                </article>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

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
                                            href={logs.links[logs.links.length - 1].url}
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
                    </section>
                )}
            </div>
        </OrganizationLayout>
    );
}
