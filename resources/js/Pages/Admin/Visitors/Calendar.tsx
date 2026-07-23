import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Search, User } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import DayDetailSheet from '@/Components/Visitors/DayDetailSheet';
import AdminLayout from '@/Layouts/AdminLayout';
import { getPurposeColorStyle } from '@/Utils/calendarTheme';
import type { CalendarEventItem } from '@/Components/Visitors/DayDetailSheet';

type Host = {
    id: number;
    name: string;
};

type Props = {
    hosts?: Host[];
    initialFilters?: {
        purpose?: string;
        status?: string;
        type?: string;
        search?: string;
        user_id?: string;
    };
};

const PURPOSES = ['All', 'Family', 'Friends', 'Maintenance', 'Delivery', 'Healthcare', 'Business'];

export default function AdminVisitorCalendar({ hosts = [], initialFilters }: Props) {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'>('dayGridMonth');
    const [selectedPurpose, setSelectedPurpose] = useState<string>(initialFilters?.purpose || 'All');
    const [selectedHostId, setSelectedHostId] = useState<string>(initialFilters?.user_id || 'All');
    const [searchQuery, setSearchQuery] = useState<string>(initialFilters?.search || '');

    // Day detail drawer state
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dayEvents, setDayEvents] = useState<CalendarEventItem[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [titleText, setTitleText] = useState<string>('');

    // Fetch events dynamically via date range API (Estate-wide)
    const fetchEvents = useCallback(
        async (fetchInfo: any, successCallback: any, failureCallback: any) => {
            try {
                const params = new URLSearchParams({
                    start: fetchInfo.startStr,
                    end: fetchInfo.endStr,
                });

                if (selectedPurpose !== 'All') {
                    params.append('purpose', selectedPurpose);
                }
                if (selectedHostId !== 'All') {
                    params.append('user_id', selectedHostId);
                }
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }

                const response = await fetch(`/admin/visitors/calendar-events?${params.toString()}`);
                const data = await response.json();
                successCallback(data);
            } catch (err) {
                failureCallback(err);
            }
        },
        [selectedPurpose, selectedHostId, searchQuery]
    );

    // Event click -> Open Day Detail Sheet for that day
    const handleEventClick = (info: any) => {
        const eventDate = new Date(info.event.start);
        setSelectedDate(eventDate);
        setDayEvents([
            {
                id: info.event.id,
                title: info.event.title,
                start: info.event.startStr,
                end: info.event.endStr,
                allDay: info.event.allDay,
                extendedProps: info.event.extendedProps,
            },
        ]);
        setIsSheetOpen(true);
    };

    // Date cell tap -> Open Day Detail Sheet with all events on that day
    const handleDateClick = (info: any) => {
        const clickedDate = new Date(info.dateStr);
        setSelectedDate(clickedDate);

        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            const clientEvents = api.getEvents();
            const matching = clientEvents
                .filter((ev) => {
                    const evStart = new Date(ev.startStr).toISOString().split('T')[0];
                    return evStart === info.dateStr;
                })
                .map((ev) => ({
                    id: ev.id,
                    title: ev.title,
                    start: ev.startStr,
                    end: ev.endStr,
                    allDay: ev.allDay,
                    extendedProps: ev.extendedProps as any,
                }));

            setDayEvents(matching);
        } else {
            setDayEvents([]);
        }

        setIsSheetOpen(true);
    };

    const triggerRefetch = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
    };

    const handlePurposeChange = (purpose: string) => {
        setSelectedPurpose(purpose);
        setTimeout(() => triggerRefetch(), 50);
    };

    const handleHostChange = (hostId: string) => {
        setSelectedHostId(hostId);
        setTimeout(() => triggerRefetch(), 50);
    };

    const handlePrev = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().prev();
        }
    };

    const handleNext = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().next();
        }
    };

    const handleToday = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().today();
        }
    };

    const handleViewChange = (mode: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth') => {
        setViewMode(mode);
        if (calendarRef.current) {
            calendarRef.current.getApi().changeView(mode);
        }
    };

    return (
        <>
            <Head title="Estate Visitor Calendar" />

            <div className="flex flex-col gap-6 pb-20">
                {/* Header Navigation & Title */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/visitors"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Logs</span>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">Estate Visitor Calendar</h1>
                            <p className="text-xs text-slate-500">Monitor all scheduled & active visitor passes across the estate.</p>
                        </div>
                    </div>
                </div>

                {/* Filter Controls Bar */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Purpose Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {PURPOSES.map((purpose) => (
                            <button
                                key={purpose}
                                onClick={() => handlePurposeChange(purpose)}
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

                    <div className="flex items-center gap-2.5">
                        {/* Host Resident Filter Dropdown */}
                        <div className="relative">
                            <select
                                value={selectedHostId}
                                onChange={(e) => handleHostChange(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-slate-800 focus:border-primary-500 focus:ring-primary-500 shadow-2xs"
                            >
                                <option value="All">All Resident Hosts</option>
                                {hosts.map((host) => (
                                    <option key={host.id} value={host.id}>
                                        {host.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Field */}
                        <div className="relative w-56">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search visitor, code, host..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    triggerRefetch();
                                }}
                                className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 shadow-2xs"
                            />
                        </div>
                    </div>
                </div>

                {/* View Switcher & Controls */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 p-1.5">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleToday}
                            className="rounded-lg bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
                        >
                            Today
                        </button>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={handlePrev}
                                className="rounded-lg p-1 text-slate-600 hover:bg-white transition"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="rounded-lg p-1 text-slate-600 hover:bg-white transition"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight ml-1">
                            {titleText}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => handleViewChange('dayGridMonth')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                viewMode === 'dayGridMonth' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => handleViewChange('timeGridWeek')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                viewMode === 'timeGridWeek' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => handleViewChange('timeGridDay')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                viewMode === 'timeGridDay' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => handleViewChange('listMonth')}
                            className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                                viewMode === 'listMonth' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Agenda
                        </button>
                    </div>
                </div>

                {/* FullCalendar Container */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={false}
                        events={fetchEvents}
                        datesSet={(dateInfo) => setTitleText(dateInfo.view.title)}
                        editable={false}
                        selectable={true}
                        dateClick={handleDateClick}
                        eventClick={handleEventClick}
                        dayMaxEvents={4}
                        moreLinkClick="day"
                        height="auto"
                        eventContent={(eventInfo) => {
                            const style = getPurposeColorStyle(eventInfo.event.extendedProps.purpose);
                            return (
                                <div className={`flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold overflow-hidden border ${style.bg} ${style.border} ${style.text}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                                    <span className="truncate">{eventInfo.event.title}</span>
                                    {eventInfo.event.extendedProps.host_name && (
                                        <span className="text-[9px] opacity-75 truncate font-normal">
                                            ({eventInfo.event.extendedProps.host_name})
                                        </span>
                                    )}
                                </div>
                            );
                        }}
                    />
                </div>
            </div>

            {/* Mobile-first Day Summary Sheet */}
            <DayDetailSheet
                date={selectedDate}
                events={dayEvents}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                isAdminView={true}
            />
        </>
    );
}

AdminVisitorCalendar.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;
