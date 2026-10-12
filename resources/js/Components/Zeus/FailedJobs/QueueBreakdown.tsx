type Props = { queues: Array<{ name: string; count: number }>; selected: string | null; onSelect: (queue: string | null) => void };

/** Which queue the failures came from. Click one to list only its failures. */
export default function QueueBreakdown({ queues, selected, onSelect }: Props) {
    const most = Math.max(1, ...queues.map((queue) => queue.count));

    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label="Failures by queue">
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">By queue</h2>
                <p className="mt-0.5 text-xs text-slate-500">Where the waiting failures came from.</p>
            </div>

            {queues.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No failures to show.</p>
            ) : (
                <div className="space-y-1 p-3">
                    {queues.map((queue) => {
                        const active = selected === queue.name;

                        return (
                            <button
                                key={queue.name}
                                type="button"
                                onClick={() => onSelect(active ? null : queue.name)}
                                aria-pressed={active}
                                className={`w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-white/[0.04] ${active ? 'bg-primary-500/10' : ''}`}
                            >
                                <span className="flex items-baseline justify-between gap-3">
                                    <span className="truncate text-sm font-semibold text-white">{queue.name}</span>
                                    <span className="text-sm font-bold text-slate-300 tabular-nums">{queue.count}</span>
                                </span>
                                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-800">
                                    <span className="block h-full rounded-full bg-rose-400" style={{ width: `${(queue.count / most) * 100}%` }} />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
