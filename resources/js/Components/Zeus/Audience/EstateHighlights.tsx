import type { EstateRow } from './types';

type Props = { busiest: EstateRow[]; quietest: EstateRow[]; onOpenAll: () => void };

/** The estates doing best and worst. A low share of members active is the earliest sign an estate is drifting away. */
export default function EstateHighlights({ busiest, quietest, onOpenAll }: Props) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <List title="Most active estates" hint="By people active." rows={busiest} onOpenAll={onOpenAll} />
            <List
                title="Quietest estates"
                hint="By share of members active, estates with at least 5 members."
                rows={quietest}
                onOpenAll={onOpenAll}
                warn
            />
        </div>
    );
}

function List({
    title,
    hint,
    rows,
    onOpenAll,
    warn = false,
}: {
    title: string;
    hint: string;
    rows: EstateRow[];
    onOpenAll: () => void;
    warn?: boolean;
}) {
    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label={title}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-800/70 px-6 py-4">
                <div>
                    <h2 className="text-sm font-bold text-white">{title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
                </div>
                <button type="button" onClick={onOpenAll} className="shrink-0 text-xs font-semibold text-primary-300 hover:text-primary-200">
                    All estates
                </button>
            </div>

            {rows.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-slate-500">Nothing to show yet.</p>
            ) : (
                <div className="divide-y divide-slate-800/60">
                    {rows.map((row) => (
                        <div key={row.id} className="flex items-center justify-between gap-4 px-6 py-3">
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{row.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {row.active.toLocaleString()} of {row.members.toLocaleString()} members
                                    {row.app_share !== null ? ` · ${row.app_share}% on the app` : ''}
                                </p>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${warn && row.rate < 25 ? 'text-rose-300' : 'text-slate-200'}`}>
                                {row.rate}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
