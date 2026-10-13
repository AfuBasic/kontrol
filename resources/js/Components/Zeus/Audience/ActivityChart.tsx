import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GROUP_COLOUR, GROUP_LABEL, GROUP_ORDER } from './groups';
import type { DayPoint, Range } from './types';

type Props = { series: DayPoint[]; range: Range };

function label(day: string): string {
    return new Date(`${day}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** Active people per day, stacked by what they used. A person on two kinds of device sits in both slices of that day. */
export default function ActivityChart({ series, range }: Props) {
    const data = series.map((point) => ({ ...point, label: label(point.day) }));
    const any = data.some((point) => point.total > 0);

    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="Active people over time">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-sm font-bold text-white">Active people per day</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{`Each bar is one day, over the last ${range.replace('d', '')} days.`}</p>
                </div>
                <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                    {GROUP_ORDER.filter((key) => key !== 'other').map((key) => (
                        <span key={key} className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: GROUP_COLOUR[key] }} />
                            {GROUP_LABEL[key]}
                        </span>
                    ))}
                </div>
            </div>

            {any ? (
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 8, right: 4, left: -18, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.1)" />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#64748b', fontSize: 11 }}
                                interval="preserveStartEnd"
                                minTickGap={24}
                            />
                            <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<DayTooltip />} />
                            {GROUP_ORDER.map((key) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    stackId="day"
                                    fill={GROUP_COLOUR[key]}
                                    maxBarSize={range === '90d' ? 10 : 22}
                                    isAnimationActive
                                    animationDuration={350}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                    No one was active in this period.
                </div>
            )}
        </section>
    );
}

function DayTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DayPoint & { label: string } }> }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;

    return (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
            <p className="text-xs text-slate-400">{point.label}</p>
            <p className="text-sm font-bold text-white tabular-nums">{point.total} active</p>
            {GROUP_ORDER.filter((key) => point[key] > 0).map((key) => (
                <p key={key} className="flex items-center gap-1.5 text-xs text-slate-300 tabular-nums">
                    <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: GROUP_COLOUR[key] }} />
                    {GROUP_LABEL[key]} {point[key]}
                </p>
            ))}
        </div>
    );
}
