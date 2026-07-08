/**
 * Format an amount stored in kobo as Nigerian Naira.
 */
export function formatAmount(kobo: number): string {
    return '₦' + (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
}

/**
 * Format a commission rate for display.
 */
export function formatCommission(rate: string | number | null, type: string | null): string {
    if (rate === null || rate === undefined || rate === '') {
        return 'TBD';
    }

    if (type === 'fixed') {
        return formatAmount(Number(rate));
    }

    return `${Number(rate).toFixed(2)}%`;
}

/**
 * Format commission length in months.
 */
export function formatCommissionLength(months: number | null): string {
    if (!months) {
        return 'Lifetime (Always)';
    }

    if (months === 12) {
        return '1 Year (12m)';
    }

    if (months === 24) {
        return '2 Years (24m)';
    }

    return `${months} Months`;
}
