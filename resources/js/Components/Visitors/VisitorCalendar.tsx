import { Link, router } from '@inertiajs/react';
import {
    addMonths,
    subMonths,
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO,
} from 'date-fns';
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    Search,
    User,
    Copy,
    Check,
    X,
    Info,
    Calendar as CalendarIcon,
} from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { getPurposeColorStyle } from '@/Utils/calendarTheme';

export type VisitorCalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay?: boolean;
    extendedProps: {
        code: string;
        visitor_name: string;
        visitor_phone?: string;
        purpose: string;
        type: string;
        status: string;
        host_name?: string;
        used_at?: string | null;
        expires_at?: string | null;
        is_valid?: boolean;
    };
};

type VisitorCalendarProps = {
    eventsUrl: string;
    backUrl: string;
    backLabel?: string;
    isAdmin?: boolean;
    hosts?: { id: number; name: string }[];
    createUrl?: string;
    initialFilters?: {
        purpose?: string;
        status?: string;
        search?: string;
        user_id?: string;
    };
};

const PURPOSES = ['All', 'Family', 'Friends', 'Maintenance', 'Delivery', 'Healthcare', 'Business'];

/**
 * Returns category-specific chip styling when active, using the same color
 * palette as getPurposeColorStyle. Inactive chips share a single muted style.
 */
function getCategoryChipStyle(purpose: string, isActive: boolean) {
    if (!isActive) {
        return 'bg-gray-100 text-gray-500 hover:bg-gray-200';
    }
    if (purpose === 'All') {
        return 'bg-gray-800 text-white shadow-xs';
    }
    const style = getPurposeColorStyle(purpose);
    // Active chip uses the category's own bg/text at medium weight
    return `${style.bg} ${style.text} ${style.border} border shadow-xs font-extrabold`;
}

/** Legend items — same categories as purpose chips, mapped to their dot colors */
const LEGEND_ITEMS = [
    { label: 'Family', purpose: 'Family' },
    { label: 'Friends', purpose: 'Friends' },
    { label: 'Maintenance', purpose: 'Maintenance' },
    { label: 'Delivery', purpose: 'Delivery' },
    { label: 'Healthcare', purpose: 'Healthcare' },
    { label: 'Business', purpose: 'Business' },
];

export default function VisitorCalendar({
    eventsUrl,
    backUrl,
    backLabel = 'Timeline',
    isAdmin = false,
    hosts = [],
    createUrl = '/resident/visitors/create',
    initialFilters,
}: VisitorCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [events, setEvents] = useState<VisitorCalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // Filters
    const [selectedPurpose, setSelectedPurpose] = useState<string>(initialFilters?.purpose || 'All');
    const [selectedHostId, setSelectedHostId] = useState<string>(initialFilters?.user_id || 'All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Calculate grid dates for current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    // Fetch events when month or filters change
    useEffect(() => {
        let isMounted = true;
        const fetchEventsData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    start: startDate.toISOString(),
                    end: endDate.toISOString(),
                });

                if (selectedPurpose !== 'All') {
                    params.append('purpose', selectedPurpose);
                }
                if (isAdmin && selectedHostId !== 'All') {
                    params.append('user_id', selectedHostId);
                }
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }

                // Read XSRF token from cookie (set by Laravel)
                const xsrfMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
                const xsrfToken = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : '';

                const response = await fetch(`${eventsUrl}?${params.toString()}`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
                    },
                });

                if (!response.ok) {
                    console.error('Calendar fetch failed:', response.status, response.statusText);
                    return;
                }

                const data = await response.json();
                if (isMounted) {
                    setEvents(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Failed to fetch calendar events', err);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchEventsData();
        return () => {
            isMounted = false;
        };
    }, [currentMonth, selectedPurpose, selectedHostId, searchQuery, eventsUrl]);

    // Map events by date key
    const eventsByDate = useMemo(() => {
        const map: Record<string, VisitorCalendarEvent[]> = {};
        events.forEach((ev) => {
            if (!ev.start) return;
            const dateStr = format(parseISO(ev.start), 'yyyy-MM-dd');
            if (!map[dateStr]) {
                map[dateStr] = [];
            }
            map[dateStr].push(ev);
        });
        return map;
    }, [events]);

    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const selectedDateEvents = eventsByDate[selectedDateStr] || [];

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const goToday = () => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDate(now);
    };

    return (
        <div className="mx-auto max-w-md sm:max-w-2xl px-3 py-2 space-y-3 pb-24">

            {/* ─── Top Bar ─── */}
            <div className="flex items-center justify-between">
                <Link
                    href={backUrl}
                    className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition active:scale-95"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{backLabel}</span>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`rounded-full p-2 transition active:scale-95 ${
                            showSearch
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => router.get(createUrl)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-600 transition active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            {/* ─── Month Title + Navigation ─── */}
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">
                        {format(currentMonth, 'MMMM')}
                    </h1>
                    <span className="text-sm font-medium text-gray-400">
                        {format(currentMonth, 'yyyy')}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={goToday}
                        className="rounded-lg px-2 py-0.5 text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                        className="rounded-full p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition active:scale-95"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ─── Search (expandable) ─── */}
            {showSearch && (
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search visitor name, code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-8 py-2 text-xs font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:border-gray-300 focus:ring-0 shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {/* ─── Category Chips (colored when active) ─── */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                {PURPOSES.map((purpose) => (
                    <button
                        key={purpose}
                        onClick={() => setSelectedPurpose(purpose)}
                        className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all shrink-0 ${getCategoryChipStyle(purpose, selectedPurpose === purpose)}`}
                    >
                        {purpose}
                    </button>
                ))}
            </div>

            {/* ─── Admin Host Filter ─── */}
            {isAdmin && hosts.length > 0 && (
                <select
                    value={selectedHostId}
                    onChange={(e) => setSelectedHostId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white py-1.5 px-3 text-xs font-semibold text-gray-700 focus:ring-0 shadow-2xs"
                >
                    <option value="All">All Resident Hosts</option>
                    {hosts.map((host) => (
                        <option key={host.id} value={host.id}>
                            {host.name}
                        </option>
                    ))}
                </select>
            )}

            {/* ─── View Toggle (Month / Agenda) — plain text, not pills ─── */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-1.5">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`text-xs font-bold pb-1.5 -mb-1.5 border-b-2 transition ${
                        viewMode === 'grid'
                            ? 'text-gray-900 border-gray-900'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                >
                    Month
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`text-xs font-bold pb-1.5 -mb-1.5 border-b-2 transition ${
                        viewMode === 'list'
                            ? 'text-gray-900 border-gray-900'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                >
                    Agenda
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════
                MONTH GRID VIEW
               ═══════════════════════════════════════════════════ */}
            {viewMode === 'grid' && (
                <div className="space-y-3">
                    {/* Grid Card */}
                    <div className="rounded-2xl bg-white p-2">
                        {/* Weekday Header — small, uppercase, muted (#7) */}
                        <div className="grid grid-cols-7 mb-1 text-center">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                <div
                                    key={idx}
                                    className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 py-1"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Day Cells — compact, no borders, spacing-based (#2, #5) */}
                        <div className="grid grid-cols-7 text-center">
                            {calendarDays.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayEventsList = eventsByDate[dateStr] || [];
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isSelected = isSameDay(day, selectedDate);
                                const isTodayDate = isToday(day);

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => setSelectedDate(day)}
                                        className="group flex flex-col items-center py-1 rounded-xl transition-colors hover:bg-gray-50"
                                    >
                                        {/* Day Number — today uses accent ring (#3) */}
                                        <div
                                            className={`h-7 w-7 rounded-full flex items-center justify-center text-[13px] transition-all ${
                                                isSelected && !isTodayDate
                                                    ? 'bg-gray-900 text-white font-bold'
                                                    : isTodayDate && isSelected
                                                    ? 'ring-2 ring-primary-500 bg-primary-50 text-primary-700 font-black'
                                                    : isTodayDate
                                                    ? 'ring-2 ring-primary-500/50 text-primary-600 font-bold'
                                                    : isCurrentMonth
                                                    ? 'text-gray-800 font-medium'
                                                    : 'text-gray-300 font-normal'
                                            }`}
                                        >
                                            {format(day, 'd')}
                                        </div>

                                        {/* Visitor Dots — category-colored (#1) */}
                                        <div className="flex items-center justify-center gap-[3px] h-2 mt-0.5">
                                            {dayEventsList.slice(0, 3).map((ev, i) => {
                                                const style = getPurposeColorStyle(ev.extendedProps.purpose);
                                                return (
                                                    <span
                                                        key={i}
                                                        className={`h-[5px] w-[5px] rounded-full ${style.dot}`}
                                                    />
                                                );
                                            })}
                                            {dayEventsList.length > 3 && (
                                                <span className="text-[7px] font-black text-gray-400 leading-none">
                                                    +{dayEventsList.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend toggle (#6) */}
                    <div className="flex items-center justify-end px-1">
                        <button
                            onClick={() => setShowLegend(!showLegend)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-gray-600 transition"
                        >
                            <Info className="h-3 w-3" />
                            {showLegend ? 'Hide legend' : 'Color legend'}
                        </button>
                    </div>

                    {showLegend && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1 pb-1">
                            {LEGEND_ITEMS.map((item) => {
                                const style = getPurposeColorStyle(item.purpose);
                                return (
                                    <div key={item.label} className="flex items-center gap-1.5">
                                        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                        <span className="text-[10px] font-medium text-gray-500">
                                            {item.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Selected Day Agenda */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold text-gray-900">
                                {format(selectedDate, 'EEEE, MMM d')}
                            </h2>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {selectedDateEvents.length}{' '}
                                {selectedDateEvents.length === 1 ? 'visitor' : 'visitors'}
                            </span>
                        </div>

                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-2">
                                {selectedDateEvents.map((ev) => (
                                    <EventCard
                                        key={ev.id}
                                        event={ev}
                                        isAdmin={isAdmin}
                                        copiedCode={copiedCode}
                                        onCopyCode={handleCopyCode}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-6 px-4 text-center space-y-1.5">
                                <p className="text-xs font-medium text-gray-400">
                                    No visitors on {format(selectedDate, 'MMM d')}
                                </p>
                                <button
                                    onClick={() => router.get(createUrl)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
                                >
                                    <Plus className="h-3 w-3" />
                                    <span>Schedule a visitor</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════════
                AGENDA LIST VIEW
               ═══════════════════════════════════════════════════ */}
            {viewMode === 'list' && (
                <div className="space-y-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
                        {events.length} visitor{events.length !== 1 ? 's' : ''} this month
                    </p>
                    {events.length > 0 ? (
                        <div className="space-y-2">
                            {events.map((ev) => (
                                <EventCard
                                    key={ev.id}
                                    event={ev}
                                    isAdmin={isAdmin}
                                    copiedCode={copiedCode}
                                    onCopyCode={handleCopyCode}
                                    showDate
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
                            <p className="text-xs font-medium text-gray-400">No visitors found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   EventCard — shared between grid-day-detail and agenda views
   Uses same getPurposeColorStyle as Schedule/Archive screens.
   ────────────────────────────────────────────────────────────── */

function EventCard({
    event: ev,
    isAdmin,
    copiedCode,
    onCopyCode,
    showDate = false,
}: {
    event: VisitorCalendarEvent;
    isAdmin: boolean;
    copiedCode: string | null;
    onCopyCode: (code: string) => void;
    showDate?: boolean;
}) {
    const style = getPurposeColorStyle(ev.extendedProps.purpose);
    const isCopied = copiedCode === ev.extendedProps.code;

    return (
        <div className="group flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 hover:border-gray-200 transition">
            {/* Category-colored left accent bar */}
            <div className={`w-0.5 self-stretch rounded-full shrink-0 ${style.dot}`} />

            <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 truncate">
                        {ev.extendedProps.visitor_name}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                        {ev.extendedProps.purpose}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                    {isAdmin && ev.extendedProps.host_name && (
                        <span className="flex items-center gap-1">
                            <User className="h-3 w-3 text-gray-400" />
                            {ev.extendedProps.host_name}
                        </span>
                    )}
                    {ev.start && (
                        <span className="flex items-center gap-1">
                            {showDate ? (
                                <>
                                    <CalendarIcon className="h-3 w-3 text-gray-400" />
                                    {format(parseISO(ev.start), 'MMM d, h:mm a')}
                                </>
                            ) : (
                                <>
                                    <Clock className="h-3 w-3 text-gray-400" />
                                    {format(parseISO(ev.start), 'h:mm a')}
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Code + Copy */}
            <div className="flex items-center gap-1.5 shrink-0">
                <span className="font-mono text-[10px] font-black tracking-widest text-gray-600 bg-gray-50 px-2 py-1 rounded-lg">
                    {ev.extendedProps.code}
                </span>
                <button
                    onClick={() => onCopyCode(ev.extendedProps.code)}
                    className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition active:scale-95"
                >
                    {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-success-500" />
                    ) : (
                        <Copy className="h-3.5 w-3.5" />
                    )}
                </button>
            </div>
        </div>
    );
}
