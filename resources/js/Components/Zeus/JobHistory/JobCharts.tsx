import type { ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatBucket, formatDuration } from '@/Lib/jobs';
import type { Range, SeriesPoint } from './types';

type Props = { series: SeriesPoint[]; range: Range };

const UNIT: Record<Range, string> = { '1h': 'Each bar is 5 minutes.', '24h': 'Each bar is one hour.', '7d': 'Each bar is one day.' };

/** Jobs finished per bar, split into worked and failed, next to how long the ones that worked took. */
export default function JobCharts({ series, range }: Props) {
    const data = series.map((point) => ({ ...point, label: formatBucket(point.at, range) }));
    const any = data.some((point) => point.succeeded + point.failed > 0);

    return (
        <div className="grid grid-cols-2 gap-4">
            <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="Jobs finished over time">
                <ChartHeading title="Jobs finished" hint={UNIT[range]}>
                    <Key colour="bg-emerald-400" label="Worked" />
                    <Key colour="bg-rose-400" label="Failed" />
                </ChartHeading>
                {any ? (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.1)" />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<CountTooltip />} />
                                <Bar
                                    dataKey="succeeded"
                                    stackId="runs"
                                    fill="#34d399"
                                    radius={[0, 0, 0, 0]}
                                    maxBarSize={26}
                                    isAnimationActive={false}
                                />
                                <Bar dataKey="failed" stackId="runs" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <Empty />
                )}
            </section>

            <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="How long jobs took">
                <ChartHeading title="Time per job" hint="Average time of the jobs that worked." />
                {any ? (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="jobTime" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                                        <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.1)" />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    interval="preserveStartEnd"
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={52}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(value: number) => formatDuration(value)}
                                />
                                <Tooltip content={<TimeTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="avg_duration_ms"
                                    stroke="#38bdf8"
                                    strokeWidth={2}
                                    fill="url(#jobTime)"
                                    connectNulls
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <Empty />
                )}
            </section>
        </div>
    );
}

function ChartHeading({ title, hint, children }: { title: string; hint: string; children?: ReactNode }) {
    return (
        <div className="mb-4 flex items-start justify-between gap-3">
            <div>
                <h2 className="text-sm font-bold text-white">{title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{hint}</p>
            </div>
            <div className="flex items-center gap-3">{children}</div>
        </div>
    );
}

function Key({ colour, label }: { colour: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`h-2.5 w-2.5 rounded-sm ${colour}`} />
            {label}
        </span>
    );
}

function Empty() {
    return (
        <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
            Nothing ran in this period.
        </div>
    );
}

type TipProps = { active?: boolean; payload?: Array<{ payload: SeriesPoint & { label: string } }> };

function CountTooltip({ active, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    const { label, succeeded, failed } = payload[0].payload;

    return (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-bold text-emerald-300 tabular-nums">{succeeded} worked</p>
            <p className="text-sm font-bold text-rose-300 tabular-nums">{failed} failed</p>
        </div>
    );
}

function TimeTooltip({ active, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    const { label, avg_duration_ms } = payload[0].payload;

    return (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="text-sm font-bold text-sky-300 tabular-nums">{formatDuration(avg_duration_ms)}</p>
        </div>
    );
}
