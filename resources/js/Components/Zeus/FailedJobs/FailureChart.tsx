import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Range } from './types';

type Props = { series: Array<{ at: string; failed: number }>; range: Range };

const UNIT: Record<Range, string> = { '24h': 'Each bar is one hour.', '7d': 'Each bar is one day.', '30d': 'Each bar is one day.' };

function label(iso: string, range: Range): string {
    const date = new Date(iso);

    return range === '24h'
        ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** When jobs gave up: a quiet chart with one tall bar is a bad afternoon; a steady row of bars is a standing problem. */
export default function FailureChart({ series, range }: Props) {
    const data = series.map((point) => ({ ...point, label: label(point.at, range) }));
    const any = data.some((point) => point.failed > 0);

    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="Failures over time">
            <div className="mb-4">
                <h2 className="text-sm font-bold text-white">Failures over time</h2>
                <p className="mt-0.5 text-xs text-slate-500">{UNIT[range]}</p>
            </div>

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
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                content={({ active, payload }) =>
                                    active && payload?.length ? (
                                        <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
                                            <p className="text-xs text-slate-400">{(payload[0].payload as { label: string }).label}</p>
                                            <p className="text-sm font-bold text-rose-300 tabular-nums">{String(payload[0].value)} failed</p>
                                        </div>
                                    ) : null
                                }
                            />
                            <Bar dataKey="failed" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={28} isAnimationActive animationDuration={350} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                    Nothing failed in this period.
                </div>
            )}
        </section>
    );
}
