import type { AccessCode, VisitorTimelineGroup } from '@/types/access-code';

/**
 * Determines the natural-language label for a date relative to today.
 *
 * Decision 7: All relative labels ("Today", "Tomorrow", weekday names) are
 * derived from the ISO date string that was already calculated server-side
 * using the application timezone. The browser never influences grouping.
 *
 * @param isoDate  YYYY-MM-DD string (arrival_date or completion_date)
 * @param todayISO YYYY-MM-DD string for today, passed in from the caller
 */
function buildDateLabel(isoDate: string, todayISO: string): string {
    const date = new Date(isoDate + 'T00:00:00'); // parse as local midnight
    const today = new Date(todayISO + 'T00:00:00');

    const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    if (diffDays > 1 && diffDays <= 6) {
        // Within the next 6 days: show weekday name ("Friday")
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    if (diffDays < -1 && diffDays >= -6) {
        // Within the past 6 days: show weekday name ("Monday")
        return date.toLocaleDateString('en-US', { weekday: 'long' });
    }

    if (diffDays > 6 && diffDays <= 13) {
        // Next week: "Next [Weekday]"
        return `Next ${date.toLocaleDateString('en-US', { weekday: 'long' })}`;
    }

    // Older / far future: "July 30" or "August 2"
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

/**
 * The single grouping utility for the Visitor Timeline.
 *
 * Transforms a flat array of AccessCode objects into calendar-ready
 * VisitorTimelineGroup buckets. This is the source of truth for both:
 *   • Agenda View   (current)
 *   • Calendar View (future - consumes the same groups, different renderer)
 *
 * Decision 6: Every group exposes date, label, weekday, month, and year so
 * that Calendar View can be built without any recalculation.
 *
 * Decision 7: Grouping is always based on the server-computed arrival_date or
 * completion_date fields (never raw Date arithmetic in the browser) to ensure
 * timezone consistency across all user roles.
 *
 * @param codes      Flat list of AccessCode objects from the server
 * @param dateField  Which date field to group by:
 *                   'arrival_date'    → Upcoming tab
 *                   'completion_date' → History tab
 * @param todayISO   ISO date string for "today" - pass new Date().toISOString().slice(0,10)
 */
export function groupVisitorsByDate(
    codes: AccessCode[],
    dateField: 'arrival_date' | 'completion_date',
    todayISO: string,
): VisitorTimelineGroup[] {
    // Build a map of dateString → AccessCode[]
    const buckets = new Map<string, AccessCode[]>();

    for (const code of codes) {
        const date: string | undefined | null = code[dateField];

        // Skip items that don't have the requested date field populated
        // (e.g., upcoming items won't have completion_date)
        if (!date) continue;

        if (!buckets.has(date)) {
            buckets.set(date, []);
        }
        buckets.get(date)!.push(code);
    }

    // Build and sort groups
    const groups: VisitorTimelineGroup[] = [];

    for (const [isoDate, items] of buckets.entries()) {
        const parsed = new Date(isoDate + 'T00:00:00');

        groups.push({
            date: isoDate,
            label: buildDateLabel(isoDate, todayISO),
            weekday: parsed.toLocaleDateString('en-US', { weekday: 'long' }),
            month: parsed.toLocaleDateString('en-US', { month: 'long' }),
            year: parsed.getFullYear(),
            items,
        });
    }

    // Upcoming: ascending (earliest first, Today pinned at top)
    // History: descending (most recent first)
    if (dateField === 'arrival_date') {
        groups.sort((a, b) => a.date.localeCompare(b.date));
    } else {
        groups.sort((a, b) => b.date.localeCompare(a.date));
    }

    return groups;
}

/**
 * React hook wrapper around groupVisitorsByDate.
 *
 * Memoisation is intentionally omitted here - the caller's useMemo is
 * more appropriate as it can key off the correct dependencies.
 */
export function useVisitorTimeline(
    codes: AccessCode[],
    dateField: 'arrival_date' | 'completion_date',
): VisitorTimelineGroup[] {
    const todayISO = new Date().toISOString().slice(0, 10);
    return groupVisitorsByDate(codes, dateField, todayISO);
}
