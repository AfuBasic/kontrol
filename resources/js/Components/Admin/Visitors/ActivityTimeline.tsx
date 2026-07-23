import { useMemo, useState } from 'react';
import { ChevronRight, ExternalLink, LogIn, LogOut } from 'lucide-react';
import EmptyState from '@/Components/States/EmptyState';
import RecordDetailChain from './RecordDetailChain';
import {
    buildActivityEvents,
    formatStayDuration,
    groupEventsByDay,
    hasActiveVisitorFilters,
    type ActivityEvent,
    type ActivityEventType,
    type VisitorFilters,
    type VisitorRecord,
} from './types';

type Props = {
    logs: VisitorRecord[];
    filters: VisitorFilters;
    checkoutEnabled: boolean;
    onSelect: (record: VisitorRecord) => void;
};

/** Strong ease-out for open/close — snappy, not floaty */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

/**
 * Vertical activity timeline.
 *
 * Visual language:
 * - One continuous left spine for the whole feed
 * - Day markers as labels on that spine (not collapsible cards)
 * - Events as timed nodes on the spine, expandable for custody detail
 */
export default function ActivityTimeline({ logs, filters, checkoutEnabled, onSelect }: Props) {
    const groups = useMemo(() => {
        const events = buildActivityEvents(logs, checkoutEnabled);
        return groupEventsByDay(events);
    }, [logs, checkoutEnabled]);

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
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-5 sm:px-6 sm:py-6">
            {/* Continuous spine — border-l runs through every day + event */}
            <div className="relative border-l-2 border-gray-200">
                {groups.map((group) => (
                    <section key={group.label} className="relative">
                        {/* Day marker on the spine */}
                        <header className="relative flex items-center py-3 first:pt-0">
                            <span
                                className="absolute top-1/2 left-0 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary-500 bg-white ring-[3px] ring-white"
                                aria-hidden
                            />
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pl-5 sm:pl-6">
                                <h3 className="text-xs font-bold tracking-wider text-gray-900 uppercase">
                                    {group.label}
                                </h3>
                                <span className="text-[11px] font-medium text-gray-400">
                                    {group.events.length}{' '}
                                    {group.events.length === 1 ? 'event' : 'events'}
                                </span>
                            </div>
                        </header>

                        <ol>
                            {group.events.map((event, index) => {
                                const previous = index > 0 ? group.events[index - 1] : null;
                                return (
                                    <TimelineEvent
                                        key={event.id}
                                        event={event}
                                        previous={previous}
                                        expanded={expandedEventId === event.id}
                                        checkoutEnabled={checkoutEnabled}
                                        onToggle={() => toggleEvent(event.id)}
                                        onOpenFullRecord={onSelect}
                                    />
                                );
                            })}
                        </ol>
                    </section>
                ))}
            </div>
        </div>
    );
}

function TimelineEvent({
    event,
    previous,
    expanded,
    checkoutEnabled,
    onToggle,
    onOpenFullRecord,
}: {
    event: ActivityEvent;
    previous: ActivityEvent | null;
    expanded: boolean;
    checkoutEnabled: boolean;
    onToggle: () => void;
    onOpenFullRecord: (record: VisitorRecord) => void;
}) {
    const { record, type, timeLabel } = event;
    const hostChanged = !previous || previous.record.host.name !== record.host.name;
    const gateChanged = !previous || previous.record.gate !== record.gate;
    const showHost = hostChanged;
    const showGate = gateChanged && record.gate && record.gate !== 'Main Gate';

    const verb =
        type === 'check_out' ? 'checked out' : checkoutEnabled ? 'checked in' : 'verified';

    const panelId = `event-panel-${event.id}`;
    const isCheckIn = type === 'check_in';

    return (
        <li className="relative">
            {/* Node centered on the spine */}
            <span
                className={`absolute top-[1.35rem] left-0 z-10 flex h-3.5 w-3.5 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-white ring-[3px] ring-white ${
                    isCheckIn ? 'border-primary-500' : 'border-gray-300'
                } ${expanded ? (isCheckIn ? 'bg-primary-50' : 'bg-gray-100') : ''}`}
                aria-hidden
            >
                <span
                    className={`h-1.5 w-1.5 rounded-full ${
                        isCheckIn ? 'bg-primary-500' : 'bg-gray-400'
                    }`}
                />
            </span>

            <div className="pl-5 sm:pl-6">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    className={`group flex w-full cursor-pointer gap-3 rounded-xl px-2 py-2.5 text-left transition-colors duration-150 ease-out active:scale-[0.995] sm:gap-4 sm:px-3 ${
                        expanded ? 'bg-gray-50' : 'hover:bg-gray-50/80'
                    }`}
                >
                    {/* Time sits on the left of the content — classic timeline clock column */}
                    <div className="w-[3.75rem] shrink-0 pt-0.5 sm:w-16">
                        <time
                            dateTime={event.occurredAt}
                            className="block text-xs font-semibold tabular-nums text-gray-600"
                        >
                            {timeLabel}
                        </time>
                        <EventTypeLabel type={type} checkoutEnabled={checkoutEnabled} />
                    </div>

                    <span
                        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                            isCheckIn
                                ? 'border-primary-200 bg-primary-50 text-primary-600'
                                : 'border-gray-200 bg-gray-100 text-gray-600'
                        }`}
                        aria-hidden
                    >
                        {isCheckIn ? (
                            <LogIn className="h-3.5 w-3.5" />
                        ) : (
                            <LogOut className="h-3.5 w-3.5" />
                        )}
                    </span>

                    <div className="min-w-0 flex-1 pt-0.5">
                        <p className="text-sm leading-snug text-gray-900">
                            <span className="font-semibold">{record.visitor.name}</span>
                            <span className="font-medium text-gray-600"> {verb}</span>
                            {type === 'check_in' && showHost ? (
                                <>
                                    <span className="font-medium text-gray-600">, visiting </span>
                                    <span className="font-semibold text-gray-800">{record.host.name}</span>
                                    {record.host.unit ? (
                                        <span className="font-normal text-gray-500">
                                            {' '}
                                            ({record.host.unit})
                                        </span>
                                    ) : null}
                                </>
                            ) : null}
                        </p>

                        {(showGate || (type === 'check_out' && showHost && !expanded)) && (
                            <p className="mt-0.5 text-[11px] font-medium text-gray-400">
                                {type === 'check_out' && showHost ? `Host: ${record.host.name}` : null}
                                {type === 'check_out' && showHost && showGate ? ' · ' : null}
                                {showGate ? record.gate : null}
                            </p>
                        )}
                    </div>

                    <ChevronRight
                        className={`mt-1 h-4 w-4 shrink-0 text-gray-300 transition-transform duration-200 group-hover:text-gray-500 ${
                            expanded ? 'rotate-90 text-gray-500' : ''
                        }`}
                        style={{ transitionTimingFunction: EASE_OUT }}
                        aria-hidden
                    />
                </button>

                {/* Expanded custody detail — hangs off the event, spine stays continuous */}
                <div
                    id={panelId}
                    className="grid transition-[grid-template-rows] duration-200 motion-reduce:transition-none"
                    style={{
                        gridTemplateRows: expanded ? '1fr' : '0fr',
                        transitionTimingFunction: EASE_OUT,
                    }}
                >
                    <div className="min-h-0 overflow-hidden">
                        <div className="px-2 pb-4 sm:px-3">
                            <div className="ml-[4.5rem] space-y-3 rounded-xl border border-gray-200 bg-white p-3.5 sm:ml-[5.75rem]">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-gray-500">
                                    {record.purpose ? <span>{record.purpose}</span> : null}
                                    {record.duration_minutes != null ? (
                                        <span className="tabular-nums">
                                            Stay {formatStayDuration(record.duration_minutes)}
                                        </span>
                                    ) : null}
                                    {record.gate && record.gate !== 'Main Gate' ? (
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

function EventTypeLabel({
    type,
    checkoutEnabled,
}: {
    type: ActivityEventType;
    checkoutEnabled: boolean;
}) {
    if (type === 'check_out') {
        return (
            <span className="mt-0.5 block text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                Out
            </span>
        );
    }

    return (
        <span className="mt-0.5 block text-[10px] font-bold tracking-wide text-primary-600/80 uppercase">
            {checkoutEnabled ? 'In' : 'Gate'}
        </span>
    );
}
