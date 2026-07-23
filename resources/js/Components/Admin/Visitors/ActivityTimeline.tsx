import { useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import EmptyState from '@/Components/States/EmptyState';
import RecordDetailChain from './RecordDetailChain';
import VisitEventIcon from './VisitEventIcon';
import {
    buildActivityEvents,
    formatStayDuration,
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

const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

/** Fixed width for the time column — the visual anchor of every event row */
const TIME_COL = 'w-[4.5rem] shrink-0 sm:w-[5.25rem]';

/**
 * Chronological activity journal with three-level hierarchy:
 * 1. Date groups (chapters) — dominant, never confusable with events
 * 2. Time — fixed-width column, the scan anchor
 * 3. Event body — name / action / host, not a single run-on sentence
 *
 * Each day owns an independent spine; connectors do not run through day breaks.
 */
export default function ActivityTimeline({ logs, filters, checkoutEnabled, onSelect }: Props) {
    const groups = useMemo(() => {
        const events = buildActivityEvents(logs, checkoutEnabled);
        return groupEventsByDay(events);
    }, [logs, checkoutEnabled]);

    const showGateWhenVaries = useMemo(() => {
        const gates = new Set(
            logs.map((log) => log.gate).filter((g): g is string => Boolean(g) && g !== 'Main Gate')
        );
        return gates.size > 1;
    }, [logs]);

    const hasFilters = hasActiveVisitorFilters(filters);
    const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

    const toggleEvent = (eventId: string) => {
        setExpandedEventId((current) => (current === eventId ? null : eventId));
    };

    if (groups.length === 0) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white">
                <EmptyState
                    title={hasFilters ? 'No matching activity' : 'No visitor activity yet'}
                    description={
                        hasFilters
                            ? 'Try adjusting or clearing your filters.'
                            : 'Gate check-ins will show up here as a timeline once visitors are verified.'
                    }
                    className="py-14"
                />
            </div>
        );
    }

    return (
        <div className="space-y-0">
            {groups.map((group, groupIndex) => (
                <DayChapter
                    key={group.label}
                    label={group.label}
                    eventCount={group.events.length}
                    isFirst={groupIndex === 0}
                >
                    <ol className="relative border-l border-gray-200">
                        {group.events.map((event, index) => {
                            const previous = index > 0 ? group.events[index - 1] : null;
                            const isLast = index === group.events.length - 1;

                            return (
                                <TimelineEvent
                                    key={event.id}
                                    event={event}
                                    previous={previous}
                                    isLast={isLast}
                                    expanded={expandedEventId === event.id}
                                    checkoutEnabled={checkoutEnabled}
                                    showGateWhenVaries={showGateWhenVaries}
                                    onToggle={() => toggleEvent(event.id)}
                                    onOpenFullRecord={onSelect}
                                />
                            );
                        })}
                    </ol>
                </DayChapter>
            ))}
        </div>
    );
}

/**
 * Level 1 — Date group as a chapter break.
 * Large type, heavy weight, generous top space, hairline separator.
 * Must never read as another timeline event.
 */
function DayChapter({
    label,
    eventCount,
    isFirst,
    children,
}: {
    label: string;
    eventCount: number;
    isFirst: boolean;
    children: ReactNode;
}) {
    return (
        <section
            className={isFirst ? 'pt-0' : 'mt-10 border-t border-gray-200 pt-8 sm:mt-12 sm:pt-10'}
            aria-labelledby={`day-${slugify(label)}`}
        >
            <header className="mb-5 sm:mb-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h3
                        id={`day-${slugify(label)}`}
                        className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl"
                    >
                        {formatDayChapterLabel(label)}
                    </h3>
                    <span className="text-xs font-medium tabular-nums text-gray-400">
                        {eventCount} {eventCount === 1 ? 'event' : 'events'}
                    </span>
                </div>
            </header>

            {/* Independent spine for this day only — broken between chapters */}
            <div className="pl-0 sm:pl-0.5">{children}</div>
        </section>
    );
}

function TimelineEvent({
    event,
    previous,
    isLast,
    expanded,
    checkoutEnabled,
    showGateWhenVaries,
    onToggle,
    onOpenFullRecord,
}: {
    event: ActivityEvent;
    previous: ActivityEvent | null;
    isLast: boolean;
    expanded: boolean;
    checkoutEnabled: boolean;
    showGateWhenVaries: boolean;
    onToggle: () => void;
    onOpenFullRecord: (record: VisitorRecord) => void;
}) {
    const { record, type, timeLabel } = event;
    const hostChanged = !previous || previous.record.host.name !== record.host.name;
    const gateChanged = !previous || previous.record.gate !== record.gate;
    const showHost = hostChanged;
    const showGate =
        showGateWhenVaries && gateChanged && record.gate && record.gate !== 'Main Gate';

    const actionLabel =
        type === 'check_out' ? 'Checked out' : checkoutEnabled ? 'Checked in' : 'Verified';

    const panelId = `event-panel-${event.id}`;
    const isCheckIn = type === 'check_in';

    return (
        <li className={`relative ${isLast ? 'pb-0' : 'pb-1'}`}>
            {/* Node on this day's spine only */}
            <span
                className={`absolute top-[1.125rem] left-0 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 bg-white ring-[3px] ring-white ${
                    isCheckIn ? 'border-primary-500' : 'border-gray-300'
                }`}
                aria-hidden
            />

            <div className="pl-5 sm:pl-6">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className={`group flex w-full cursor-pointer gap-3 rounded-xl py-2 pr-1 text-left transition-colors duration-150 ease-out active:scale-[0.995] sm:gap-4 sm:pr-2 ${
                        expanded ? 'bg-gray-50/90' : 'hover:bg-gray-50/70'
                    }`}
                >
                    {/* Level 2 — fixed-width time column */}
                    <time
                        dateTime={event.occurredAt}
                        className={`${TIME_COL} pt-0.5 text-left text-sm font-semibold tabular-nums tracking-tight text-gray-500`}
                    >
                        {timeLabel}
                    </time>

                    <VisitEventIcon type={type} size="sm" />

                    {/* Level 3 — structured event body */}
                    <div className="min-w-0 flex-1 pt-0.5">
                        <p className="truncate text-[15px] font-semibold leading-snug text-gray-900">
                            {record.visitor.name}
                        </p>
                        <p
                            className={`mt-0.5 text-xs font-medium ${
                                isCheckIn ? 'text-primary-700' : 'text-gray-500'
                            }`}
                        >
                            {actionLabel}
                        </p>
                        {type === 'check_in' && showHost ? (
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-500">
                                Visiting {record.host.name}
                                {record.host.unit ? (
                                    <span className="text-gray-400"> · {record.host.unit}</span>
                                ) : null}
                            </p>
                        ) : null}
                        {type === 'check_out' && showHost && !expanded ? (
                            <p className="mt-0.5 truncate text-xs font-medium text-gray-400">
                                Host: {record.host.name}
                            </p>
                        ) : null}
                        {showGate ? (
                            <p className="mt-0.5 text-xs font-medium text-gray-400">{record.gate}</p>
                        ) : null}
                    </div>

                    <ChevronRight
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 group-hover:text-gray-500 ${
                            expanded ? 'rotate-90 text-gray-500' : ''
                        }`}
                        style={{ transitionTimingFunction: EASE_OUT }}
                        aria-hidden
                    />
                </button>

                <div
                    id={panelId}
                    className="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
                    style={{
                        gridTemplateRows: expanded ? '1fr' : '0fr',
                        transitionTimingFunction: EASE_OUT,
                    }}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className={`pb-3 pl-0 ${isLast ? 'pb-1' : ''}`}>
                            <div
                                className={`ml-[calc(4.5rem+2.25rem)] space-y-3 rounded-xl border border-gray-200 bg-white p-3.5 sm:ml-[calc(5.25rem+2.5rem)]`}
                            >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500">
                                    {record.purpose ? <span>{record.purpose}</span> : null}
                                    {record.duration_minutes != null ? (
                                        <span className="tabular-nums">
                                            Stay {formatStayDuration(record.duration_minutes)}
                                        </span>
                                    ) : null}
                                    {showGateWhenVaries && record.gate && record.gate !== 'Main Gate' ? (
                                        <span>{record.gate}</span>
                                    ) : null}
                                    {record.code ? (
                                        <span className="font-mono text-gray-400">#{record.code}</span>
                                    ) : null}
                                </div>

                                <RecordDetailChain record={record} checkoutEnabled={checkoutEnabled} />

                                <div className="flex justify-end border-t border-gray-100 pt-2.5">
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onOpenFullRecord(record);
                                        }}
                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-primary-700 transition-colors duration-150 ease-out hover:bg-primary-50 active:scale-[0.97]"
                                    >
                                        Open full record
                                        <ExternalLink className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}

/** Present day labels as chapter titles — Today / Yesterday stay short; others get full weight. */
function formatDayChapterLabel(label: string): string {
    if (label === 'Today' || label === 'Yesterday') {
        return label;
    }
    return label;
}

function slugify(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
