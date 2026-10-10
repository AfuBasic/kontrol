import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { categoryColor, compactKobo, formatKobo, monthLabel } from '@/Lib/expenses';
import type { Summary } from './types';

type Props = { summary: Summary };

/** Spend over time next to where it went, with each category keeping one colour everywhere. */
export default function SpendCharts({ summary }: Props) {
    const { series, by_category: categories, spent } = summary;
    const hasSpend = series.points.some((point) => point.total > 0);

    return (
        <div className="grid grid-cols-3 gap-4">
            <section className="col-span-2 rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="Spend over time">
                <div className="mb-4">
                    <h2 className="text-sm font-bold text-white">Spend over time</h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        {series.unit === 'day' ? 'Each bar is one day of the month.' : 'Each bar is one month.'}
                    </p>
                </div>

                {hasSpend ? (
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={series.points} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="spendBar" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#60a5fa" />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0.55} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    interval={series.unit === 'day' ? 2 : 'preserveStartEnd'}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    width={56}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(value: number) => compactKobo(value)}
                                />
                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} content={<ChartTooltip unit={series.unit} />} />
                                <Bar dataKey="total" fill="url(#spendBar)" radius={[5, 5, 0, 0]} maxBarSize={28} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                        Nothing spent in this view.
                    </div>
                )}
            </section>

            <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-6" aria-label="Where it went">
                <h2 className="text-sm font-bold text-white">Where it went</h2>

                {categories.length > 0 ? (
                    <>
                        <div className="relative mx-auto mt-3 h-44 w-44">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categories}
                                        dataKey="total"
                                        nameKey="name"
                                        innerRadius={58}
                                        outerRadius={84}
                                        paddingAngle={categories.length > 1 ? 2 : 0}
                                        stroke="none"
                                    >
                                        {categories.map((category) => (
                                            <Cell key={category.id} fill={categoryColor(category.id)} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Total</span>
                                <span className="text-sm font-black text-white tabular-nums">{compactKobo(spent)}</span>
                            </div>
                        </div>

                        <ul className="mt-4 space-y-2.5">
                            {categories.slice(0, 6).map((category) => (
                                <li key={category.id} className="flex items-center gap-2.5 text-sm">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: categoryColor(category.id) }} />
                                    <span className="min-w-0 flex-1 truncate text-slate-300" title={category.name}>
                                        {category.name}
                                    </span>
                                    <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                                        {spent > 0 ? Math.round((category.total / spent) * 100) : 0}%
                                    </span>
                                    <span className="w-28 shrink-0 text-right font-semibold whitespace-nowrap text-white tabular-nums">
                                        {formatKobo(category.total)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <div className="mt-3 flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-800 text-sm text-slate-500">
                        No categories yet.
                    </div>
                )}
            </section>
        </div>
    );
}

function ChartTooltip({
    active,
    payload,
    unit,
}: {
    active?: boolean;
    payload?: Array<{ payload: { key: string; total: number } }>;
    unit: 'day' | 'month';
}) {
    if (!active || !payload?.length) return null;
    const { key, total } = payload[0].payload;
    const title =
        unit === 'day'
            ? new Date(`${key}T00:00:00Z`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
            : monthLabel(key);

    return (
        <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 shadow-xl">
            <p className="text-xs text-slate-400">{title}</p>
            <p className="text-sm font-bold text-white tabular-nums">{formatKobo(total)}</p>
        </div>
    );
}
