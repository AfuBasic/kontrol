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
import { ChevronLeft, ChevronRight, Clock, Plus, Search, User, Copy, Check, X, Info, Calendar as CalendarIcon } from 'lucide-react';
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

/** Legend items - same categories as purpose chips, mapped to their dot colors */
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
                        Accept: 'application/json',
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

    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const handleCopyCode = (code: string) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).catch(() => {
                fallbackCopy(code);
            });
        } else {
            fallbackCopy(code);
        }
        setCopiedCode(code);
        setToastMessage(`Access Code ${code} copied to clipboard!`);
        setTimeout(() => setCopiedCode(null), 2500);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Fallback copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    const goToday = () => {
        const now = new Date();
        setCurrentMonth(now);
        setSelectedDate(now);
    };

    return (
        <div className="relative mx-auto w-full max-w-7xl space-y-6 px-4 py-4 pb-24 sm:px-6 lg:px-8">
            {/* Toast Notification Banner */}
            {toastMessage && (
                <div className="animate-in fade-in slide-in-from-top-4 fixed top-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-gray-900/95 px-4 py-2.5 text-xs font-bold text-white shadow-xl backdrop-blur-md duration-200">
                    <Check className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* ─── Top Bar ─── */}
            <div className="flex items-center justify-between">
                <Link
                    href={backUrl}
                    className="inline-flex items-center gap-0.5 text-sm font-semibold text-gray-500 transition hover:text-gray-800 active:scale-95"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{backLabel}</span>
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className={`rounded-full p-2 transition active:scale-95 ${
                            showSearch ? 'bg-gray-800 text-white' : 'text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    <button
                        onClick={() => router.get(createUrl)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Invite</span>
                    </button>
                </div>
            </div>

            {/* ─── Month Title + Navigation ─── */}
            <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">{format(currentMonth, 'MMMM')}</h1>
                    <span className="text-sm font-medium text-gray-400">{format(currentMonth, 'yyyy')}</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={goToday}
                        className="rounded-lg px-2 py-0.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                        className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                        className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ─── Search (expandable) ─── */}
            {showSearch && (
                <div className="relative">
                    <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search visitor name, code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pr-8 pl-9 text-xs font-medium text-gray-900 placeholder-gray-400 shadow-2xs focus:border-gray-300 focus:bg-white focus:ring-0"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute top-2.5 right-2.5 text-gray-400 hover:text-gray-600">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}

            {/* ─── Category Chips (colored when active) ─── */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
                {PURPOSES.map((purpose) => (
                    <button
                        key={purpose}
                        onClick={() => setSelectedPurpose(purpose)}
                        className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition-all ${getCategoryChipStyle(purpose, selectedPurpose === purpose)}`}
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
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs focus:ring-0"
                >
                    <option value="All">All Resident Hosts</option>
                    {hosts.map((host) => (
                        <option key={host.id} value={host.id}>
                            {host.name}
                        </option>
                    ))}
                </select>
            )}

            {/* ─── View Toggle (Month / Agenda) - plain text, not pills ─── */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-1.5">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`-mb-1.5 border-b-2 pb-1.5 text-xs font-bold transition ${
                        viewMode === 'grid' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Month
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`-mb-1.5 border-b-2 pb-1.5 text-xs font-bold transition ${
                        viewMode === 'list' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-600'
                    }`}
                >
                    Agenda
                </button>
            </div>

            {/* ═══════════════════════════════════════════════════
                MONTH GRID VIEW (2-column layout on desktop)
               ═══════════════════════════════════════════════════ */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* Left Column: Month Grid (lg:col-span-7) */}
                    <div className="space-y-3 lg:col-span-7">
                        <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-2xs">
                            {/* Weekday Header - small, uppercase, muted */}
                            <div className="mb-1 grid grid-cols-7 text-center">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                    <div key={idx} className="py-1 text-[9px] font-bold tracking-[0.12em] text-gray-400 uppercase">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Day Cells */}
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
                                            className="group flex flex-col items-center rounded-xl py-2.5 transition-colors hover:bg-gray-50"
                                        >
                                            {/* Day Number */}
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition-all ${
                                                    isSelected && !isTodayDate
                                                        ? 'bg-gray-900 font-bold text-white'
                                                        : isTodayDate && isSelected
                                                          ? 'bg-primary-50 font-black text-primary-700 ring-2 ring-primary-500'
                                                          : isTodayDate
                                                            ? 'font-bold text-primary-600 ring-2 ring-primary-500/50'
                                                            : isCurrentMonth
                                                              ? 'font-medium text-gray-800'
                                                              : 'font-normal text-gray-300'
                                                }`}
                                            >
                                                {format(day, 'd')}
                                            </div>

                                            {/* Visitor Dots */}
                                            <div className="mt-1 flex h-2 items-center justify-center gap-[3px]">
                                                {dayEventsList.slice(0, 3).map((ev, i) => {
                                                    const style = getPurposeColorStyle(ev.extendedProps.purpose);
                                                    return <span key={i} className={`h-[5px] w-[5px] rounded-full ${style.dot}`} />;
                                                })}
                                                {dayEventsList.length > 3 && (
                                                    <span className="text-[7px] leading-none font-black text-gray-400">
                                                        +{dayEventsList.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legend toggle */}
                        <div className="flex items-center justify-end px-1">
                            <button
                                onClick={() => setShowLegend(!showLegend)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 transition hover:text-gray-600"
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
                                            <span className="text-[10px] font-medium text-gray-500">{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Selected Day Agenda (lg:col-span-5) */}
                    <div className="space-y-3 lg:col-span-5">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-bold text-gray-900">{format(selectedDate, 'EEEE, MMM d')}</h2>
                            <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'visitor' : 'visitors'}
                            </span>
                        </div>

                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-2.5">
                                {selectedDateEvents.map((ev) => (
                                    <EventCard key={ev.id} event={ev} isAdmin={isAdmin} copiedCode={copiedCode} onCopyCode={handleCopyCode} />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-10 text-center">
                                <p className="text-xs font-medium text-gray-400">No visitors scheduled for {format(selectedDate, 'MMM d')}</p>
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
                    <p className="px-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                        {events.length} visitor{events.length !== 1 ? 's' : ''} this month
                    </p>
                    {events.length > 0 ? (
                        <div className="space-y-2">
                            {events.map((ev) => (
                                <EventCard key={ev.id} event={ev} isAdmin={isAdmin} copiedCode={copiedCode} onCopyCode={handleCopyCode} showDate />
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
   EventCard - shared between grid-day-detail and agenda views
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

    const detailUrl = `/resident/visitors/${ev.id}`;

    return (
        <div
            onClick={() => {
                if (!isAdmin) {
                    router.get(detailUrl);
                }
            }}
            className={`group flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition ${
                isAdmin ? '' : 'cursor-pointer hover:border-gray-200 active:scale-[0.99]'
            }`}
        >
            {/* Category-colored left accent bar */}
            <div className={`w-0.5 shrink-0 self-stretch rounded-full ${style.dot}`} />

            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-gray-900">{ev.extendedProps.visitor_name}</span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                        {ev.extendedProps.purpose}
                    </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
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
            <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="rounded-lg bg-gray-50 px-2 py-1 font-mono text-[10px] font-black tracking-widest text-gray-600">
                    {ev.extendedProps.code}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopyCode(ev.extendedProps.code);
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all active:scale-90 ${
                        isCopied
                            ? 'scale-105 border border-emerald-300 bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400/20'
                            : 'border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title="Copy code"
                >
                    {isCopied ? (
                        <>
                            <Check className="animate-in zoom-in-50 h-3.5 w-3.5 text-emerald-600 duration-150" />
                            <span className="text-[10px] text-emerald-700">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-[10px]">Copy</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
