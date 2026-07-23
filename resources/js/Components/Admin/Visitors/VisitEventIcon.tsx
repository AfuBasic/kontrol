import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { ActivityEventType } from './types';

type Props = {
    type: ActivityEventType;
    size?: 'sm' | 'md';
    /** Icon only, no chip background — for dense table cells */
    bare?: boolean;
};

/**
 * Check-in vs check-out must be glanceable:
 * - Check-in: arrow down-right (into the estate) · primary accent
 * - Check-out: arrow up-right (away) · neutral gray
 * Different direction + color — not two similar door icons.
 */
export default function VisitEventIcon({ type, size = 'md', bare = false }: Props) {
    const isCheckIn = type === 'check_in';
    const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
    const Icon = isCheckIn ? ArrowDownRight : ArrowUpRight;

    if (bare) {
        return (
            <Icon
                className={`${iconSize} shrink-0 ${isCheckIn ? 'text-primary-600' : 'text-gray-500'}`}
                strokeWidth={2.5}
                aria-hidden
            />
        );
    }

    const box = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-lg border ${box} ${
                isCheckIn
                    ? 'border-primary-200 bg-primary-50 text-primary-600'
                    : 'border-gray-200 bg-gray-100 text-gray-500'
            }`}
            title={isCheckIn ? 'Check-in' : 'Check-out'}
            aria-label={isCheckIn ? 'Check-in' : 'Check-out'}
        >
            <Icon className={iconSize} strokeWidth={2.5} />
        </span>
    );
}
