import { TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import ZeusModal from '@/Components/Zeus/ZeusModal';
import type { ClearScope } from './types';

type Props = {
    isOpen: boolean;
    counts: Record<ClearScope, number>;
    busy: boolean;
    onCancel: () => void;
    onConfirm: (scope: ClearScope) => void;
};

const OPTIONS: Array<{ scope: ClearScope; title: string; detail: string }> = [
    { scope: 'succeeded', title: 'Jobs that worked', detail: 'Keeps every failure, so you can still see what went wrong.' },
    { scope: 'older', title: 'Older than a week', detail: 'Keeps the last seven days as they are.' },
    { scope: 'all', title: 'Everything', detail: 'The whole history, failures included. A run still in progress is left alone.' },
];

/** Choosing what to clear is part of the confirmation: each option says exactly how many records it removes. */
export default function ClearHistoryModal({ isOpen, counts, busy, onCancel, onConfirm }: Props) {
    const [scope, setScope] = useState<ClearScope>('succeeded');
    const count = counts[scope];

    return (
        <ZeusModal
            isOpen={isOpen}
            onClose={busy ? () => undefined : onCancel}
            title="Clear job history"
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
                        onClick={() => onConfirm(scope)}
                        disabled={busy || count === 0}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                    >
                        <TrashIcon className="h-5 w-5" />
                        {busy
                            ? 'Clearing…'
                            : count === 0
                              ? 'Nothing to clear'
                              : `Clear ${count.toLocaleString()} ${count === 1 ? 'record' : 'records'}`}
                    </button>
                </div>
            }
        >
            <div className="space-y-4">
                <fieldset className="space-y-2">
                    <legend className="sr-only">What to clear</legend>
                    {OPTIONS.map((option) => (
                        <label
                            key={option.scope}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${scope === option.scope ? 'border-primary-500/60 bg-primary-500/10' : 'border-slate-700 hover:bg-white/[0.03]'}`}
                        >
                            <input
                                type="radio"
                                name="clear-scope"
                                value={option.scope}
                                checked={scope === option.scope}
                                onChange={() => setScope(option.scope)}
                                className="mt-1 h-4 w-4 border-slate-600 bg-slate-800 text-primary-500 focus:ring-primary-500/40"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="flex items-baseline justify-between gap-3">
                                    <span className="text-sm font-semibold text-white">{option.title}</span>
                                    <span className="text-xs text-slate-400 tabular-nums">{counts[option.scope].toLocaleString()} records</span>
                                </span>
                                <span className="mt-0.5 block text-xs text-slate-400">{option.detail}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>

                <p className="text-sm leading-relaxed text-slate-400">
                    This only clears the record of what ran. Jobs waiting in the queue, the failed jobs list and the jobs themselves are not touched.
                    It can’t be undone.
                </p>
            </div>
        </ZeusModal>
    );
}
