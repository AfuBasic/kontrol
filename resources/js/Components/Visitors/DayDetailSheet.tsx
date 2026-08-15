import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar as CalendarIcon, Clock, Plus, X, User, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getPurposeColorStyle } from '@/Utils/calendarTheme';

export type CalendarEventItem = {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    extendedProps: {
        code: string;
        visitor_name: string;
        visitor_phone: string | null;
        purpose: string;
        type: string;
        status: string;
        host_name?: string;
        used_at: string | null;
        expires_at: string | null;
        is_valid: boolean;
    };
};

type Props = {
    date: Date | null;
    events: CalendarEventItem[];
    isOpen: boolean;
    onClose: () => void;
    onCreateClick?: (dateStr: string) => void;
    isAdminView?: boolean;
};

export default function DayDetailSheet({ date, events, isOpen, onClose, onCreateClick, isAdminView = false }: Props) {
    if (!isOpen || !date) return null;

    const dateFormatted = date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    const dateStr = date.toISOString().split('T')[0];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-xs sm:items-center sm:p-4">
                {/* Backdrop Click */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0" />

                {/* Sheet Content Card */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase">Day Schedule</span>
                            <h3 className="text-base font-extrabold text-slate-900">{dateFormatted}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                            {onCreateClick && !isAdminView && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onCreateClick(dateStr);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-xl bg-primary-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-primary-700"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Invite</span>
                                </button>
                            )}
                            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Events List Scrollable Container */}
                    <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                        {events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="rounded-full bg-slate-50 p-4 text-slate-400">
                                    <CalendarIcon className="h-8 w-8" />
                                </div>
                                <h4 className="mt-3 text-xs font-bold text-slate-700">No visitors scheduled</h4>
                                <p className="text-[11px] text-slate-400">You're all clear for this day.</p>
                                {onCreateClick && !isAdminView && (
                                    <button
                                        onClick={() => {
                                            onClose();
                                            onCreateClick(dateStr);
                                        }}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50"
                                    >
                                        <Plus className="h-4 w-4 text-primary-600" />
                                        <span>Invite Visitor for {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            events.map((event) => {
                                const style = getPurposeColorStyle(event.extendedProps.purpose);
                                const isLongTerm = event.extendedProps.type === 'long_lived';
                                const timeStr = event.allDay
                                    ? 'All-Day Access Pass'
                                    : new Date(event.start).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                      });

                                const detailUrl = isAdminView ? '/admin/visitors' : `/resident/visitors/${event.id}`;

                                return (
                                    <Link
                                        key={event.id}
                                        href={detailUrl}
                                        className={`flex items-start justify-between rounded-2xl border p-3.5 transition-all hover:shadow-md ${style.bg} ${style.border}`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                                                <h4 className={`text-sm font-bold tracking-tight ${style.text}`}>
                                                    {event.extendedProps.visitor_name}
                                                </h4>
                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                                                    {event.extendedProps.purpose}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 text-xs text-slate-600">
                                                <span className="flex items-center gap-1 font-semibold">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    {timeStr}
                                                </span>

                                                {isAdminView && event.extendedProps.host_name && (
                                                    <span className="flex items-center gap-1 font-medium text-slate-500">
                                                        <User className="h-3.5 w-3.5 text-slate-400" />
                                                        Host: {event.extendedProps.host_name}
                                                    </span>
                                                )}
                                            </div>

                                            {isLongTerm && (
                                                <div className="text-[10px] font-medium text-slate-500">
                                                    Long-Term Pass • Valid until{' '}
                                                    {event.extendedProps.expires_at
                                                        ? new Date(event.extendedProps.expires_at).toLocaleDateString('en-US', {
                                                              month: 'short',
                                                              day: 'numeric',
                                                          })
                                                        : 'No expiry'}
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <span className="rounded-lg border border-slate-200 bg-white/80 px-2 py-1 font-mono text-xs font-bold text-slate-900 shadow-2xs">
                                                {event.extendedProps.code}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
