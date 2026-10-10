export type ExpenseLike = { incurred_on: string; amount: number };

const NAIRA = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Kobo (what the server stores) as a naira string, for example 1250050 becomes "₦12,500.50". */
export function formatKobo(kobo: number): string {
    return NAIRA.format(kobo / 100);
}

/** Naira (what the server computes for revenue and net) as a string. Negative values keep their sign. */
export function formatNaira(naira: number): string {
    return NAIRA.format(naira);
}

/** An amount for an input field: kobo to a plain naira string, dropping a trailing ".00". */
export function koboToInput(kobo: number): string {
    const naira = (kobo / 100).toFixed(2);
    return naira.endsWith('.00') ? naira.slice(0, -3) : naira;
}

/**
 * Clean what was typed into the amount field: digits and at most one dot, at most two decimals.
 * "12,500.555" becomes "12500.55"; "abc" becomes "".
 */
export function cleanAmountInput(raw: string): string {
    const stripped = raw.replace(/[^0-9.]/g, '');
    const [whole, ...rest] = stripped.split('.');
    if (rest.length === 0) return whole;
    return `${whole}.${rest.join('').slice(0, 2)}`;
}

/** "2026-10" as "October 2026". */
export function monthLabel(month: string): string {
    const [year, mm] = month.split('-').map(Number);
    return new Date(Date.UTC(year, mm - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Move a "Y-m" month forwards or backwards, across year ends. */
export function shiftMonth(month: string, delta: number): string {
    const [year, mm] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, mm - 1 + delta, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The current month as "Y-m" in the browser's time zone. */
export function currentMonth(now: Date = new Date()): string {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Today as "Y-m-d" in the browser's time zone, for a date input's default and max. */
export function today(now: Date = new Date()): string {
    return `${currentMonth(now)}-${String(now.getDate()).padStart(2, '0')}`;
}

export type MonthGroup<T extends ExpenseLike> = { month: string; label: string; total: number; items: T[] };

/** Group already-sorted expenses under their month, keeping their order, with each month's total in kobo. */
export function groupByMonth<T extends ExpenseLike>(items: T[]): MonthGroup<T>[] {
    const groups: MonthGroup<T>[] = [];

    for (const item of items) {
        const month = item.incurred_on.slice(0, 7);
        let group = groups[groups.length - 1];

        if (!group || group.month !== month) {
            group = { month, label: monthLabel(month), total: 0, items: [] };
            groups.push(group);
        }

        group.items.push(item);
        group.total += item.amount;
    }

    return groups;
}

/** "2026-10-04" as { day: "04", weekday: "Sun" } for the date chip on a row. */
export function dateParts(date: string): { day: string; weekday: string } {
    const [year, month, day] = date.split('-').map(Number);
    return {
        day: String(day).padStart(2, '0'),
        weekday: new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
    };
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export type PickedFiles = { accepted: File[]; problems: string[] };

/** Keep the files that can be uploaded and explain the ones that cannot, before anything is sent. */
export function pickReceipts(existing: File[], incoming: File[], maxFiles: number, maxMb: number): PickedFiles {
    const accepted: File[] = [];
    const problems: string[] = [];

    for (const file of incoming) {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            problems.push(`${file.name} is not a JPG, PNG, WEBP or PDF file.`);
        } else if (file.size > maxMb * 1024 * 1024) {
            problems.push(`${file.name} is larger than ${maxMb} MB.`);
        } else if (existing.length + accepted.length >= maxFiles) {
            problems.push(`Only ${maxFiles} receipts can be attached at a time.`);
        } else {
            accepted.push(file);
        }
    }

    return { accepted, problems };
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
