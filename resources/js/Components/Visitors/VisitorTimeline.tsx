import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { AccessCode, VisitorTimelineGroup } from '@/types/access-code';
import VisitorAgendaCard, { type VisitorAgendaCardProps } from './VisitorAgendaCard';
import { useVisitorTimeline } from './useVisitorTimeline';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TimelineVariant = 'upcoming' | 'history';

/**
 * VisitorTimeline props.
 *
 * Decision 5: This component is completely role-agnostic. It accepts render
 * props / configuration objects for all role-specific wording and behaviour.
 * The exact same component can power:
 *
 *   • Resident Visitor Passes         (variant="upcoming" | "history")
 *   • Security Expected Visitors      (variant="upcoming", custom statusMap)
 *   • Estate Visitor Schedule         (variant="upcoming", custom renderActions)
 *   • Dashboard widgets               (limit groups, custom emptyState)
 *   • Calendar View (future)          (groups already pre-built externally)
 */
export type VisitorTimelineProps = {
    /** Flat list of passes from the server. The component groups them internally. */
    codes: AccessCode[];

    /**
     * Controls which date field is used for grouping:
     *   'upcoming' → arrival_date  (Today pinned first)
     *   'history'  → completion_date (most recent first)
     */
    variant: TimelineVariant;

    // ── Role-agnostic configuration ──────────────────────────────────────────

    /** Override the status label/colour map. Defaults to resident wording. */
    statusMap?: VisitorAgendaCardProps['statusMap'];

    /** Secondary metadata rendered below each visitor's name. */
    renderCardMeta?: VisitorAgendaCardProps['renderMeta'];

    /** Actions rendered on the right of each card. */
    renderCardActions?: VisitorAgendaCardProps['renderActions'];

    /**
     * Generate the href for each card. Receives the AccessCode and must return
     * a URL string. Defaults to null (non-navigable card).
     */
    getCardHref?: (code: AccessCode) => string;

    /** Rendered when no passes exist at all. */
    emptyState?: React.ReactNode;

    /** When provided, only this many groups are rendered (for widget use). */
    maxGroups?: number;

    /**
     * Pre-grouped data. When supplied, skips internal grouping.
     * Useful for Calendar View or when the host already groups externally.
     */
    preGrouped?: VisitorTimelineGroup[];

    /** Show the "Today" group heading even when there are no passes today. Default: false. */
    alwaysShowToday?: boolean;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function DateGroupHeading({ group }: { group: VisitorTimelineGroup }) {
    const isToday = group.label === 'Today';
    const isYesterday = group.label === 'Yesterday';
    const isPast = isYesterday || (!isToday && new Date(group.date + 'T00:00:00') < new Date());

    return (
        <div className="flex items-center gap-3 px-1 mb-1">
            <div className="flex flex-col leading-none">
                <span
                    className={`text-[11px] font-bold tracking-wider uppercase ${
                        isToday
                            ? 'text-indigo-600'
                            : isPast
                              ? 'text-slate-400'
                              : 'text-slate-500'
                    }`}
                >
                    {group.label}
                </span>
                {/* Show absolute date for non-relative headings */}
                {!['Today', 'Tomorrow', 'Yesterday'].includes(group.label) && (
                    <span className="text-[10px] text-slate-300 font-medium mt-0.5">
                        {group.weekday}, {group.month} {new Date(group.date + 'T00:00:00').getDate()}
                    </span>
                )}
            </div>
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] text-slate-300 font-semibold tabular-nums">
                {group.items.length}
            </span>
        </div>
    );
}

function DefaultEmptyState({ variant }: { variant: TimelineVariant }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
                {variant === 'upcoming' ? (
                    <Calendar className="h-5 w-5" />
                ) : (
                    <Users className="h-5 w-5" />
                )}
            </div>
            {variant === 'upcoming' ? (
                <>
                    <h3 className="text-sm font-semibold text-slate-900">No upcoming visitors</h3>
                    <p className="mt-1 max-w-xs text-xs leading-normal text-slate-400">
                        Create a visitor pass to invite guests, workers, or delivery riders.
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-sm font-semibold text-slate-900">No visit history yet</h3>
                    <p className="mt-1 max-w-xs text-xs leading-normal text-slate-400">
                        Completed and expired passes will appear here.
                    </p>
                </>
            )}
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────────

/**
 * VisitorTimeline — the shared, role-agnostic Visitor Timeline component.
 *
 * Renders an Apple Calendar-style agenda view grouped by natural date headings.
 * Powers all Visitor Timeline surfaces in the application without duplication.
 */
export default function VisitorTimeline({
    codes,
    variant,
    statusMap,
    renderCardMeta,
    renderCardActions,
    getCardHref,
    emptyState,
    maxGroups,
    preGrouped,
    alwaysShowToday = false,
}: VisitorTimelineProps) {
    const dateField = variant === 'upcoming' ? 'arrival_date' : 'completion_date';

    // Use pre-grouped data when provided (Calendar View), otherwise group internally.
    const internalGroups = useVisitorTimeline(preGrouped ? [] : codes, dateField);
    const rawGroups = preGrouped ?? internalGroups;

    const groups = useMemo(() => {
        let result = rawGroups.filter((g) => g.items.length > 0);

        if (alwaysShowToday && variant === 'upcoming') {
            const todayISO = new Date().toISOString().slice(0, 10);
            const hasToday = result.some((g) => g.date === todayISO);
            if (!hasToday) {
                const todayDate = new Date();
                result = [
                    {
                        date: todayISO,
                        label: 'Today',
                        weekday: todayDate.toLocaleDateString('en-US', { weekday: 'long' }),
                        month: todayDate.toLocaleDateString('en-US', { month: 'long' }),
                        year: todayDate.getFullYear(),
                        items: [],
                    },
                    ...result,
                ];
            }
        }

        return maxGroups ? result.slice(0, maxGroups) : result;
    }, [rawGroups, alwaysShowToday, variant, maxGroups]);

    if (groups.length === 0) {
        return <>{emptyState ?? <DefaultEmptyState variant={variant} />}</>;
    }

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={variant}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-5"
            >
                {groups.map((group) => (
                    <div key={group.date} className="space-y-0.5">
                        <DateGroupHeading group={group} />

                        {group.items.length === 0 ? (
                            // Shown only when alwaysShowToday is true and Today is empty
                            <div className="px-3.5 py-3 text-xs text-slate-400 italic">
                                No visitors today
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-100 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden divide-y divide-slate-50">
                                {group.items.map((code) => (
                                    <VisitorAgendaCard
                                        key={code.id}
                                        code={code}
                                        statusMap={statusMap}
                                        renderMeta={renderCardMeta}
                                        renderActions={renderCardActions}
                                        href={getCardHref?.(code)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </motion.div>
        </AnimatePresence>
    );
}
