import { Link } from '@inertiajs/react';
import type { EstateRow, Paginated } from './types';

const COLUMNS = 'grid-cols-[minmax(0,1.4fr)_100px_100px_110px_110px]';

/** Every estate with how much of its membership is active, so a quiet one can be spotted and followed up. */
export default function EstatesTable({ estates, narrowed }: { estates: Paginated<EstateRow>; narrowed: boolean }) {
    if (estates.data.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
                <p className="text-base font-semibold text-white">{narrowed ? 'No estates match that search' : 'No estates with members yet'}</p>
                <p className="mt-1 text-sm text-slate-400">
                    {narrowed ? 'Try a different word, or clear the search.' : 'Estates appear here once they have accepted members.'}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800/60 bg-[#0f1423]">
            <div
                className={`grid items-center gap-4 border-b border-slate-800/70 bg-black/10 px-5 py-3 text-[11px] font-bold tracking-widest text-slate-500 uppercase ${COLUMNS}`}
            >
                <span>Estate</span>
                <span className="text-right">Members</span>
                <span className="text-right">Active</span>
                <span className="text-right">Active share</span>
                <span className="text-right">On the app</span>
            </div>

            {estates.data.map((estate) => (
                <div key={estate.id} className={`grid items-center gap-4 border-b border-slate-800/60 px-5 py-3.5 last:border-b-0 ${COLUMNS}`}>
                    <p className="truncate text-sm font-semibold text-white" title={estate.name}>
                        {estate.name}
                    </p>
                    <p className="text-right text-sm text-slate-300 tabular-nums">{estate.members.toLocaleString()}</p>
                    <p className="text-right text-sm text-slate-300 tabular-nums">{estate.active.toLocaleString()}</p>
                    <div className="text-right">
                        <p
                            className={`text-sm font-bold tabular-nums ${estate.rate < 25 && estate.members >= 5 ? 'text-rose-300' : 'text-slate-200'}`}
                        >
                            {estate.rate}%
                        </p>
                        <span className="mt-1 ml-auto block h-1 w-16 overflow-hidden rounded-full bg-slate-800">
                            <span className="block h-full rounded-full bg-primary-400" style={{ width: `${Math.min(100, estate.rate)}%` }} />
                        </span>
                    </div>
                    <p className="text-right text-sm text-slate-300 tabular-nums">{estate.app_share === null ? '—' : `${estate.app_share}%`}</p>
                </div>
            ))}
        </div>
    );
}

export function EstatesFooter({ estates }: { estates: Paginated<EstateRow> }) {
    if (estates.last_page <= 1) return null;

    return (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
            <p>
                Showing {estates.from}–{estates.to} of {estates.total.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
                {estates.prev_page_url && (
                    <Link
                        href={estates.prev_page_url}
                        preserveScroll
                        className="rounded-lg border border-slate-700 px-3.5 py-2 font-semibold text-slate-300 transition hover:bg-white/5"
                    >
                        Previous
                    </Link>
                )}
                {estates.next_page_url && (
                    <Link
                        href={estates.next_page_url}
                        preserveScroll
                        className="rounded-lg border border-slate-700 px-3.5 py-2 font-semibold text-slate-300 transition hover:bg-white/5"
                    >
                        Next
                    </Link>
                )}
            </div>
        </div>
    );
}
