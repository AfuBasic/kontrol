import type { WorkerRow } from './types';

/** The workers that have run a job in this period, and whether each is busy right now. */
export default function WorkerPanel({ workers }: { workers: WorkerRow[] }) {
    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label="Workers">
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">Workers</h2>
                <p className="mt-0.5 text-xs text-slate-500">A worker appears here after its first job.</p>
            </div>

            {workers.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">No worker has recorded a job in this period.</p>
            ) : (
                <div className="divide-y divide-slate-800/60">
                    {workers.map((worker) => (
                        <div key={worker.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-3.5">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`h-2 w-2 shrink-0 rounded-full ${worker.busy ? 'animate-pulse bg-sky-400' : 'bg-emerald-400'}`}
                                    />
                                    <p className="truncate text-sm font-semibold text-white" title={worker.name}>
                                        {worker.name}
                                    </p>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    {worker.queues.length > 0 ? worker.queues.join(', ') : 'No queue recorded'} · last job {worker.last_seen_human}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-300 tabular-nums">{worker.runs} ran</p>
                                <p className={`mt-0.5 text-xs tabular-nums ${worker.failed > 0 ? 'text-rose-300' : 'text-slate-500'}`}>
                                    {worker.busy ? 'Busy now · ' : ''}
                                    {worker.failed} failed
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
