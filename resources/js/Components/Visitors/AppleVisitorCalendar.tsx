import { Head, Link, router } from '@inertiajs/react';
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
    ArrowLeft,
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Filter,
    Plus,
    Search,
    User,
    CheckCircle2,
    Copy,
    Check,
    X,
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

type AppleVisitorCalendarProps = {
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

export default function AppleVisitorCalendar({
    eventsUrl,
    backUrl,
    backLabel = 'Timeline',
    isAdmin = false,
    hosts = [],
    createUrl = '/resident/visitors/create',
    initialFilters,
}: AppleVisitorCalendarProps) {
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
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Calculate Grid dates for current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sun
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    // Fetch events when current month or filters change
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

                const response = await fetch(`${eventsUrl}?${params.toString()}`);
                const data = await response.json();
                if (isMounted) {
                    setEvents(data);
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

    // Map events by date string (YYYY-MM-DD)
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

    // Events for the currently selected date
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const selectedDateEvents = eventsByDate[selectedDateStr] || [];

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    return (
        <div className="mx-auto max-w-md sm:max-w-2xl px-3 py-2 space-y-4 pb-28">
            {/* Top Navigation & Apple Style Header */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    {/* Left Back Navigation Pill */}
                    <Link
                        href={backUrl}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span>{format(currentMonth, 'yyyy')}</span>
                    </Link>

                    {/* Right Quick Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className={`rounded-full p-2 text-slate-700 transition active:scale-95 ${
                                showSearch ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <button
                            onClick={() => router.get(createUrl)}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Invite</span>
                        </button>
                    </div>
                </div>

                {/* Big Month Title */}
                <div className="flex items-baseline justify-between pt-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">
                        {format(currentMonth, 'MMMM')}
                    </h1>
                    <span className="text-sm font-bold text-slate-400 font-mono">
                        {format(currentMonth, 'yyyy')}
                    </span>
                </div>

                {/* Optional Search Bar */}
                {showSearch && (
                    <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search visitor name, code..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:border-slate-400 focus:ring-0 shadow-2xs"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {/* Purpose Category Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-1">
                    {PURPOSES.map((purpose) => (
                        <button
                            key={purpose}
                            onClick={() => setSelectedPurpose(purpose)}
                            className={`rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                                selectedPurpose === purpose
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {purpose}
                        </button>
                    ))}
                </div>

                {/* Admin Host Dropdown */}
                {isAdmin && hosts.length > 0 && (
                    <div className="pt-1">
                        <select
                            value={selectedHostId}
                            onChange={(e) => setSelectedHostId(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-800 focus:ring-0 shadow-2xs"
                        >
                            <option value="All">All Resident Hosts</option>
                            {hosts.map((host) => (
                                <option key={host.id} value={host.id}>
                                    {host.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* View Mode: Month Grid View */}
            {viewMode === 'grid' && (
                <div className="space-y-4">
                    {/* Month Grid Card */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-2 shadow-sm">
                        {/* Weekday Row Header (Single Letter initials M T W T F S S) */}
                        <div className="grid grid-cols-7 border-b border-slate-100/80 pb-2 mb-1 text-center">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                                <div
                                    key={idx}
                                    className="text-[11px] font-black uppercase text-slate-400 tracking-wider"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Month Grid Days */}
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                            {calendarDays.map((day) => {
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const dayEventsList = eventsByDate[dateStr] || [];
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isSelected = isSameDay(day, selectedDate);
                                const isTodayDate = isToday(day);

                                return (
                                    <button
                                        key={dateStr}
                                        onClick={() => {
                                            setSelectedDate(day);
                                        }}
                                        className={`group relative flex flex-col items-center justify-between py-1.5 px-1 rounded-2xl transition-all ${
                                            isSelected ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                                        }`}
                                    >
                                        {/* Day Number Pill / Circle */}
                                        <div
                                            className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                                                isTodayDate
                                                    ? 'bg-rose-500 text-white shadow-xs font-black'
                                                    : isSelected
                                                    ? 'bg-slate-900 text-white font-bold'
                                                    : isCurrentMonth
                                                    ? 'text-slate-800 group-hover:text-slate-900'
                                                    : 'text-slate-300'
                                            }`}
                                        >
                                            {format(day, 'd')}
                                        </div>

                                        {/* Colored Dots for Scheduled Visitors */}
                                        <div className="flex items-center justify-center gap-0.5 h-2 mt-1">
                                            {dayEventsList.slice(0, 3).map((ev, i) => {
                                                const style = getPurposeColorStyle(ev.extendedProps.purpose);
                                                return (
                                                    <span
                                                        key={i}
                                                        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                                                    />
                                                );
                                            })}
                                            {dayEventsList.length > 3 && (
                                                <span className="text-[8px] font-black text-slate-400 leading-none">+</span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Day Visitor Agenda Section (Apple Style) */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-black text-slate-900 tracking-tight">
                                {format(selectedDate, 'EEEE, MMMM d')}
                            </h2>
                            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">
                                {selectedDateEvents.length}{' '}
                                {selectedDateEvents.length === 1 ? 'Visitor' : 'Visitors'}
                            </span>
                        </div>

                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-2.5">
                                {selectedDateEvents.map((ev) => {
                                    const style = getPurposeColorStyle(ev.extendedProps.purpose);
                                    const isCopied = copiedCode === ev.extendedProps.code;

                                    return (
                                        <div
                                            key={ev.id}
                                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs hover:border-slate-200 transition"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs ${style.bg} ${style.text}`}>
                                                    {ev.extendedProps.visitor_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-bold text-slate-900">
                                                            {ev.extendedProps.visitor_name}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${style.bg} ${style.border} ${style.text}`}>
                                                            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                                            {ev.extendedProps.purpose}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                        {ev.extendedProps.host_name && isAdmin && (
                                                            <span className="flex items-center gap-1 text-slate-600">
                                                                <User className="h-3 w-3 text-slate-400" />
                                                                Host: {ev.extendedProps.host_name}
                                                            </span>
                                                        )}
                                                        {ev.start && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3 text-slate-400" />
                                                                {format(parseISO(ev.start), 'h:mm a')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Code & Copy Pill */}
                                            <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                                <div className="font-mono text-xs font-black tracking-widest text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                    {ev.extendedProps.code}
                                                </div>
                                                <button
                                                    onClick={() => handleCopyCode(ev.extendedProps.code)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                                                >
                                                    {isCopied ? (
                                                        <>
                                                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                            <span className="text-emerald-600">Copied</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                            <span>Copy</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
                                <p className="text-xs font-bold text-slate-500">
                                    No visitors scheduled for {format(selectedDate, 'MMM d')}
                                </p>
                                <button
                                    onClick={() => router.get(createUrl)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Schedule a visitor for this date</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View Mode: Agenda List View */}
            {viewMode === 'list' && (
                <div className="space-y-3">
                    <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
                        Upcoming Visitors ({events.length})
                    </h2>
                    {events.length > 0 ? (
                        <div className="space-y-2.5">
                            {events.map((ev) => {
                                const style = getPurposeColorStyle(ev.extendedProps.purpose);
                                const isCopied = copiedCode === ev.extendedProps.code;

                                return (
                                    <div
                                        key={ev.id}
                                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-2xs hover:border-slate-200 transition"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-black text-xs ${style.bg} ${style.text}`}>
                                                {ev.extendedProps.visitor_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {ev.extendedProps.visitor_name}
                                                    </span>
                                                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${style.bg} ${style.border} ${style.text}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                                        {ev.extendedProps.purpose}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                                                    {ev.start && (
                                                        <span className="flex items-center gap-1">
                                                            <CalendarIcon className="h-3 w-3 text-slate-400" />
                                                            {format(parseISO(ev.start), 'MMM d, h:mm a')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                                            <div className="font-mono text-xs font-black tracking-widest text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                {ev.extendedProps.code}
                                            </div>
                                            <button
                                                onClick={() => handleCopyCode(ev.extendedProps.code)}
                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95"
                                            >
                                                {isCopied ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
                            <p className="text-xs font-bold text-slate-500">No upcoming visitors found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom Dock Control Bar (Apple Floating Pill Bar) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 shadow-xl backdrop-blur-md">
                <button
                    onClick={() => {
                        const now = new Date();
                        setCurrentMonth(now);
                        setSelectedDate(now);
                    }}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 hover:bg-slate-200 transition active:scale-95"
                >
                    Today
                </button>

                <div className="h-4 w-px bg-slate-200" />

                <div className="flex items-center gap-0.5">
                    <button
                        onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
                        className="rounded-full p-1 text-slate-600 hover:bg-slate-100 transition active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
                        className="rounded-full p-1 text-slate-600 hover:bg-slate-100 transition active:scale-95"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                <div className="h-4 w-px bg-slate-200" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                            viewMode === 'grid'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                            viewMode === 'list'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Agenda
                    </button>
                </div>
            </div>
        </div>
    );
}
