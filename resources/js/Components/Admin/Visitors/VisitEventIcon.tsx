import type { ActivityEventType } from './types';
import {
    ACTIVITY_KINDS,
    activityKindFromEventType,
    type ActivityKind,
} from './activityKinds';

type Props = {
    type?: ActivityEventType;
    kind?: ActivityKind;
    size?: 'sm' | 'md';
    bare?: boolean;
};

/**
 * Activity glyph — direction + color encode kind at a glance.
 */
export default function VisitEventIcon({ type, kind, size = 'md', bare = false }: Props) {
    const resolved: ActivityKind = kind ?? (type ? activityKindFromEventType(type) : 'verified');
    const config = ACTIVITY_KINDS[resolved];
    const Icon = config.Icon;
    const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

    if (bare) {
        return (
            <Icon
                className={`${iconSize} shrink-0 ${config.textClass}`}
                strokeWidth={2.5}
                aria-hidden
            />
        );
    }

    const box = size === 'sm' ? 'h-6 w-6' : 'h-7 w-7';

    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-md border ${box} ${config.chipClass}`}
            title={config.label}
            aria-label={config.label}
        >
            <Icon className={iconSize} strokeWidth={2.5} />
        </span>
    );
}
