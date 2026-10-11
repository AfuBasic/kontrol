import { ArrowPathIcon, ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import ZeusModal from '@/Components/Zeus/ZeusModal';

export type PendingAction = { kind: 'retry' | 'forget'; ids: string[]; repeatsMessages: number };

type Props = { pending: PendingAction | null; busy: boolean; onCancel: () => void; onConfirm: () => void };

/** Retrying and forgetting both change things for good, so each one is confirmed, with a plain warning where it matters. */
export default function ConfirmActionModal({ pending, busy, onCancel, onConfirm }: Props) {
    const retry = pending?.kind === 'retry';
    const count = pending?.ids.length ?? 0;
    const noun = count === 1 ? 'job' : 'jobs';

    return (
        <ZeusModal
            isOpen={pending !== null}
            onClose={busy ? () => undefined : onCancel}
            title={retry ? `Retry ${count} ${noun}?` : `Forget ${count} ${noun}?`}
            size="md"
            footer={
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="min-h-10 rounded-lg border border-slate-600 px-4 text-sm font-semibold text-slate-200 hover:bg-white/5 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-5 text-sm font-bold text-white disabled:opacity-60 ${retry ? 'bg-primary-600 hover:bg-primary-500' : 'bg-rose-600 hover:bg-rose-500'}`}
                    >
                        {retry ? <ArrowPathIcon className="h-5 w-5" /> : <TrashIcon className="h-5 w-5" />}
                        {busy ? 'Working…' : retry ? `Retry ${count} ${noun}` : `Forget ${count} ${noun}`}
                    </button>
                </div>
            }
        >
            {pending && (
                <div className="space-y-4 text-sm leading-relaxed text-slate-300">
                    {retry ? (
                        <p>
                            {count === 1 ? 'This job goes' : 'These jobs go'} back on the queue and run again from the start. They leave this list
                            once they are queued, and come back here if they fail again.
                        </p>
                    ) : (
                        <p>
                            {count === 1 ? 'This job is' : 'These jobs are'} removed from the failed list and will{' '}
                            <span className="font-semibold text-white">not</span> run again. This can’t be undone.
                        </p>
                    )}

                    {retry && pending.repeatsMessages > 0 && (
                        <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-100">
                            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                            <p>
                                {pending.repeatsMessages === count
                                    ? count === 1
                                        ? 'This one sends'
                                        : 'All of these send'
                                    : `${pending.repeatsMessages} of these send`}{' '}
                                emails, notifications or messages. If part of the job already went out before it failed, retrying sends that part{' '}
                                <span className="font-semibold">again</span>. If people already got what they needed, forgetting is usually safer.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </ZeusModal>
    );
}
