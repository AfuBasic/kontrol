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
import { ChevronLeft, ChevronRight, Clock, Plus, Search, User, Copy, Check, X, Info, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import CustomSelect from '@/Components/UI/CustomSelect';
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
    createUrl?: string | null;
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
    const [_loading, setLoading] = useState<boolean>(false);

    // Month Filters
    const [selectedPurpose, setSelectedPurpose] = useState<string>(initialFilters?.purpose || 'All');
    const [selectedHostId, setSelectedHostId] = useState<string>(initialFilters?.user_id || 'All');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showSearch, setShowSearch] = useState<boolean>(false);
    const [showLegend, setShowLegend] = useState<boolean>(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Day Status & Search Filter for the selected day list
    const [dayStatusFilter, setDayStatusFilter] = useState<'all' | 'active' | 'checked_in' | 'expired'>('all');
    const [daySearchQuery, setDaySearchQuery] = useState<string>('');

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

    // Compute stats for selected date
    const dayStats = useMemo(() => {
        let checkedIn = 0;
        let active = 0;
        let expired = 0;
        const purposeCounts: Record<string, number> = {};

        selectedDateEvents.forEach((ev) => {
            const isUsed = Boolean(ev.extendedProps.used_at || ev.extendedProps.status === 'used' || ev.extendedProps.status === 'checked_in');
            const isExp = Boolean(ev.extendedProps.is_valid === false || ev.extendedProps.status === 'expired');

            if (isUsed) {
                checkedIn++;
            } else if (isExp) {
                expired++;
            } else {
                active++;
            }

            const p = ev.extendedProps.purpose || 'Other';
            purposeCounts[p] = (purposeCounts[p] || 0) + 1;
        });

        return {
            total: selectedDateEvents.length,
            checkedIn,
            active,
            expired,
            purposeCounts,
        };
    }, [selectedDateEvents]);

    // Filter events for the right column based on dayStatusFilter and daySearchQuery
    const filteredDayEvents = useMemo(() => {
        return selectedDateEvents.filter((ev) => {
            const isUsed = Boolean(ev.extendedProps.used_at || ev.extendedProps.status === 'used' || ev.extendedProps.status === 'checked_in');
            const isExp = Boolean(ev.extendedProps.is_valid === false || ev.extendedProps.status === 'expired');
            const isActive = !isUsed && !isExp;

            if (dayStatusFilter === 'checked_in' && !isUsed) return false;
            if (dayStatusFilter === 'active' && !isActive) return false;
            if (dayStatusFilter === 'expired' && !isExp) return false;

            if (daySearchQuery.trim()) {
                const q = daySearchQuery.toLowerCase().trim();
                const name = (ev.extendedProps.visitor_name || '').toLowerCase();
                const code = (ev.extendedProps.code || '').toLowerCase();
                const host = (ev.extendedProps.host_name || '').toLowerCase();
                const purpose = (ev.extendedProps.purpose || '').toLowerCase();
                if (!name.includes(q) && !code.includes(q) && !host.includes(q) && !purpose.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    }, [selectedDateEvents, dayStatusFilter, daySearchQuery]);

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
                        title="Search calendar"
                    >
                        <Search className="h-4 w-4" />
                    </button>

                    {createUrl && (
                        <button
                            onClick={() => router.get(createUrl)}
                            className="inline-flex items-center gap-1 rounded-full bg-primary-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-primary-600 active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Invite</span>
                        </button>
                    )}
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
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
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
                        placeholder="Search visitor name, code across month..."
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
                <CustomSelect
                    size="sm"
                    value={selectedHostId}
                    onChange={(val) => setSelectedHostId(String(val))}
                    options={[
                        { value: 'All', label: 'All Resident Hosts' },
                        ...hosts.map((host) => ({
                            value: String(host.id),
                            label: host.name,
                        })),
                    ]}
                />
            )}

            {/* ─── View Toggle (Month / Agenda) ─── */}
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
                MONTH GRID VIEW (Sticky Master-Detail Workspace)
               ═══════════════════════════════════════════════════ */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    {/* Left Column: Calendar Grid + Day Insights Card (Sticky on Desktop) */}
                    <div className="space-y-4 lg:col-span-5 xl:col-span-5 lg:sticky lg:top-6">
                        {/* Month Grid Card */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs">
                            {/* Weekday Header */}
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
                                            onClick={() => {
                                                setSelectedDate(day);
                                                setDayStatusFilter('all');
                                                setDaySearchQuery('');
                                            }}
                                            className="group flex flex-col items-center rounded-xl py-2 transition-colors hover:bg-gray-50"
                                        >
                                            {/* Day Number */}
                                            <div
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all ${
                                                    isSelected && !isTodayDate
                                                        ? 'bg-gray-900 font-bold text-white shadow-xs'
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

                            {/* Legend toggle */}
                            <div className="mt-2 flex items-center justify-between border-t border-gray-50 pt-2 px-1">
                                <span className="text-[10px] text-gray-400 font-medium">Click day to inspect</span>
                                <button
                                    onClick={() => setShowLegend(!showLegend)}
                                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 transition hover:text-gray-600"
                                >
                                    <Info className="h-3 w-3" />
                                    {showLegend ? 'Hide legend' : 'Color legend'}
                                </button>
                            </div>

                            {showLegend && (
                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-gray-50 pt-2 px-1">
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

                        {/* Selected Day Insights / Overview Card */}
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs space-y-3.5">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                                        <CalendarIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-900">Day Overview</h3>
                                        <p className="text-[10px] font-medium text-gray-400">{format(selectedDate, 'EEEE, MMM d')}</p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-extrabold text-gray-700">
                                    {dayStats.total} {dayStats.total === 1 ? 'Visitor' : 'Visitors'}
                                </span>
                            </div>

                            {/* Metric pills / mini cards */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="rounded-xl bg-gray-50/80 p-2 border border-gray-100/60">
                                    <span className="text-[10px] font-medium text-gray-500 block">Total</span>
                                    <span className="text-base font-black text-gray-900">{dayStats.total}</span>
                                </div>
                                <div className="rounded-xl bg-emerald-50/50 p-2 border border-emerald-100/60">
                                    <span className="text-[10px] font-semibold text-emerald-700 block">Checked In</span>
                                    <span className="text-base font-black text-emerald-700">{dayStats.checkedIn}</span>
                                </div>
                                <div className="rounded-xl bg-blue-50/50 p-2 border border-blue-100/60">
                                    <span className="text-[10px] font-semibold text-blue-700 block">Active</span>
                                    <span className="text-base font-black text-blue-700">{dayStats.active}</span>
                                </div>
                            </div>

                            {/* Purpose Breakdown Pills */}
                            {Object.keys(dayStats.purposeCounts).length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categories</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {Object.entries(dayStats.purposeCounts).map(([purpose, count]) => {
                                            const style = getPurposeColorStyle(purpose);
                                            return (
                                                <span
                                                    key={purpose}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold ${style.bg} ${style.text} ${style.border} border`}
                                                >
                                                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                                                    <span>{purpose}</span>
                                                    <span className="opacity-70">({count})</span>
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quick Status Filter Tabs */}
                            {dayStats.total > 0 && (
                                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <span>Filter Itinerary</span>
                                        {(dayStatusFilter !== 'all' || daySearchQuery) && (
                                            <button
                                                onClick={() => {
                                                    setDayStatusFilter('all');
                                                    setDaySearchQuery('');
                                                }}
                                                className="text-primary-600 hover:text-primary-700 capitalize text-[10px] font-bold"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-1 rounded-xl bg-gray-100 p-1 text-[11px] font-bold">
                                        <button
                                            onClick={() => setDayStatusFilter('all')}
                                            className={`rounded-lg py-1 transition ${
                                                dayStatusFilter === 'all'
                                                    ? 'bg-white text-gray-900 shadow-2xs font-extrabold'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            All ({dayStats.total})
                                        </button>
                                        <button
                                            onClick={() => setDayStatusFilter('active')}
                                            className={`rounded-lg py-1 transition ${
                                                dayStatusFilter === 'active'
                                                    ? 'bg-white text-blue-700 shadow-2xs font-extrabold'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Active ({dayStats.active})
                                        </button>
                                        <button
                                            onClick={() => setDayStatusFilter('checked_in')}
                                            className={`rounded-lg py-1 transition ${
                                                dayStatusFilter === 'checked_in'
                                                    ? 'bg-white text-emerald-700 shadow-2xs font-extrabold'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Used ({dayStats.checkedIn})
                                        </button>
                                        <button
                                            onClick={() => setDayStatusFilter('expired')}
                                            className={`rounded-lg py-1 transition ${
                                                dayStatusFilter === 'expired'
                                                    ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                                                    : 'text-gray-500 hover:text-gray-800'
                                            }`}
                                        >
                                            Exp ({dayStats.expired})
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Scrollable Daily Itinerary (lg:col-span-7 xl:col-span-7) */}
                    <div className="space-y-3 lg:col-span-7 xl:col-span-7">
                        {/* Daily Itinerary Header Card */}
                        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs">
                            <div className="min-w-0">
                                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                                    {isToday(selectedDate) && (
                                        <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[9px] font-extrabold text-primary-700 ring-1 ring-primary-500/20">
                                            Today
                                        </span>
                                    )}
                                </h2>
                                <p className="text-[11px] font-medium text-gray-400">
                                    Showing {filteredDayEvents.length} of {selectedDateEvents.length} scheduled {selectedDateEvents.length === 1 ? 'visitor' : 'visitors'}
                                </p>
                            </div>

                            {/* Search within this day */}
                            <div className="relative w-full sm:w-48">
                                <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter visitors..."
                                    value={daySearchQuery}
                                    onChange={(e) => setDaySearchQuery(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-gray-50/80 py-1.5 pr-7 pl-8 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:ring-0"
                                />
                                {daySearchQuery && (
                                    <button
                                        onClick={() => setDaySearchQuery('')}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Scrollable Event List Container */}
                        <div className="max-h-[calc(100vh-240px)] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                            {filteredDayEvents.length > 0 ? (
                                filteredDayEvents.map((ev) => (
                                    <EventCard key={ev.id} event={ev} isAdmin={isAdmin} copiedCode={copiedCode} onCopyCode={handleCopyCode} />
                                ))
                            ) : selectedDateEvents.length > 0 ? (
                                <div className="space-y-2 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 text-center">
                                    <p className="text-xs font-medium text-gray-500">No visitors match your filter criteria.</p>
                                    <button
                                        onClick={() => {
                                            setDayStatusFilter('all');
                                            setDaySearchQuery('');
                                        }}
                                        className="text-xs font-bold text-primary-600 hover:underline"
                                    >
                                        Clear day filters
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2.5 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-14 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                                        <CalendarIcon className="h-5 w-5" />
                                    </div>
                                    <p className="text-xs font-medium text-gray-500">No visitors scheduled for {format(selectedDate, 'MMM d, yyyy')}</p>
                                    {createUrl && (
                                        <button
                                            onClick={() => router.get(createUrl)}
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-700 hover:bg-primary-100 transition active:scale-95"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            <span>Schedule a visitor</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
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
    const isCheckedIn = Boolean(ev.extendedProps.used_at || ev.extendedProps.status === 'used' || ev.extendedProps.status === 'checked_in');
    const isExpired = Boolean(ev.extendedProps.is_valid === false || ev.extendedProps.status === 'expired');

    const detailUrl = `/resident/visitors/${ev.id}`;

    return (
        <div
            onClick={() => {
                if (!isAdmin) {
                    router.get(detailUrl);
                }
            }}
            className={`group relative flex items-center justify-between gap-3.5 rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs transition-all hover:border-gray-200 hover:shadow-sm ${
                isAdmin ? '' : 'cursor-pointer active:scale-[0.99]'
            }`}
        >
            {/* Category-colored left accent bar */}
            <div className={`w-1 shrink-0 self-stretch rounded-full ${style.dot}`} />

            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-bold text-gray-900">{ev.extendedProps.visitor_name}</span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${style.badge}`}>
                        {ev.extendedProps.purpose}
                    </span>
                    {isCheckedIn ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            Checked In
                        </span>
                    ) : isExpired ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                            Expired
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                            Active Pass
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium text-gray-500">
                    {isAdmin && ev.extendedProps.host_name && (
                        <span className="flex items-center gap-1 truncate text-gray-600">
                            <User className="h-3 w-3 text-gray-400 shrink-0" />
                            <span className="text-gray-400">Host:</span> {ev.extendedProps.host_name}
                        </span>
                    )}
                    {ev.start && (
                        <span className="flex items-center gap-1 text-gray-600">
                            {showDate ? (
                                <>
                                    <CalendarIcon className="h-3 w-3 text-gray-400 shrink-0" />
                                    {format(parseISO(ev.start), 'MMM d, h:mm a')}
                                </>
                            ) : (
                                <>
                                    <Clock className="h-3 w-3 text-gray-400 shrink-0" />
                                    {format(parseISO(ev.start), 'h:mm a')}
                                </>
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Code + Copy */}
            <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <span className="rounded-lg bg-gray-50 px-2.5 py-1 font-mono text-[11px] font-black tracking-widest text-gray-700 border border-gray-100">
                    {ev.extendedProps.code}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onCopyCode(ev.extendedProps.code);
                    }}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                        isCopied
                            ? 'border border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-400/20'
                            : 'border border-gray-200 bg-white text-gray-600 shadow-2xs hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    title="Copy code"
                >
                    {isCopied ? (
                        <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-[10px] text-emerald-700">Copied</span>
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

