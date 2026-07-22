import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle, Users } from 'lucide-react';
import { useMemo } from 'react';
import type { AccessCode, VisitorTimelineGroup } from '@/types/access-code';
import VisitorAgendaCard, { type VisitorAgendaCardProps } from './VisitorAgendaCard';
import { useVisitorTimeline } from './useVisitorTimeline';

export type TimelineVariant = 'upcoming' | 'history';

export type VisitorTimelineProps = {
    codes: AccessCode[];
    variant: TimelineVariant;
    statusMap?: VisitorAgendaCardProps['statusMap'];
    renderCardMeta?: VisitorAgendaCardProps['renderMeta'];
    renderCardActions?: VisitorAgendaCardProps['renderActions'];
    getCardHref?: (code: AccessCode) => string;
    emptyState?: React.ReactNode;
    maxGroups?: number;
    preGrouped?: VisitorTimelineGroup[];
    alwaysShowToday?: boolean;
};

function DateGroupHeading({ group }: { group: VisitorTimelineGroup }) {
    const isToday = group.label === 'Today';
    const isYesterday = group.label === 'Yesterday';
    const isPast = isYesterday || (!isToday && new Date(group.date + 'T00:00:00') < new Date());

    return (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white/90 py-2 backdrop-blur-xs">
            <div className="flex items-baseline gap-2">
                <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                        isToday
                            ? 'text-indigo-600'
                            : isPast
                              ? 'text-slate-400'
                              : 'text-slate-700'
                    }`}
                >
                    {group.label}
                </span>

                {!['Today', 'Tomorrow', 'Yesterday'].includes(group.label) && (
                    <span className="text-[11px] font-medium text-slate-400">
                        {group.weekday}, {group.month} {new Date(group.date + 'T00:00:00').getDate()}
                    </span>
                )}
            </div>

            <div className="h-px flex-1 bg-slate-100" />

            <span className="text-[11px] font-semibold text-slate-300 tabular-nums">
                {group.items.length} {group.items.length === 1 ? 'visit' : 'visits'}
            </span>
        </div>
    );
}

function DefaultEmptyState({ variant }: { variant: TimelineVariant }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-14 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-xs border border-slate-100">
                {variant === 'upcoming' ? (
                    <Calendar className="h-5 w-5" />
                ) : (
                    <Users className="h-5 w-5" />
                )}
            </div>
            {variant === 'upcoming' ? (
                <>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        No visits scheduled
                    </h3>
                    <p className="mt-1 max-w-xs text-xs text-slate-400 font-medium">
                        Your upcoming agenda is clear. Create a pass to invite visitors.
                    </p>
                </>
            ) : (
                <>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        No past visits
                    </h3>
                    <p className="mt-1 max-w-xs text-xs text-slate-400 font-medium">
                        Completed and expired visitor records will appear in your history log.
                    </p>
                </>
            )}
        </div>
    );
}

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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
            >
                {groups.map((group) => (
                    <div key={group.date} className="space-y-1">
                        <DateGroupHeading group={group} />

                        {group.items.length === 0 ? (
                            <div className="flex items-center gap-2 py-3 px-3 text-xs text-slate-400 font-medium italic">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 not-italic" />
                                No visits scheduled today.
                            </div>
                        ) : (
                            <div className="pl-1">
                                {group.items.map((code, idx) => (
                                    <VisitorAgendaCard
                                        key={code.id}
                                        code={code}
                                        statusMap={statusMap}
                                        renderMeta={renderCardMeta}
                                        renderActions={renderCardActions}
                                        href={getCardHref?.(code)}
                                        isLastInGroup={idx === group.items.length - 1}
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
