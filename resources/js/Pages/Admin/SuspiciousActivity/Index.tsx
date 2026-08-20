import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { Search, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import * as SuspiciousActivityController from '@/actions/App/Http/Controllers/Admin/SuspiciousActivityController';
import EmptyState from '@/Components/States/EmptyState';
import MobileSheet from '@/Components/MobileSheet';

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

    const rows = events.data ?? [];
    const isEmpty = rows.length === 0;

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

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Event filters">
                        {attentionFilters.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => visit({ attention: filter.value, search })}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    (filters.attention || 'all') === filter.value
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <form
                        className="relative w-full max-w-sm"
                        onSubmit={(event) => {
                            event.preventDefault();
                            visit({ search, attention: filters.attention });
                        }}
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                        <label className="sr-only" htmlFor="security-search">
                            Search by name or email
                        </label>
                        <input
                            id="security-search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search name or email"
                            className="h-11 w-full rounded-2xl border border-slate-200 bg-white pr-4 pl-10 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </form>
                </div>

                {isEmpty ? (
                    <div className="rounded-3xl border border-slate-200 bg-white">
                        <EmptyState
                            icon={Shield}
                            title="No suspicious activity"
                            description="There are no security events requiring your attention right now."
                        />
                    </div>
                ) : (
                    <>
                        <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white md:block">
                            <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Event</th>
                                        <th className="px-5 py-3">Person</th>
                                        <th className="px-5 py-3">Severity</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Device</th>
                                        <th className="px-5 py-3">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((event) => (
                                        <tr key={event.id} className="hover:bg-slate-50/80">
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={SuspiciousActivityController.index.url({
                                                        query: { ...filters, event: event.id },
                                                    })}
                                                    className="font-semibold text-slate-900 hover:text-indigo-700"
                                                >
                                                    {event.type_label}
                                                </Link>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">{event.person_name}</td>
                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityClass(event.severity)}`}>
                                                    {event.severity_label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">{event.status_label}</td>
                                            <td className="px-5 py-4 text-slate-600">{event.device ?? '-'}</td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {event.detected_at ? formatDistanceToNow(new Date(event.detected_at), { addSuffix: true }) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <ul className="space-y-3 md:hidden">
                            {rows.map((event) => (
                                <li key={event.id}>
                                    <Link
                                        href={SuspiciousActivityController.index.url({
                                            query: { ...filters, event: event.id },
                                        })}
                                        className="block rounded-3xl border border-slate-200 bg-white p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{event.type_label}</p>
                                                <p className="mt-1 text-xs text-slate-500">{event.person_name}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${severityClass(event.severity)}`}>
                                                {event.severity_label}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-xs text-slate-500">
                                            {event.status_label}
                                            {event.device ? ` · ${event.device}` : ''}
                                            {event.detected_at
                                                ? ` · ${formatDistanceToNow(new Date(event.detected_at), { addSuffix: true })}`
                                                : ''}
                                        </p>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </>
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
