export type VisitorPurposeCategory =
    | 'Family'
    | 'Friends'
    | 'Personal Guest'
    | 'Maintenance'
    | 'Delivery'
    | 'Healthcare'
    | 'Business'
    | 'Community'
    | 'Event'
    | string;

export function getPurposeColorStyle(purpose?: string | null) {
    const normalized = (purpose || '').toLowerCase().trim();

    if (normalized.includes('family') || normalized.includes('mum') || normalized.includes('dad') || normalized.includes('parent')) {
        return {
            bg: 'bg-rose-50 hover:bg-rose-100',
            text: 'text-rose-900',
            border: 'border-rose-200',
            dot: 'bg-rose-500',
            badge: 'bg-rose-100 text-rose-800',
        };
    }

    if (normalized.includes('maint') || normalized.includes('electric') || normalized.includes('plumb') || normalized.includes('repair')) {
        return {
            bg: 'bg-amber-50 hover:bg-amber-100',
            text: 'text-amber-900',
            border: 'border-amber-200',
            dot: 'bg-amber-500',
            badge: 'bg-amber-100 text-amber-800',
        };
    }

    if (normalized.includes('deliver') || normalized.includes('package') || normalized.includes('courier')) {
        return {
            bg: 'bg-orange-50 hover:bg-orange-100',
            text: 'text-orange-900',
            border: 'border-orange-200',
            dot: 'bg-orange-500',
            badge: 'bg-orange-100 text-orange-800',
        };
    }

    if (normalized.includes('health') || normalized.includes('doctor') || normalized.includes('nurse') || normalized.includes('medical')) {
        return {
            bg: 'bg-emerald-50 hover:bg-emerald-100',
            text: 'text-emerald-900',
            border: 'border-emerald-200',
            dot: 'bg-emerald-500',
            badge: 'bg-emerald-100 text-emerald-800',
        };
    }

    if (normalized.includes('busin') || normalized.includes('work') || normalized.includes('meeting')) {
        return {
            bg: 'bg-purple-50 hover:bg-purple-100',
            text: 'text-purple-900',
            border: 'border-purple-200',
            dot: 'bg-purple-500',
            badge: 'bg-purple-100 text-purple-800',
        };
    }

    // Default Personal / Friends / Guest
    return {
        bg: 'bg-blue-50 hover:bg-blue-100',
        text: 'text-blue-900',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800',
    };
}
