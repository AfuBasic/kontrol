import { ArrowPathIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { show } from '@/actions/App/Http/Controllers/Zeus/FailedJobController';
import ZeusModal from '@/Components/Zeus/ZeusModal';
import type { FailedJob, FailedJobDetail } from './types';

type Props = { job: FailedJob | null; onClose: () => void; onRetry: (job: FailedJob) => void; onForget: (job: FailedJob) => void };

/** One failed job with its full error, loaded when it is opened so the list stays light. */
export default function FailedJobModal({ job, onClose, onRetry, onForget }: Props) {
    const [detail, setDetail] = useState<FailedJobDetail | null>(null);
    const [failed, setFailed] = useState(false);
    const uuid = job?.uuid;

    useEffect(() => {
        setDetail(null);
        setFailed(false);
        if (!uuid) return;

        const controller = new AbortController();
        fetch(show.url(uuid), { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal })
            .then((response) => (response.ok ? (response.json() as Promise<FailedJobDetail>) : Promise.reject(new Error(String(response.status)))))
            .then(setDetail)
            .catch((error: Error) => {
                if (error.name !== 'AbortError') setFailed(true);
            });

        return () => controller.abort();
    }, [uuid]);

    return (
        <ZeusModal
            isOpen={job !== null}
            onClose={onClose}
            title={job?.job ?? 'Failed job'}
            subtitle={job ? `Failed ${job.failed_human}` : undefined}
            size="xl"
            footer={
                job && (
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => onForget(job)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-rose-300"
                        >
                            <TrashIcon className="h-5 w-5" />
                            Forget
                        </button>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-10 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => onRetry(job)}
                                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-bold text-white hover:bg-primary-500"
                            >
                                <ArrowPathIcon className="h-5 w-5" />
                                Retry
                            </button>
                        </div>
                    </div>
                )
            }
        >
            {job && (
                <div className="space-y-5">
                    <dl className="grid grid-cols-3 gap-x-6 gap-y-4">
                        <Item label="Job" value={job.job_class} wide />
                        <Item label="Queue" value={job.queue ?? '—'} />
                        <Item label="Connection" value={job.connection ?? '—'} />
                        <Item
                            label="Failed at"
                            value={new Date(job.failed_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                        />
                        <Item label="Queued as" value={job.queued_as} />
                    </dl>

                    {job.repeats_messages && (
                        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                            <p>This job sends messages. Retrying it can send again anything that already went out before it failed.</p>
                        </div>
                    )}

                    <div>
                        <p className="mb-2 text-[11px] font-bold tracking-widest text-slate-500 uppercase">Error</p>
                        {failed ? (
                            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                                The full error could not be loaded. It may already have been retried or forgotten.
                            </p>
                        ) : detail ? (
                            <pre className="max-h-80 overflow-auto rounded-xl border border-slate-800 bg-black/30 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-300">
                                {detail.exception}
                            </pre>
                        ) : (
                            <div className="h-24 animate-pulse rounded-xl bg-slate-800/40" />
                        )}
                    </div>
                </div>
            )}
        </ZeusModal>
    );
}

function Item({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
    return (
        <div className={`min-w-0 ${wide ? 'col-span-3' : ''}`}>
            <dt className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-sm font-medium break-all text-white">{value}</dd>
        </div>
    );
}
