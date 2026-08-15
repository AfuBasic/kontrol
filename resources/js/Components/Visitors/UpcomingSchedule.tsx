import VisitorRow from '@/Components/Visitors/VisitorRow';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';
import { formatRelativeDate } from '@/Utils/visitorTheme';

type Props = {
    visits: VisitorTimelineItem[];
};

export default function UpcomingSchedule({ visits }: Props) {
    if (visits.length === 0) {
        return null;
    }

    // Group upcoming visits by day relative to today (Tomorrow, Wed, Jul 26, etc.)
    const grouped = visits.reduce<Record<string, VisitorTimelineItem[]>>((acc, visit) => {
        const label = formatRelativeDate(visit.effective_visit_at || visit.arrival_date);
        if (!acc[label]) acc[label] = [];
        acc[label].push(visit);
        return acc;
    }, {});

    const dayGroupKeys = Object.keys(grouped);

    return (
        <div className="space-y-2 py-2">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Upcoming</h3>

            <div className="space-y-2">
                {dayGroupKeys.map((dayLabel) => (
                    <div key={dayLabel} className="space-y-1">
                        <p className="px-1 text-xs font-bold text-slate-700">{dayLabel}</p>
                        <div className="divide-y divide-slate-100/80 rounded-xl border border-slate-100 bg-white/80 backdrop-blur-xs">
                            {grouped[dayLabel].map((visit) => (
                                <VisitorRow key={visit.id} visit={visit} fromTab="schedule" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
