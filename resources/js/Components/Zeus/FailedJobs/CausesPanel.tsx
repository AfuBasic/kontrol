import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { Cause } from './types';

type Props = {
    causes: Cause[];
    sampled: boolean;
    onShow: (job: string) => void;
};

/** Failures grouped by what broke, so fourteen copies of one problem read as one problem with a count. */
export default function CausesPanel({ causes, sampled, onShow }: Props) {
    return (
        <section className="rounded-2xl border border-slate-800/70 bg-[#0f1423]" aria-label="What is failing">
            <div className="border-b border-slate-800/70 px-6 py-4">
                <h2 className="text-sm font-bold text-white">What is failing</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                    The same job failing the same way counts once.{sampled ? ' Based on the newest 500 failures.' : ''}
                </p>
            </div>

            {causes.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-500">Nothing is failing.</p>
            ) : (
                <div className="divide-y divide-slate-800/60">
                    {causes.map((cause) => (
                        <div key={`${cause.job}|${cause.exception_class}`} className="flex items-center gap-4 px-6 py-3.5">
                            <p className="w-12 shrink-0 text-right text-2xl font-black text-rose-300 tabular-nums">{cause.count}</p>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-white">{cause.job}</p>
                                    {cause.repeats_messages && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                                            <ExclamationTriangleIcon className="h-3 w-3" />
                                            Messages people
                                        </span>
                                    )}
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-xs break-words text-slate-500" title={cause.error}>
                                    {cause.error}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-600">
                                    {cause.queues.join(', ')} · latest {cause.last_failed_human}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onShow(cause.job)}
                                className="min-h-9 shrink-0 rounded-lg border border-slate-700 px-3 text-sm font-semibold text-slate-200 hover:bg-white/5"
                            >
                                Show
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
