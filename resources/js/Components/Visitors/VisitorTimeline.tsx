import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, CheckCircle2, Users } from 'lucide-react';
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
        <div className="sticky top-0 z-10 mb-1 flex items-center justify-between border-b border-slate-100/90 bg-white/95 py-1.5 backdrop-blur-xs">
            <div className="flex items-baseline gap-2">
                <span
                    className={`text-[11px] font-bold tracking-wider uppercase ${
                        isToday ? 'text-indigo-600' : isPast ? 'font-medium text-slate-400' : 'font-bold text-slate-700'
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

            <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                {group.items.length} {group.items.length === 1 ? 'visit' : 'visits'}
            </span>
        </div>
    );
}

function DefaultEmptyState({ variant }: { variant: TimelineVariant }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                {variant === 'upcoming' ? <Calendar className="h-4 w-4" /> : <Users className="h-4 w-4" />}
            </div>
            {variant === 'upcoming' ? (
                <>
                    <p className="text-xs font-semibold text-slate-700">No visits scheduled</p>
                    <p className="mt-0.5 text-[11px] font-normal text-slate-400">Your schedule is clear. Create a pass to invite visitors.</p>
                </>
            ) : (
                <>
                    <p className="text-xs font-semibold text-slate-700">No history found</p>
                    <p className="mt-0.5 text-[11px] font-normal text-slate-400">Completed and expired visitor records will appear here.</p>
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="space-y-4"
            >
                {groups.map((group) => (
                    <div key={group.date} className="relative">
                        <DateGroupHeading group={group} />

                        {group.items.length === 0 ? (
                            <div className="flex items-center gap-2 px-2 py-2 text-xs font-normal text-slate-400 italic">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 not-italic" />
                                <span>No visits scheduled today.</span>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
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
