import { Head, Link, router } from '@inertiajs/react';
import { format, isToday, isYesterday } from 'date-fns';
import { ChevronRight, Shield } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import * as SuspiciousActivityController from '@/actions/App/Http/Controllers/Admin/SuspiciousActivityController';
import EmptyState from '@/Components/States/EmptyState';
import MobileSheet from '@/Components/MobileSheet';
import FilterBar, { FilterChips } from '@/Components/UI/FilterBar';

type EventRow = {
    id: string;
    type_label: string;
    person_name: string | null;
    severity: 'info' | 'elevated' | 'high';
    severity_label: string;
    status: string;
    status_label: string;
    device: string | null;
    detected_at: string | null;
    requires_attention: boolean;
};

type EventDetails = {
    id: string;
    type_label: string;
    person: { name: string; email: string };
    severity: string;
    severity_label: string;
    status: string;
    status_label: string;
    device: string | null;
    approximate_location: string | null;
    detected_at: string | null;
    resolved_at: string | null;
    resolution: string | null;
    reviewed_at: string | null;
    timeline: { at: string | null; label: string }[];
};

type Paginator = {
    data: EventRow[];
    links?: Array<{ url: string | null; label: string; active: boolean }>;
    current_page?: number;
    last_page?: number;
    total?: number;
};

type Props = {
    events: Paginator;
    filters: {
        search: string;
        attention: string;
    };
    selected: EventDetails | null;
};

const attentionFilters = [
    { value: 'all', label: 'All events' },
    { value: 'attention', label: 'Requires attention' },
    { value: 'high', label: 'High risk' },
    { value: 'resolved', label: 'Resolved' },
];

function severityRail(severity: string): string {
    if (severity === 'high') {
        return 'bg-rose-500';
    }
    if (severity === 'elevated') {
        return 'bg-amber-400';
    }
    return 'bg-slate-300';
}

function dayLabel(iso: string | null): string {
    if (!iso) {
        return 'Undated';
    }
    const date = new Date(iso);

    if (isToday(date)) {
        return 'Today';
    }
    if (isYesterday(date)) {
        return 'Yesterday';
    }

    return format(date, 'EEE, d MMM yyyy');
}

function severityClass(severity: string): string {
    if (severity === 'high') {
        return 'bg-rose-50 text-rose-800';
    }
    if (severity === 'elevated') {
        return 'bg-amber-50 text-amber-800';
    }
    return 'bg-slate-100 text-slate-700';
}

export default function SuspiciousActivityIndex({ events, filters, selected }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const visit = (next: Record<string, string | undefined>) => {
        router.get(
            SuspiciousActivityController.index.url(),
            {
                search: next.search ?? search,
                attention: next.attention ?? filters.attention,
                event: next.event,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const closeDetails = () => visit({ event: undefined, search, attention: filters.attention });

    useEffect(() => {
        if (search === (filters.search ?? '')) {
            return;
        }
        const timer = setTimeout(() => visit({ search }), 350);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const rows = useMemo(() => events.data ?? [], [events.data]);
    const isEmpty = rows.length === 0;

    const groups = useMemo(() => {
        const map = new Map<string, EventRow[]>();
        rows.forEach((row) => {
            const label = dayLabel(row.detected_at);
            map.set(label, [...(map.get(label) ?? []), row]);
        });

        return [...map.entries()].map(([label, items]) => ({ label, rows: items }));
    }, [rows]);

    const links = events.links ?? [];
    const prevUrl = links.length > 2 ? links[0].url : null;
    const nextUrl = links.length > 2 ? links[links.length - 1].url : null;

    const selectedTitle = useMemo(() => selected?.type_label ?? 'Event', [selected]);

    return (
        <>
            <Head title="Suspicious Activity" />

            <div className="mx-auto max-w-6xl space-y-6 pb-16">
                <header className="space-y-2">
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Estate security</p>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Suspicious activity</h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
                        Review security-relevant sign-in behavior for people in this estate. Device approval stays with the account owner.
                    </p>
                </header>

                <FilterBar
                    search={search}
                    onSearch={setSearch}
                    placeholder="Search by name or email"
                    searchLabel="Search events by name or email"
                    activeCount={(filters.attention || 'all') !== 'all' ? 1 : 0}
                    hasActive={Boolean(search) || (filters.attention || 'all') !== 'all'}
                    onReset={() => {
                        setSearch('');
                        visit({ search: '', attention: 'all' });
                    }}
                >
                    <FilterChips
                        label="Show"
                        value={filters.attention || 'all'}
                        onChange={(attention) => visit({ attention, search })}
                        options={attentionFilters}
                    />
                </FilterBar>

                {isEmpty ? (
                    <div className="rounded-2xl border border-slate-100 bg-white">
                        <EmptyState
                            icon={Shield}
                            title="No suspicious activity"
                            description="There are no security events requiring your attention right now."
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {groups.map((group) => (
                            <section key={group.label} aria-label={group.label}>
                                <h2 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-black tracking-widest text-slate-500 uppercase">
                                    {group.label}
                                    <span className="font-semibold text-slate-400">{group.rows.length}</span>
                                </h2>
                                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xs">
                                    {group.rows.map((event) => (
                                        <li key={event.id}>
                                            <Link
                                                href={SuspiciousActivityController.index.url({
                                                    query: { ...filters, event: event.id },
                                                })}
                                                className={`group relative flex items-center gap-3 py-3.5 pr-4 pl-5 transition hover:bg-slate-50 ${
                                                    event.requires_attention ? 'bg-amber-50/30' : ''
                                                }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`absolute inset-y-0 left-0 w-1 ${severityRail(event.severity)} ${
                                                        event.requires_attention ? '' : 'opacity-40'
                                                    }`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p
                                                        className={`truncate text-sm ${
                                                            event.requires_attention ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'
                                                        }`}
                                                    >
                                                        {event.type_label}
                                                    </p>
                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {[event.person_name, event.device].filter(Boolean).join(' · ') || 'Unknown'}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 flex-col items-end gap-1">
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityClass(event.severity)}`}
                                                    >
                                                        {event.severity_label}
                                                    </span>
                                                    <span className="text-[11px] text-slate-500">
                                                        {event.status_label}
                                                        {event.detected_at ? ` · ${format(new Date(event.detected_at), 'h:mm a')}` : ''}
                                                    </span>
                                                </div>
                                                <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-500 sm:block" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}

                        {(prevUrl || nextUrl) && (
                            <nav className="flex items-center justify-between" aria-label="Pagination">
                                {prevUrl ? (
                                    <Link href={prevUrl} preserveScroll className="text-sm font-bold text-slate-700 hover:text-slate-900">
                                        ← Newer
                                    </Link>
                                ) : (
                                    <span />
                                )}
                                <span className="text-xs text-slate-500">
                                    Page {events.current_page} of {events.last_page}
                                </span>
                                {nextUrl ? (
                                    <Link href={nextUrl} preserveScroll className="text-sm font-bold text-slate-700 hover:text-slate-900">
                                        Older →
                                    </Link>
                                ) : (
                                    <span />
                                )}
                            </nav>
                        )}
                    </div>
                )}
            </div>

            <MobileSheet isOpen={selected !== null} onClose={closeDetails} title={selectedTitle}>
                {selected && (
                    <div className="space-y-5 px-1 pb-8">
                        <div>
                            <p className="text-lg font-semibold text-slate-900">{selected.person.name}</p>
                            <p className="text-sm text-slate-500">{selected.person.email}</p>
                        </div>
                        <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Status</dt>
                                <dd className="mt-1 text-slate-900">{selected.status_label}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Severity</dt>
                                <dd className="mt-1 text-slate-900">{selected.severity_label}</dd>
                            </div>
                            <div className="col-span-2">
                                <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Device</dt>
                                <dd className="mt-1 text-slate-900">{selected.device ?? 'Unknown device'}</dd>
                            </div>
                            {selected.approximate_location && (
                                <div className="col-span-2">
                                    <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Approximate location</dt>
                                    <dd className="mt-1 text-slate-900">{selected.approximate_location}</dd>
                                </div>
                            )}
                        </dl>
                        <div>
                            <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Timeline</h3>
                            <ol className="mt-3 space-y-3">
                                {selected.timeline.map((entry, index) => (
                                    <li key={`${entry.at}-${index}`} className="text-sm">
                                        <p className="font-medium text-slate-900">{entry.label}</p>
                                        {entry.at && (
                                            <p className="text-xs text-slate-500">
                                                {new Date(entry.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </div>
                        {selected.resolution && (
                            <div>
                                <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Resolution</h3>
                                <p className="mt-1 text-sm text-slate-700">{selected.resolution}</p>
                            </div>
                        )}
                        {!selected.reviewed_at && (
                            <Link
                                href={SuspiciousActivityController.review.url(selected.id)}
                                method="post"
                                as="button"
                                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700"
                            >
                                Mark as reviewed
                            </Link>
                        )}
                    </div>
                )}
            </MobileSheet>
        </>
    );
}
