import { Check, Lock, Ticket } from 'lucide-react';
import type { VisitorRecord } from './types';
import VisitEventIcon from './VisitEventIcon';

type Props = {
    record: VisitorRecord;
    checkoutEnabled: boolean;
};

type ChainStep = {
    key: string;
    title: string;
    actor: string | null;
    timestamp: string | null;
    done: boolean;
    kind: 'issued' | 'check_in' | 'check_out' | 'pending';
};

/**
 * Vertical chain of custody for a single visit record.
 */
export default function RecordDetailChain({ record, checkoutEnabled }: Props) {
    const steps: ChainStep[] = [
        {
            key: 'issued',
            title: 'Access code issued',
            actor: record.issued_by ? `by ${record.issued_by}` : null,
            timestamp: record.issued_at,
            done: Boolean(record.issued_at),
            kind: 'issued',
        },
        {
            key: 'verified',
            title: 'Verified at gate',
            actor: record.verifier_name ? `by ${record.verifier_name}` : null,
            timestamp: record.verified_at,
            done: true,
            kind: 'check_in',
        },
    ];

    if (checkoutEnabled) {
        if (record.checked_out_at) {
            steps.push({
                key: 'checkout',
                title: 'Checked out',
                actor: record.checkout_verifier_name ? `by ${record.checkout_verifier_name}` : null,
                timestamp: record.checked_out_at,
                done: true,
                kind: 'check_out',
            });
        } else {
            steps.push({
                key: 'checkout',
                title: 'Checked out',
                actor: null,
                timestamp: null,
                done: false,
                kind: 'pending',
            });
        }
    }

    return (
        <div className="space-y-0">
            <ol className="relative space-y-0">
                {steps.map((step, index) => {
                    const isLast = index === steps.length - 1;

                    return (
                        <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                            {!isLast && (
                                <span
                                    className="absolute top-9 bottom-0 left-[17px] w-px bg-gray-200"
                                    aria-hidden
                                />
                            )}

                            <StepGlyph kind={step.kind} done={step.done} />

                            <div className="min-w-0 flex-1 pt-0.5">
                                <p
                                    className={`text-sm font-semibold ${
                                        step.done ? 'text-gray-900' : 'text-gray-400'
                                    }`}
                                >
                                    {step.title}
                                    {!step.done && (
                                        <span className="ml-2 text-xs font-medium text-gray-400">
                                            Pending
                                        </span>
                                    )}
                                </p>
                                {step.actor && (
                                    <p className="mt-0.5 text-xs font-medium text-gray-500">{step.actor}</p>
                                )}
                                {step.timestamp ? (
                                    <p className="mt-1 text-xs font-medium tabular-nums text-gray-600">
                                        {step.timestamp}
                                    </p>
                                ) : (
                                    !step.done && (
                                        <p className="mt-1 text-xs font-medium text-gray-400">
                                            Still on the property
                                        </p>
                                    )
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Lock className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                <p className="text-[11px] font-medium leading-snug text-gray-500">
                    Record locked — this ledger entry cannot be edited.
                </p>
            </div>
        </div>
    );
}

function StepGlyph({ kind, done }: { kind: ChainStep['kind']; done: boolean }) {
    if (kind === 'issued') {
        return (
            <span
                className={`relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                    done
                        ? 'border-gray-200 bg-white text-gray-600'
                        : 'border-gray-100 bg-gray-50 text-gray-300'
                }`}
            >
                <Ticket className="h-4 w-4" />
            </span>
        );
    }

    if (kind === 'pending') {
        return (
            <span className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-300">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
            </span>
        );
    }

    if (kind === 'check_in' || kind === 'check_out') {
        return (
            <span className="relative z-10">
                <VisitEventIcon type={kind} />
            </span>
        );
    }

    return (
        <span className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-success-100 bg-success-50 text-success-600">
            <Check className="h-4 w-4" />
        </span>
    );
}
