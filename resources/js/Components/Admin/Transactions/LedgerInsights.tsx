import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export interface Insights {
    flow: Array<{ date: string; money_in: number }>;
    collections: Array<{ id: number; name: string; due: number; paid: number }>;
    methods: Array<{ label: string; amount: number; count: number }>;
    rhythm: { matrix: number[][]; max: number };
}

interface Props {
    data?: Insights | null;
    loading?: boolean;
}

const compact = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(amountKobo / 100);

const full = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amountKobo / 100);

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const BLOCKS = ['late night', 'early morning', 'morning', 'afternoon', 'evening', 'night'];
const BLOCK_LABELS = ['12a', '4a', '8a', '12p', '4p', '8p'];
const METHOD_COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-400', 'bg-sky-400', 'bg-slate-300'];

function Card({ title, hint, className = '', children }: { title: string; hint?: string; className?: string; children: React.ReactNode }) {
    return (
        <section className={`rounded-3xl border border-slate-100 bg-white p-5 ${className}`}>
            <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
                {hint && <p className="mt-0.5 text-xs font-medium text-slate-400">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

function FlowTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; money_in: number } }> }) {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload;

    return (
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-xs shadow-lg">
            <p className="font-bold text-slate-900">{shortDate(point.date)}</p>
            <p className="mt-1 font-semibold text-emerald-600">Collected {full(point.money_in)}</p>
        </div>
    );
}

export default function LedgerInsights({ data, loading }: Props) {
    if (loading) {
        return (
            <div className="grid gap-5 lg:grid-cols-3">
                <div className="h-72 animate-pulse rounded-3xl bg-slate-50 ring-1 ring-slate-100 lg:col-span-2" />
                <div className="h-72 animate-pulse rounded-3xl bg-slate-50 ring-1 ring-slate-100" />
            </div>
        );
    }

    if (!data) return null;

    const hasFlow = data.flow.some((d) => d.money_in > 0);

    const methodTotal = data.methods.reduce((sum, m) => sum + m.amount, 0);

    // Busiest slot, for the heatmap's headline.
    let busiest: { day: number; block: number; count: number } | null = null;
    data.rhythm.matrix.forEach((row, day) =>
        row.forEach((count, block) => {
            if (count > 0 && (!busiest || count > busiest.count)) busiest = { day, block, count };
        }),
    );

    return (
        <div className="grid gap-5 lg:grid-cols-3">
            <Card title="Money flow" hint="Money collected each day, last 30 days." className="lg:col-span-2">
                {hasFlow ? (
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={data.flow} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="flow-in" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={shortDate}
                                interval={4}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={compact}
                                tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                                axisLine={false}
                                tickLine={false}
                                width={52}
                            />
                            <Tooltip content={<FlowTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
                            <Area type="monotone" dataKey="money_in" stroke="#10b981" strokeWidth={2} fill="url(#flow-in)" />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="py-16 text-center text-sm font-semibold text-slate-400">No money moved in the last 30 days.</p>
                )}
            </Card>

            <Card title="How people pay" hint="Share of money collected, last 30 days.">
                {methodTotal > 0 ? (
                    <>
                        <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                            {data.methods.map((m, i) => (
                                <div
                                    key={m.label}
                                    className={METHOD_COLORS[i % METHOD_COLORS.length]}
                                    style={{ width: `${(m.amount / methodTotal) * 100}%` }}
                                    title={`${m.label}: ${full(m.amount)}`}
                                />
                            ))}
                        </div>
                        <ul className="mt-5 space-y-3">
                            {data.methods.map((m, i) => (
                                <li key={m.label} className="flex items-center gap-3 text-sm">
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${METHOD_COLORS[i % METHOD_COLORS.length]}`} />
                                    <span className="flex-1 font-semibold text-slate-700">{m.label}</span>
                                    <span className="text-xs font-medium text-slate-400">{m.count} payments</span>
                                    <span className="w-12 text-right text-sm font-black text-slate-900 tabular-nums">
                                        {Math.round((m.amount / methodTotal) * 100)}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </>
                ) : (
                    <p className="py-10 text-center text-sm font-semibold text-slate-400">No payments in the last 30 days.</p>
                )}
            </Card>

            <Card title="Collection progress" hint="Paid against expected, biggest balance first." className="lg:col-span-2">
                {data.collections.length === 0 ? (
                    <p className="py-10 text-center text-sm font-semibold text-slate-400">No collections have been assigned yet.</p>
                ) : (
                    <ul className="space-y-5">
                        {data.collections.map((c) => {
                            const pct = c.due > 0 ? Math.min(100, Math.round((c.paid / c.due) * 100)) : 0;
                            const owed = Math.max(0, c.due - c.paid);

                            return (
                                <li key={c.id}>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <p className="truncate text-sm font-bold text-slate-900">{c.name}</p>
                                        <p className="shrink-0 text-xs font-semibold text-slate-400">
                                            <span className="font-black text-slate-900">{pct}%</span> paid
                                            {owed > 0 && <span className="ml-2 text-amber-600">{compact(owed)} outstanding</span>}
                                        </p>
                                    </div>
                                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                                        {full(c.paid)} of {full(c.due)}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>

            <Card
                title="When residents pay"
                hint={
                    busiest
                        ? `Most payments land on ${DAYS[(busiest as { day: number }).day]} ${BLOCKS[(busiest as { block: number }).block]}.`
                        : 'Payments by weekday and time of day, last 90 days.'
                }
            >
                {data.rhythm.max === 0 ? (
                    <p className="py-10 text-center text-sm font-semibold text-slate-400">No payments in the last 90 days.</p>
                ) : (
                    <div>
                        <div className="grid grid-cols-[2rem_repeat(6,1fr)] gap-1">
                            <span />
                            {BLOCK_LABELS.map((label) => (
                                <span key={label} className="text-center text-[10px] font-bold text-slate-400">
                                    {label}
                                </span>
                            ))}
                            {data.rhythm.matrix.map((row, day) => (
                                <div key={DAYS[day]} className="contents">
                                    <span className="self-center text-[10px] font-bold text-slate-400">{DAYS[day].slice(0, 3)}</span>
                                    {row.map((count, block) => (
                                        <span
                                            key={block}
                                            title={`${DAYS[day]} ${BLOCKS[block]}: ${count} ${count === 1 ? 'payment' : 'payments'}`}
                                            className="aspect-square rounded-md bg-slate-100"
                                            style={
                                                count > 0
                                                    ? { backgroundColor: `rgba(79, 70, 229, ${0.15 + (count / data.rhythm.max) * 0.85})` }
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] font-semibold text-slate-400">
                            Quiet
                            {[0.15, 0.4, 0.65, 1].map((alpha) => (
                                <span key={alpha} className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: `rgba(79, 70, 229, ${alpha})` }} />
                            ))}
                            Busy
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
