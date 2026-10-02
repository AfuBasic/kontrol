import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export interface Pulse {
    collected: { value: number; previous: number; delta_pct: number | null; spark: number[] };
    residents_paid: { residents: number; payments: number; average: number | null };
    success_rate: { pct: number | null; succeeded: number; failed: number };
    outstanding: { value: number; overdue: number };
}

interface Props {
    pulse?: Pulse;
    loading?: boolean;
}

const compact = (amountKobo: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', notation: 'compact', maximumFractionDigits: 1 }).format(amountKobo / 100);

function Tile({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex min-h-[112px] flex-col rounded-2xl bg-white/[0.05] p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <p className="text-[10px] font-bold tracking-widest text-white/45 uppercase">{label}</p>
            {children}
        </div>
    );
}

/**
 * Four numbers an estate admin checks first, against the 30 days before. Lives in the page header so the
 * page opens on how money is doing, not on a list.
 */
export default function PulseTiles({ pulse, loading }: Props) {
    if (loading) {
        return (
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-[112px] animate-pulse rounded-2xl bg-white/[0.05] ring-1 ring-white/10" />
                ))}
            </div>
        );
    }

    if (!pulse) return null;

    const { collected, residents_paid: payers, success_rate: success, outstanding } = pulse;
    const spark = collected.spark.map((value, i) => ({ i, value }));
    const delta = collected.delta_pct;

    return (
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Collected · 30 days">
                <p className="mt-1.5 text-2xl font-black tracking-tight text-white tabular-nums">{compact(collected.value)}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/50">
                    {delta === null ? (
                        'No earlier period to compare'
                    ) : (
                        <>
                            <span className={delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                                {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%
                            </span>{' '}
                            vs previous 30 days
                        </>
                    )}
                </p>
                <div className="mt-auto -mb-1 h-8 pt-1" aria-hidden>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={spark} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="pulse-spark" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#34d399"
                                strokeWidth={1.5}
                                fill="url(#pulse-spark)"
                                isAnimationActive={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Tile>

            <Tile label="Residents who paid">
                <p className="mt-1.5 text-2xl font-black tracking-tight text-white tabular-nums">{payers.residents.toLocaleString()}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/50">
                    {payers.average === null
                        ? 'No payments in 30 days'
                        : `${payers.payments.toLocaleString()} payments, ${compact(payers.average)} on average`}
                </p>
            </Tile>

            <Tile label="Payments that go through">
                <p className="mt-1.5 text-2xl font-black tracking-tight text-white tabular-nums">{success.pct === null ? '—' : `${success.pct}%`}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/50">
                    {success.pct === null ? 'No payments in 30 days' : `${success.succeeded} paid, ${success.failed} failed`}
                </p>
                {success.pct !== null && (
                    <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
                        <div className="h-full rounded-full bg-emerald-400" style={{ width: `${success.pct}%` }} />
                    </div>
                )}
            </Tile>

            <Tile label="Still owed">
                <p className="mt-1.5 text-2xl font-black tracking-tight text-white tabular-nums">{compact(outstanding.value)}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/50">
                    {outstanding.overdue > 0 ? <span className="text-amber-300">{compact(outstanding.overdue)} overdue</span> : 'Nothing overdue'}
                </p>
            </Tile>
        </div>
    );
}
