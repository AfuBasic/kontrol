import { KeyRound, UserPlus } from 'lucide-react';
import type { VisitorRecord } from './types';

type Props = {
    record: Pick<VisitorRecord, 'entry_type' | 'tag' | 'code'>;
    /** "chip" is a compact pill for lists; "inline" is plain text for dense rows and tables. */
    variant?: 'chip' | 'inline';
};

/**
 * Says how a visitor got in, so a walk-in is never mistaken for a visit hosted by a resident.
 */
export default function EntryTypeBadge({ record, variant = 'chip' }: Props) {
    const walkIn = record.entry_type === 'walk_in';
    const Icon = walkIn ? UserPlus : KeyRound;
    const label = walkIn ? 'Walk-in' : 'Access code';
    const reference = walkIn ? record.tag : record.code;

    if (variant === 'inline') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500">
                <Icon className="h-3 w-3 shrink-0" aria-hidden />
                {label}
                {reference && <span className="font-mono font-bold text-gray-700">{reference}</span>}
            </span>
        );
    }

    return (
        <span
            className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                walkIn ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' : 'bg-gray-100 text-gray-600'
            }`}
        >
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            {label}
            {reference && <span className="font-mono font-bold tracking-wide">{reference}</span>}
        </span>
    );
}
