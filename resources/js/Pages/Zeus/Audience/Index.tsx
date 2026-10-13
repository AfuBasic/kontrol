import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { index } from '@/actions/App/Http/Controllers/Zeus/AudienceController';
import ActivityChart from '@/Components/Zeus/Audience/ActivityChart';
import EstateHighlights from '@/Components/Zeus/Audience/EstateHighlights';
import EstatesTable, { EstatesFooter } from '@/Components/Zeus/Audience/EstatesTable';
import { changeSentence } from '@/Components/Zeus/Audience/groups';
import OnlinePanel from '@/Components/Zeus/Audience/OnlinePanel';
import PlatformSplit from '@/Components/Zeus/Audience/PlatformSplit';
import RolesPanel from '@/Components/Zeus/Audience/RolesPanel';
import type { EstateRow, Overview, Paginated, Range } from '@/Components/Zeus/Audience/types';
import VersionsPanel from '@/Components/Zeus/Audience/VersionsPanel';
import HealthBar from '@/Components/Zeus/JobHistory/HealthBar';
import LiveButton from '@/Components/Zeus/LiveButton';
import StatTile from '@/Components/Zeus/StatTile';
import TabBar from '@/Components/Zeus/TabBar';
import useLiveReload from '@/Hooks/useLiveReload';
import ZeusLayout from '@/Layouts/ZeusLayout';

type Tab = 'overview' | 'estates' | 'online';
type Sort = 'active' | 'rate' | 'members' | 'app';
type Filters = { range: Range; tab: Tab; search: string | null; sort: Sort; per_page: number };

type Props = {
    filters: Filters;
    overview: Overview;
    /** Only sent on the "Estates" tab. */
    estates: Paginated<EstateRow> | null;
};

const RANGES: Array<{ value: Range; label: string }> = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
];
const PERIOD: Record<Range, string> = { '7d': '7 days', '30d': '30 days', '90d': '90 days' };
const SORTS: Array<{ value: Sort; label: string }> = [
    { value: 'active', label: 'Most people active' },
    { value: 'rate', label: 'Highest active share' },
    { value: 'members', label: 'Most members' },
    { value: 'app', label: 'Most app users' },
];

export default function AudienceIndex({ filters, overview, estates }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const summary = overview.summary;

    function visit(changes: Partial<Filters>) {
        const next = { ...filters, ...changes };
        router.get(
            index.url(),
            {
                ...(next.range !== '30d' ? { range: next.range } : {}),
                ...(next.tab !== 'overview' ? { tab: next.tab } : {}),
                ...(next.search ? { search: next.search } : {}),
                ...(next.sort !== 'active' ? { sort: next.sort } : {}),
                ...(next.per_page !== 25 ? { per_page: next.per_page } : {}),
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    // Search as you type, once typing pauses.
    const firstRun = useRef(true);
    useEffect(() => {
        if (firstRun.current) {
            firstRun.current = false;
            return;
        }
        const handle = window.setTimeout(() => {
            if ((filters.search ?? '') !== search.trim()) visit({ search: search.trim() || null });
        }, 350);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    // Live refresh: just the figures. Counting people moves slowly, so every ten seconds is plenty.
    const { live, toggle: toggleLive } = useLiveReload({ storageKey: 'zeus.audience.live', only: ['overview'], intervalMs: 10_000 });

    const period = PERIOD[overview.range];
    const trackingNote =
        overview.tracking_since &&
        new Date(`${overview.tracking_since}T00:00:00`).getTime() > Date.now() - Number(overview.range.replace('d', '')) * 86_400_000
            ? `Tracking began ${new Date(`${overview.tracking_since}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, so earlier days are empty.`
            : null;

    return (
        <ZeusLayout>
            <Head title="Audience" />

            <div className="mx-auto max-w-6xl space-y-6 pb-24">
                <div className="flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">Audience</h1>
                        <p className="mt-2 max-w-2xl text-base text-slate-500 dark:text-slate-400">
                            Who uses Kontrol, and on what: the Android and iOS apps, the installed web app, and browsers.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div role="group" aria-label="Time range" className="inline-flex rounded-lg border border-slate-700 bg-slate-800/40 p-0.5">
                            {RANGES.map((range) => (
                                <button
                                    key={range.value}
                                    type="button"
                                    aria-pressed={filters.range === range.value}
                                    onClick={() => visit({ range: range.value })}
                                    className={`min-h-9 rounded-md px-3 text-sm font-semibold transition ${filters.range === range.value ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {range.label}
                                </button>
                            ))}
                        </div>
                        <LiveButton live={live} onToggle={toggleLive} generatedAt={overview.generated_at} />
                    </div>
                </div>

                <HealthBar health={overview.health} />

                <div className="grid grid-cols-4 gap-4">
                    <StatTile
                        label="Online now"
                        value={summary.online_now === null ? '—' : summary.online_now.toLocaleString()}
                        tone={summary.online_now ? 'text-emerald-300' : 'text-slate-300'}
                        sub={summary.online_now === null ? 'Sessions are not in the database' : 'Active in the last 5 minutes'}
                    />
                    <StatTile
                        label="Active today"
                        value={summary.today.toLocaleString()}
                        sub={`Yesterday ${summary.yesterday.toLocaleString()}${summary.stickiness !== null ? ` · ${summary.stickiness}% of the month` : ''}`}
                    />
                    <StatTile
                        label={`Active in ${period}`}
                        value={summary.in_range.toLocaleString()}
                        tone="text-white"
                        sub={changeSentence(summary.in_range, summary.previous_range, period)}
                    />
                    <StatTile
                        label="On the app"
                        value={summary.app_share === null ? '—' : `${summary.app_share}%`}
                        tone="text-sky-300"
                        sub={`${summary.app_users.toLocaleString()} of ${summary.in_range.toLocaleString()} active people`}
                    />
                </div>

                <TabBar
                    label="Audience sections"
                    active={filters.tab}
                    onChange={(tab) => visit({ tab })}
                    tabs={[
                        { id: 'overview', label: 'Overview' },
                        { id: 'estates', label: 'Estates' },
                        { id: 'online', label: 'Online now', badge: summary.online_now },
                    ]}
                />

                {filters.tab === 'overview' && (
                    <>
                        {trackingNote && (
                            <p className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-sm text-slate-400">{trackingNote}</p>
                        )}

                        <div className="grid grid-cols-3 items-start gap-4">
                            <div className="col-span-2">
                                <ActivityChart series={overview.series} range={overview.range} />
                            </div>
                            <PlatformSplit platforms={overview.platforms} summary={summary} />
                        </div>

                        <div className="grid grid-cols-2 items-start gap-4">
                            <VersionsPanel versions={overview.versions} />
                            <RolesPanel roles={overview.roles} />
                        </div>

                        <EstateHighlights
                            busiest={overview.estates.busiest}
                            quietest={overview.estates.quietest}
                            onOpenAll={() => visit({ tab: 'estates' })}
                        />
                    </>
                )}

                {filters.tab === 'estates' && estates && (
                    <section aria-label="Estates">
                        <div className="mb-4 flex flex-wrap items-center gap-3">
                            <h2 className="mr-2 text-lg font-bold text-white">Every estate</h2>
                            <div className="relative min-w-60 flex-1 sm:max-w-xs">
                                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-500" />
                                <label htmlFor="estate-search" className="sr-only">
                                    Search estates
                                </label>
                                <input
                                    id="estate-search"
                                    type="search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search estates"
                                    className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-800/40 py-2 pr-3.5 pl-10 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                                />
                            </div>
                            <label htmlFor="estate-sort" className="sr-only">
                                Sort estates
                            </label>
                            <select
                                id="estate-sort"
                                value={filters.sort}
                                onChange={(e) => visit({ sort: e.target.value as Sort })}
                                className="min-h-10 min-w-48 rounded-lg border border-slate-700 bg-slate-800/40 px-3.5 text-sm text-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                            >
                                {SORTS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="ml-auto text-xs text-slate-500">Active means seen in the last {period}.</p>
                        </div>

                        <EstatesTable estates={estates} narrowed={Boolean(filters.search)} />
                        <EstatesFooter estates={estates} />
                    </section>
                )}

                {filters.tab === 'online' && <OnlinePanel online={overview.online} />}
            </div>
        </ZeusLayout>
    );
}
