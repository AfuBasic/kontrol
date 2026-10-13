import type { VersionGroup } from './types';

/** Which app versions people are on, per system, so it is clear when an old build can be dropped. */
export default function VersionsPanel({ versions }: { versions: VersionGroup[] }) {
    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label="App versions">
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">App versions</h2>
                <p className="mt-0.5 text-xs text-slate-500">People who used the app in the last 30 days, by version.</p>
            </div>

            {versions.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No one has opened the store apps since tracking began.</p>
            ) : (
                <div className="divide-y divide-slate-800/60">
                    {versions.map((group) => {
                        const behind = group.latest ? group.users - group.on_latest - group.unknown : 0;
                        const most = Math.max(1, group.unknown, ...group.versions.map((v) => v.users));

                        return (
                            <div key={group.os} className="px-6 py-4">
                                <div className="flex items-baseline justify-between gap-3">
                                    <p className="text-sm font-semibold text-white">
                                        {group.label}
                                        <span className="ml-2 text-xs font-medium text-slate-500">{group.users.toLocaleString()} people</span>
                                    </p>
                                    {group.latest && (
                                        <p className="text-xs text-slate-400">
                                            {group.on_latest.toLocaleString()} on the latest ({group.latest})
                                            {behind > 0 ? ` · ${behind.toLocaleString()} behind` : ''}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-3 space-y-1.5">
                                    {group.versions.map((row) => (
                                        <div key={row.version} className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-3 text-xs">
                                            <span className={`tabular-nums ${row.is_latest ? 'font-semibold text-emerald-300' : 'text-slate-400'}`}>
                                                {row.version}
                                            </span>
                                            <span className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                                                <span
                                                    className={`block h-full rounded-full ${row.is_latest ? 'bg-emerald-400' : 'bg-slate-500'}`}
                                                    style={{ width: `${(row.users / most) * 100}%` }}
                                                />
                                            </span>
                                            <span className="text-right text-slate-300 tabular-nums">{row.users}</span>
                                        </div>
                                    ))}
                                    {group.unknown > 0 && (
                                        <div className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-3 text-xs">
                                            <span className="text-slate-500">Unknown</span>
                                            <span className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                                                <span
                                                    className="block h-full rounded-full bg-amber-400/70"
                                                    style={{ width: `${(group.unknown / most) * 100}%` }}
                                                />
                                            </span>
                                            <span className="text-right text-slate-300 tabular-nums">{group.unknown}</span>
                                        </div>
                                    )}
                                </div>
                                {group.unknown > 0 && (
                                    <p className="mt-2 text-[11px] text-slate-600">
                                        Unknown is an older build that has not reported its version yet.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
