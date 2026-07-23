import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar as CalendarIcon, Filter, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import DayDetailSheet from '@/Components/Visitors/DayDetailSheet';
import ResidentLayout from '@/Layouts/ResidentLayout';
import resident from '@/routes/resident';
import { getPurposeColorStyle } from '@/Utils/calendarTheme';
import type { CalendarEventItem } from '@/Components/Visitors/DayDetailSheet';

type Props = {
    initialFilters?: {
        purpose?: string;
        status?: string;
        type?: string;
        search?: string;
    };
};

const PURPOSES = ['All', 'Family', 'Friends', 'Maintenance', 'Delivery', 'Healthcare', 'Business'];

export default function ResidentVisitorCalendar({ initialFilters }: Props) {
    const calendarRef = useRef<FullCalendar | null>(null);
    const [viewMode, setViewMode] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth'>('dayGridMonth');
    const [selectedPurpose, setSelectedPurpose] = useState<string>(initialFilters?.purpose || 'All');
    const [searchQuery, setSearchQuery] = useState<string>(initialFilters?.search || '');

    // Day detail drawer state
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dayEvents, setDayEvents] = useState<CalendarEventItem[]>([]);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [titleText, setTitleText] = useState<string>('');

    // Fetch events dynamically via date range API
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
                if (searchQuery.trim()) {
                    params.append('search', searchQuery.trim());
                }

                const response = await fetch(`${resident.visitors['calendar-events'].url()}?${params.toString()}`);
                const data = await response.json();
                successCallback(data);
            } catch (err) {
                failureCallback(err);
            }
        },
        [selectedPurpose, searchQuery]
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
            const matching = clientEvents.filter((ev) => {
                const evStart = new Date(ev.startStr).toISOString().split('T')[0];
                return evStart === info.dateStr;
            }).map((ev) => ({
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

    // Refetch calendar events when filters change
    const triggerRefetch = () => {
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
    };

    const handlePurposeChange = (purpose: string) => {
        setSelectedPurpose(purpose);
        setTimeout(() => triggerRefetch(), 50);
    };

    const handlePrev = () => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.prev();
            setTitleText(api.view.title);
        }
    };

    const handleNext = () => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.next();
            setTitleText(api.view.title);
        }
    };

    const handleToday = () => {
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.today();
            setTitleText(api.view.title);
        }
    };

    const handleViewChange = (mode: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listMonth') => {
        setViewMode(mode);
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.changeView(mode);
            setTitleText(api.view.title);
        }
    };

    return (
        <>
            <Head title="Visitor Calendar" />

            <div className="mx-auto max-w-4xl px-2 sm:px-4 py-2 space-y-3 pb-24">
                {/* Header Navigation & Action Bar */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 pt-1">
                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/resident/visitors"
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Timeline</span>
                        </Link>
                        <div>
                            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">Visitor Calendar</h1>
                        </div>
                    </div>

                    <button
                        onClick={() => router.get('/resident/visitors/create')}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Invite</span>
                    </button>
                </div>

                {/* Search & Purpose Filter Bar */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center justify-between">
                    {/* Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                        {PURPOSES.map((purpose) => (
                            <button
                                key={purpose}
                                onClick={() => handlePurposeChange(purpose)}
                                className={`rounded-full px-3 py-1 text-xs font-bold transition-all shrink-0 ${
                                    selectedPurpose === purpose
                                        ? 'bg-primary-600 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {purpose}
                            </button>
                        ))}
                    </div>

                    {/* Search Field */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search visitor, code..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                triggerRefetch();
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 shadow-2xs"
                        />
                    </div>
                </div>

                {/* Controls Bar (Month/Week/Day Switcher + Date Navigation) */}
                <div className="flex items-center justify-between rounded-2xl bg-slate-100/80 p-1.5">
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={handleToday}
                            className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition"
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
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                viewMode === 'dayGridMonth' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Month
                        </button>
                        <button
                            onClick={() => handleViewChange('timeGridWeek')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                viewMode === 'timeGridWeek' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => handleViewChange('timeGridDay')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                viewMode === 'timeGridDay' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Day
                        </button>
                        <button
                            onClick={() => handleViewChange('listMonth')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                viewMode === 'listMonth' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            Agenda
                        </button>
                    </div>
                </div>

                {/* Premium Styled FullCalendar Container */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
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
                        dayMaxEvents={3}
                        moreLinkClick="day"
                        height="auto"
                        eventContent={(eventInfo) => {
                            const style = getPurposeColorStyle(eventInfo.event.extendedProps.purpose);
                            return (
                                <div className={`flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-[11px] font-bold overflow-hidden border ${style.bg} ${style.border} ${style.text}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
                                    <span className="truncate">{eventInfo.event.title}</span>
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
                onCreateClick={(dateStr) => router.get('/resident/visitors/create', { date: dateStr })}
            />
        </>
    );
}

ResidentVisitorCalendar.layout = (page: React.ReactNode) => <ResidentLayout>{page}</ResidentLayout>;
