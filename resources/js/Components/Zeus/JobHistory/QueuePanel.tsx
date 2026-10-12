import { formatDuration, formatWaiting } from '@/Lib/jobs';
import type { QueueRow } from './types';

type Props = { queues: QueueRow[]; selected: string | null; onSelect: (queue: string | null) => void };

/** One row per queue: how much is waiting, how long the oldest has waited, and how it has been doing. Click to filter the list below. */
export default function QueuePanel({ queues, selected, onSelect }: Props) {
    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label="Queues">
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">Queues</h2>
                <p className="mt-0.5 text-xs text-slate-500">What is waiting right now, and how each queue has done in this period.</p>
            </div>

            <div className="divide-y divide-slate-800/60">
                {queues.map((queue) => {
                    const active = selected === queue.name;
                    const quiet = queue.waiting + queue.running + queue.ran === 0;

                    return (
                        <button
                            key={queue.name}
                            type="button"
                            onClick={() => onSelect(active ? null : queue.name)}
                            aria-pressed={active}
                            className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3.5 text-left transition hover:bg-white/[0.03] ${active ? 'bg-primary-500/10' : ''}`}
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2 w-2 shrink-0 rounded-full ${queue.stalled ? 'bg-rose-400' : queue.running > 0 ? 'animate-pulse bg-sky-400' : quiet ? 'bg-slate-600' : 'bg-emerald-400'}`}
                                    />
                                    <p className="truncate text-sm font-semibold text-white">{queue.name}</p>
                                    {!queue.known && (
                                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-200 uppercase">
                                            No worker
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {queue.ran === 0
                                        ? 'Nothing ran in this period'
                                        : `${queue.ran} ran · ${queue.failed} failed · ${formatDuration(queue.avg_duration_ms)} on average`}
                                </p>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-sm font-bold tabular-nums ${queue.stalled ? 'text-rose-300' : queue.waiting > 0 ? 'text-amber-200' : 'text-slate-300'}`}
                                >
                                    {queue.waiting} waiting
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {queue.running} running
                                    {queue.waiting > 0 ? ` · oldest ${formatWaiting(queue.oldest_waiting_seconds)}` : ''}
                                    {queue.scheduled > 0 ? ` · ${queue.scheduled} later` : ''}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
