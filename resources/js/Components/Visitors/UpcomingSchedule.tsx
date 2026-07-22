import { Link } from '@inertiajs/react';
import resident from '@/routes/resident';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';

type Props = {
    visits: VisitorTimelineItem[];
};

export default function UpcomingSchedule({ visits }: Props) {
    if (visits.length === 0) {
        return null;
    }

    // Group upcoming visits by day relative to today (Tomorrow, Saturday, Next Tuesday, etc.)
    const grouped = visits.reduce<Record<string, VisitorTimelineItem[]>>((acc, visit) => {
        const label = visit.arrival_date_formatted || visit.arrival_date || 'Upcoming';
        if (!acc[label]) acc[label] = [];
        acc[label].push(visit);
        return acc;
    }, {});

    const dayGroupKeys = Object.keys(grouped);

    return (
        <div className="space-y-2 py-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Upcoming</h3>

            <div className="space-y-2">
                {dayGroupKeys.map((dayLabel) => (
                    <div key={dayLabel} className="space-y-1">
                        <p className="px-1 text-xs font-bold text-slate-700">{dayLabel}</p>
                        <div className="divide-y divide-slate-100/80 rounded-xl border border-slate-100 bg-white/80 backdrop-blur-xs">
                            {grouped[dayLabel].map((visit) => (
                                <Link
                                    key={visit.id}
                                    href={resident.visitors.show.url(visit.id, { query: { from_tab: 'schedule' } })}
                                    className="flex items-center justify-between px-3.5 py-2.5 transition hover:bg-slate-50/60"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="w-16 shrink-0 font-mono text-xs font-bold text-slate-900">
                                            {visit.arrival_time || 'All Day'}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs font-bold text-slate-900">
                                                {visit.visitor_name}
                                            </p>
                                            {visit.purpose && (
                                                <p className="truncate text-[10px] text-slate-400">
                                                    {visit.purpose}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title="Scheduled" />
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
