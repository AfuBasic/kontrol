import { LogIn, LogOut } from 'lucide-react';
import type { ActivityEventType } from './types';

type Props = {
    type: ActivityEventType;
    size?: 'sm' | 'md';
};

/**
 * Shared check-in / check-out glyph.
 * Check-in uses primary (accent); check-out uses gray (secondary).
 */
export default function VisitEventIcon({ type, size = 'md' }: Props) {
    const isCheckIn = type === 'check_in';
    const box = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
    const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-xl border ${box} ${
                isCheckIn
                    ? 'border-primary-200 bg-primary-50 text-primary-600'
                    : 'border-gray-200 bg-gray-100 text-gray-600'
            }`}
            aria-hidden
        >
            {isCheckIn ? <LogIn className={icon} /> : <LogOut className={icon} />}
        </span>
    );
}
