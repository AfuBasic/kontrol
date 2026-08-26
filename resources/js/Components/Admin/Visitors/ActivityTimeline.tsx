import { useMemo, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import EmptyState from '@/Components/States/EmptyState';
import VisitEventIcon from './VisitEventIcon';
import { ACTIVITY_KINDS, resolveActivityKind } from './activityKinds';
import {
    buildActivityEvents,
    groupEventsByDay,
    hasActiveVisitorFilters,
    type ActivityEvent,
    type VisitorFilters,
    type VisitorRecord,
} from './types';

type Props = {
    logs: VisitorRecord[];
    filters: VisitorFilters;
    checkoutEnabled: boolean;
    onSelect: (record: VisitorRecord) => void;
};

/** Narrow fixed time column - content sits close to the spine */
const TIME_COL = 'w-[3.25rem] shrink-0 sm:w-[3.75rem]';

/**
 * Premium operational activity journal.
 * Dense, scannable, chapter-based days with structured event objects.
 * Clicking any event opens the standardized RecordDetail bottom sheet / modal.
 */
export default function ActivityTimeline({ logs, filters, checkoutEnabled, onSelect }: Props) {
    const groups = useMemo(() => {
        const events = buildActivityEvents(logs, checkoutEnabled);
        return groupEventsByDay(events);
    }, [logs, checkoutEnabled]);

    const showGateWhenVaries = useMemo(() => {
        const gates = new Set(logs.map((log) => log.gate).filter((g): g is string => Boolean(g) && g !== 'Main Gate'));
        return gates.size > 1;
    }, [logs]);

    const hasFilters = hasActiveVisitorFilters(filters);

    if (groups.length === 0) {
        return (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/40">
                <EmptyState
                    title={hasFilters ? 'No matching activity' : 'No visitor activity yet'}
                    description={
                        hasFilters
                            ? 'Try adjusting or clearing your filters.'
                            : 'Gate check-ins will show up here as a timeline once visitors are verified.'
                    }
                    className="py-12"
                />
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {groups.map((group, groupIndex) => (
                <DayChapter key={group.label} label={group.label} eventCount={group.events.length} isFirst={groupIndex === 0}>
                    <ol className="relative ml-0.5 border-l border-gray-200">
                        {group.events.map((event, index) => {
                            const previous = index > 0 ? group.events[index - 1] : null;

                            return (
                                <TimelineEvent
                                    key={event.id}
                                    event={event}
                                    previous={previous}
                                    checkoutEnabled={checkoutEnabled}
                                    showGateWhenVaries={showGateWhenVaries}
                                    onClick={() => onSelect(event.record)}
                                />
                            );
                        })}
                    </ol>
                </DayChapter>
            ))}
        </div>
    );
}

/** Level 1 - Day as chapter. Dominant type; never confusable with an event. */
function DayChapter({ label, eventCount, isFirst, children }: { label: string; eventCount: number; isFirst: boolean; children: ReactNode }) {
    return (
        <section className={isFirst ? '' : 'mt-7 border-t border-gray-200 pt-6 sm:mt-8 sm:pt-7'} aria-labelledby={`day-${slugify(label)}`}>
            <header className="mb-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
                <h3 id={`day-${slugify(label)}`} className="text-lg font-semibold tracking-tight text-gray-950 sm:text-xl">
                    {label}
                </h3>
                <span className="mb-0.5 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-gray-500 uppercase tabular-nums">
                    {eventCount} {eventCount === 1 ? 'event' : 'events'}
                </span>
            </header>
            {children}
        </section>
    );
}

function TimelineEvent({
    event,
    previous,
    checkoutEnabled,
    showGateWhenVaries,
    onClick,
}: {
    event: ActivityEvent;
    previous: ActivityEvent | null;
    checkoutEnabled: boolean;
    showGateWhenVaries: boolean;
    onClick: () => void;
}) {
    const { record, type, timeLabel } = event;
    const hostChanged = !previous || previous.record.host.name !== record.host.name;
    const gateChanged = !previous || previous.record.gate !== record.gate;
    const showHost = hostChanged;
    const showGate = showGateWhenVaries && gateChanged && record.gate && record.gate !== 'Main Gate';

    const kind = resolveActivityKind(type, record, checkoutEnabled);
    const config = ACTIVITY_KINDS[kind];

    return (
        <li className="group/event relative">
            {/* Spine node - scales subtly on hover */}
            <span
                className={`absolute top-[13px] left-0 z-10 h-2 w-2 -translate-x-1/2 rounded-full border-2 bg-white ring-2 ring-white transition-transform duration-150 ease-out group-hover/event:scale-125 ${config.nodeClass}`}
                aria-hidden
            >
                <span className={`absolute inset-0.5 rounded-full ${config.nodeDotClass} opacity-90`} />
            </span>

            <div className="pl-3.5 sm:pl-4">
                <button
                    type="button"
                    onClick={onClick}
                    className="flex w-full cursor-pointer gap-2.5 rounded-lg py-1.5 pr-1.5 pl-0.5 text-left transition-colors duration-150 ease-out hover:bg-gray-50/90 active:scale-[0.995] sm:gap-3"
                >
                    {/* Level 2 - time */}
                    <time
                        dateTime={event.occurredAt}
                        className={`${TIME_COL} pt-0.5 text-right text-[11px] font-semibold tracking-tight text-gray-400 tabular-nums sm:text-xs`}
                    >
                        {timeLabel}
                    </time>

                    {/* Activity glyph */}
                    <span className="mt-0.5 shrink-0 transition-transform duration-150 ease-out group-hover/event:scale-105">
                        <VisitEventIcon kind={kind} size="sm" />
                    </span>

                    {/* Level 3 - structured activity object */}
                    <div className="min-w-0 flex-1">
                        {/* Activity type first - scannable before the name */}
                        <p className={`text-[10px] font-bold tracking-wider uppercase ${config.textClass}`}>{config.label}</p>
                        <p className="mt-0.5 truncate text-sm leading-snug font-semibold text-gray-900">{record.visitor.name}</p>

                        {/* Supporting details - muted metadata layer */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0 text-[11px] font-medium text-gray-500">
                            {type === 'check_in' && showHost ? (
                                <span className="truncate">
                                    Visiting {record.host.name}
                                    {record.host.unit ? <span className="text-gray-400"> · {record.host.unit}</span> : null}
                                </span>
                            ) : null}
                            {type === 'check_out' && showHost ? <span className="truncate text-gray-400">Host: {record.host.name}</span> : null}
                            {showGate ? (
                                <>
                                    {(showHost || type === 'check_out') && (
                                        <span className="text-gray-300" aria-hidden>
                                            ·
                                        </span>
                                    )}
                                    <span>{record.gate}</span>
                                </>
                            ) : null}
                            {record.vehicle?.plate ? (
                                <>
                                    <span className="text-gray-300" aria-hidden>
                                        ·
                                    </span>
                                    <span className="font-mono text-[10px] text-gray-400">{record.vehicle.plate}</span>
                                </>
                            ) : null}
                        </div>
                    </div>

                    <ChevronRight
                        className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300 transition-transform duration-200 group-hover/event:text-gray-500"
                        aria-hidden
                    />
                </button>
            </div>
        </li>
    );
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}
