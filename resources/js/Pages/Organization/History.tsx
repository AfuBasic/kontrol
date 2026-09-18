import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, DoorOpen, MapPin, Radio, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AccessHeader from '@/Components/Organization/AccessHeader';
import FilterChips from '@/Components/Organization/FilterChips';
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
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFilter, setDateFilter] = useState(filters.date ?? 'today');

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/org/arrivals/history', { search }, { preserveState: true, preserveScroll: true });
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
        <OrganizationLayout title="Access - History" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - History`} />

            <div className="flex flex-col gap-3.5 px-4 pt-1 pb-24 max-w-[480px] mx-auto">
                <AccessHeader activeTab="history" />

                <div className="flex flex-col gap-3">
                    {/* Native Search Field */}
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.5} />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search history..."
                            className="w-full rounded-full border border-slate-200/90 bg-white py-2.5 pr-4 pl-10 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#0b4aa2] focus:ring-1 focus:ring-[#0b4aa2] focus:outline-none"
                        />
                    </div>

                    <FilterChips
                        variant="status"
                        value={dateFilter}
                        onChange={(id) => {
                            if (id === 'more') {
                                // Normally opens filter sheet
                            } else {
                                setDateFilter(id);
                            }
                        }}
                        options={[
                            { id: 'today', label: 'Today' },
                            { id: 'week', label: 'This week' },
                            { id: 'more', label: 'More' },
                        ]}
                    />

                    {logs.data.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200/70 bg-white p-8 text-center">
                            <p className="text-sm font-bold text-slate-900">No matching visits found</p>
                            <p className="mt-1 text-sm text-slate-500">
                                {search ? `No visits matched "${search}".` : 'Once security logs arrivals, this page will show the timeline by day.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6 pb-6 px-1">
                            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
                                <div key={date} className="space-y-2">
                                    <h3 className="text-[12px] font-bold tracking-wider text-slate-500 uppercase px-1">{date}</h3>
                                    <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/60 shadow-[0_2px_12px_rgba(15,23,42,0.03)]">
                                        {dayLogs.map((log, index) => {
                                            return (
                                                <div
                                                    key={log.id}
                                                    className={`flex min-h-[64px] cursor-pointer flex-col justify-between gap-3 p-3.5 transition hover:bg-slate-50 active:bg-slate-100 sm:flex-row sm:items-center ${
                                                        index !== dayLogs.length - 1 ? 'border-b border-slate-100' : ''
                                                    }`}
                                                >
                                                    <div className="flex min-w-0 items-start gap-3.5">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold tracking-tight text-slate-600">
                                                            {initialsFor(log.visitor_name)}
                                                        </div>

                                                        <div className="min-w-0 flex-1 py-0.5">
                                                            <div className="truncate text-[15px] font-bold text-slate-900 leading-tight">{log.visitor_name}</div>
                                                            <p className="mt-0.5 truncate text-[13px] font-medium text-slate-500">
                                                                <span className="capitalize">{log.admission_basis}</span>
                                                            </p>
                                                            <p className="mt-0.5 truncate text-[12px] text-slate-400">
                                                                Entered {formatTime(log.verified_at)} {log.checked_out_at_human ? `· Left ${log.checked_out_at_human}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex shrink-0 items-center justify-end">
                                                        <ChevronRight className="h-4 w-4 text-slate-300 ml-2" strokeWidth={2.5} />
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
