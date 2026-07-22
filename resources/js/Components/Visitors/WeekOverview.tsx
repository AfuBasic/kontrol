import { useState } from 'react';
import { Link } from '@inertiajs/react';
import resident from '@/routes/resident';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';

type Props = {
    upcoming: VisitorTimelineItem[];
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function WeekOverview({ upcoming }: Props) {
    const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // Convert 0 (Sun) -> 6, 1 (Mon) -> 0

    // Group upcoming visits into current week days (0-6)
    // Find the Monday of current week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const weekCounts = DAYS.map((_, idx) => {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + idx);
        const dateStr = dayDate.toISOString().split('T')[0];

        const dayVisits = upcoming.filter((v) => v.arrival_date === dateStr);
        return {
            dayLabel: DAYS[idx],
            dateStr,
            isToday: idx === currentDayOfWeek,
            count: dayVisits.length,
            visits: dayVisits,
        };
    });

    const maxCount = Math.max(...weekCounts.map((d) => d.count), 1);
    const selectedDayData = selectedDayIndex !== null ? weekCounts[selectedDayIndex] : null;

    return (
        <div className="py-3">
            <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">This Week</h3>

            {/* Heatmap Bar Strip */}
            <div className="grid grid-cols-7 gap-1.5 rounded-xl border border-slate-100 bg-white/80 p-2.5 backdrop-blur-xs">
                {weekCounts.map((day, idx) => {
                    const heightPercent = day.count > 0 ? Math.max((day.count / maxCount) * 100, 20) : 0;

                    return (
                        <button
                            key={day.dayLabel}
                            onClick={() => setSelectedDayIndex(selectedDayIndex === idx ? null : idx)}
                            className={`flex flex-col items-center gap-1.5 rounded-lg py-2 transition ${
                                selectedDayIndex === idx
                                    ? 'bg-slate-900 text-white'
                                    : day.isToday
                                      ? 'bg-slate-100 text-slate-900 font-bold'
                                      : 'hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                            <span className="text-[10px] font-medium tracking-tight">{day.dayLabel}</span>

                            {/* Mini Activity Bar */}
                            <div className="flex h-7 w-full items-end justify-center px-2">
                                {day.count > 0 ? (
                                    <div
                                        className={`w-full rounded-xs transition-all ${
                                            selectedDayIndex === idx
                                                ? 'bg-amber-400'
                                                : day.isToday
                                                  ? 'bg-indigo-600'
                                                  : 'bg-slate-300'
                                        }`}
                                        style={{ height: `${heightPercent}%` }}
                                    />
                                ) : (
                                    <div className="h-0.5 w-2 rounded-full bg-slate-150" />
                                )}
                            </div>

                            <span className="text-[10px] font-semibold">
                                {day.count > 0 ? day.count : '—'}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Inline Progressive Disclosure for selected day */}
            {selectedDayData && (
                <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                            {selectedDayData.dayLabel} · {selectedDayData.count} visit{selectedDayData.count === 1 ? '' : 's'}
                        </span>
                        <button
                            onClick={() => setSelectedDayIndex(null)}
                            className="text-[10px] font-semibold text-slate-400 hover:text-slate-700"
                        >
                            Close
                        </button>
                    </div>

                    {selectedDayData.visits.length > 0 ? (
                        <div className="space-y-1.5">
                            {selectedDayData.visits.map((visit) => (
                                <Link
                                    key={visit.id}
                                    href={resident.visitors.show.url(visit.id, { query: { from_tab: 'schedule' } })}
                                    className="flex items-center justify-between rounded-lg bg-white p-2 text-xs font-medium text-slate-800 shadow-2xs hover:bg-slate-100"
                                >
                                    <span>{visit.arrival_time || 'All Day'} — {visit.visitor_name}</span>
                                    <span className="text-[10px] text-slate-400">{visit.purpose}</span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 italic">No visits scheduled for this day.</p>
                    )}
                </div>
            )}
        </div>
    );
}
