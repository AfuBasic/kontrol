import { ArrowTrendingDownIcon, ArrowTrendingUpIcon, BanknotesIcon, FireIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline';
import { coverage, formatKobo, formatNaira, monthLabel, shiftMonth, spendDelta } from '@/Lib/expenses';
import type { Summary } from './types';

type Props = { summary: Summary; onOpenExpense: (id: number) => void };

/** The month in one glance: net position up top, then spend, recurring revenue and the biggest single cost. */
export default function SpendHero({ summary, onOpenExpense }: Props) {
    const { month, spent, revenue, net, count } = summary;
    const used = coverage(spent, revenue);
    const over = used !== null && used > 100;
    const meterTone = used === null ? 'bg-slate-400' : used >= 100 ? 'bg-rose-400' : used >= 70 ? 'bg-amber-300' : 'bg-emerald-300';
    const delta = month ? spendDelta(spent, summary.previous_spent) : null;
    const previousLabel = month ? monthLabel(shiftMonth(month, -1)).split(' ')[0] : '';

    const headline = net === null ? formatKobo(spent) : `${net < 0 ? '−' : ''}${formatNaira(Math.abs(net))}`;
    const headlineTone = net === null ? 'text-white' : net >= 0 ? 'text-emerald-300' : 'text-rose-300';
    const sentence =
        net === null
            ? 'Spent across all time. Pick a month to compare it with recurring revenue.'
            : net >= 0
              ? `Recurring revenue is covering costs, with ${formatNaira(net)} to spare.`
              : `Costs are ahead of recurring revenue by ${formatNaira(Math.abs(net))} this month.`;

    return (
        <section aria-label="Summary" className="space-y-4">
            <div className="brand-card !rounded-3xl p-8 text-white shadow-2xl shadow-black/30">
                <div className="relative z-10 grid grid-cols-12 items-center gap-8">
                    <div className="col-span-7">
                        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-widest text-blue-100 uppercase ring-1 ring-white/15">
                            {month ? monthLabel(month) : 'All time'} · {count} {count === 1 ? 'expense' : 'expenses'}
                        </span>
                        <p className="mt-5 text-xs font-bold tracking-[0.2em] text-blue-200/80 uppercase">
                            {net === null ? 'Total spent' : 'Net position'}
                        </p>
                        <p className={`mt-1 text-6xl leading-none font-black tracking-tight whitespace-nowrap tabular-nums ${headlineTone}`}>
                            {headline}
                        </p>
                        <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100/80">{sentence}</p>
                    </div>

                    <div className="col-span-5">
                        {used !== null && revenue !== null ? (
                            <div className="rounded-2xl bg-black/20 p-5 ring-1 ring-white/10 backdrop-blur-sm">
                                <div className="flex items-baseline justify-between">
                                    <p className="text-[11px] font-bold tracking-widest text-blue-200/80 uppercase">Spend vs recurring revenue</p>
                                    <p className="text-2xl font-black tabular-nums">{used}%</p>
                                </div>
                                <div
                                    className="mt-3 h-3 overflow-hidden rounded-full bg-white/15"
                                    role="meter"
                                    aria-valuenow={used}
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-label="Spend as a share of recurring revenue"
                                >
                                    <div
                                        className={`h-full rounded-full ${meterTone} transition-all duration-700`}
                                        style={{ width: `${Math.min(used, 100)}%` }}
                                    />
                                </div>
                                <div className="mt-3 flex justify-between text-xs text-blue-100/70">
                                    <span>
                                        Spent <span className="font-semibold text-white">{formatKobo(spent)}</span>
                                    </span>
                                    <span>
                                        MRR <span className="font-semibold text-white">{formatNaira(revenue)}</span>
                                    </span>
                                </div>
                                {over && <p className="mt-2 text-xs font-semibold text-rose-200">Spending is {used - 100}% more than revenue.</p>}
                            </div>
                        ) : (
                            <div className="rounded-2xl bg-black/20 p-5 text-sm leading-relaxed text-blue-100/80 ring-1 ring-white/10">
                                {month
                                    ? 'No recurring revenue was recorded for this month, so there is nothing to measure spend against.'
                                    : 'Choose a single month to see how spending compares with recurring revenue.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Tile icon={<ReceiptPercentIcon className="h-5 w-5" />} accent="bg-sky-500/15 text-sky-300" label="Spent">
                    <p className="text-2xl font-black tracking-tight whitespace-nowrap text-white tabular-nums">{formatKobo(spent)}</p>
                    {delta ? (
                        <p
                            className={`mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${delta.direction === 'up' ? 'bg-rose-500/15 text-rose-300' : delta.direction === 'down' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-500/15 text-slate-300'}`}
                        >
                            {delta.direction === 'up' && <ArrowTrendingUpIcon className="h-3.5 w-3.5" />}
                            {delta.direction === 'down' && <ArrowTrendingDownIcon className="h-3.5 w-3.5" />}
                            {delta.direction === 'new'
                                ? `Nothing spent in ${previousLabel}`
                                : delta.direction === 'flat'
                                  ? `Same as ${previousLabel}`
                                  : `${delta.percent}% ${delta.direction === 'up' ? 'more' : 'less'} than ${previousLabel}`}
                        </p>
                    ) : (
                        <p className="mt-1.5 text-xs text-slate-500">{month ? 'No previous month to compare' : 'Across every month'}</p>
                    )}
                </Tile>

                <Tile icon={<BanknotesIcon className="h-5 w-5" />} accent="bg-emerald-500/15 text-emerald-300" label="Recurring revenue (MRR)">
                    <p className="text-2xl font-black tracking-tight whitespace-nowrap text-emerald-300 tabular-nums">
                        {revenue === null ? '—' : formatNaira(revenue)}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500">
                        {revenue === null ? 'Pick a month to compare' : 'Modelled from active subscriptions, not cash received'}
                    </p>
                </Tile>

                <Tile icon={<FireIcon className="h-5 w-5" />} accent="bg-amber-500/15 text-amber-300" label="Biggest expense">
                    {summary.largest ? (
                        <button type="button" onClick={() => onOpenExpense(summary.largest!.id)} className="block w-full text-left">
                            <p className="text-2xl font-black tracking-tight whitespace-nowrap text-white tabular-nums">
                                {formatKobo(summary.largest.amount)}
                            </p>
                            <p className="mt-1.5 truncate text-xs text-slate-400 hover:text-white" title={summary.largest.payee}>
                                {summary.largest.payee}
                            </p>
                        </button>
                    ) : (
                        <>
                            <p className="text-2xl font-black tracking-tight text-slate-600">—</p>
                            <p className="mt-1.5 text-xs text-slate-500">Nothing recorded yet</p>
                        </>
                    )}
                </Tile>
            </div>
        </section>
    );
}

function Tile({ icon, accent, label, children }: { icon: React.ReactNode; accent: string; label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-slate-800/70 bg-[#0f1423] p-5 transition hover:border-slate-700">
            <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>{icon}</span>
                <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">{label}</p>
            </div>
            {children}
        </div>
    );
}
