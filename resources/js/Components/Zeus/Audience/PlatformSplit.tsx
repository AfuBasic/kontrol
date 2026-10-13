import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { GROUP_COLOUR } from './groups';
import type { PlatformRow, Summary } from './types';

type Props = { platforms: PlatformRow[]; summary: Summary };

/** What people use Kontrol on. Someone on two kinds of device counts on both, so the bars can add up to more than the people. */
export default function PlatformSplit({ platforms, summary }: Props) {
    const total = platforms.reduce((sum, row) => sum + row.users, 0);
    const shown = platforms.filter((row) => row.users > 0);

    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="What people use">
            <h2 className="text-sm font-bold text-white">What people use</h2>
            <p className="mt-0.5 text-xs text-slate-500">Active people by kind of device. Someone on two kinds counts on both.</p>

            {total === 0 ? (
                <div className="mt-4 flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                    No one was active in this period.
                </div>
            ) : (
                <div className="mt-4 grid grid-cols-[176px_minmax(0,1fr)] items-center gap-6">
                    <div className="relative h-44 w-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={shown}
                                    dataKey="users"
                                    nameKey="label"
                                    innerRadius={58}
                                    outerRadius={84}
                                    paddingAngle={shown.length > 1 ? 2 : 0}
                                    stroke="none"
                                    isAnimationActive
                                    animationDuration={350}
                                >
                                    {shown.map((row) => (
                                        <Cell key={row.key} fill={GROUP_COLOUR[row.key]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <p className="text-2xl font-black text-white tabular-nums">
                                {summary.app_share === null ? '—' : `${summary.app_share}%`}
                            </p>
                            <p className="text-[11px] text-slate-500">on the app</p>
                        </div>
                    </div>

                    <ul className="space-y-2.5">
                        {platforms.map((row) => (
                            <li key={row.key} className="flex items-center justify-between gap-3 text-sm">
                                <span className="inline-flex min-w-0 items-center gap-2">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: GROUP_COLOUR[row.key] }} />
                                    <span className="truncate text-slate-300">{row.label}</span>
                                </span>
                                <span className="shrink-0 font-bold text-white tabular-nums">
                                    {row.users.toLocaleString()}
                                    <span className="ml-2 text-xs font-medium text-slate-500">{Math.round((row.users / total) * 100)}%</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    );
}
