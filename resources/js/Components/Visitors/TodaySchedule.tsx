import VisitorRow from '@/Components/Visitors/VisitorRow';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';

type Props = {
    visits: VisitorTimelineItem[];
    onCancel?: (id: number) => void;
};

export default function TodaySchedule({ visits, onCancel }: Props) {
    if (visits.length === 0) {
        return null;
    }

    return (
        <div className="space-y-1.5 py-2">
            <h3 className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Today's Schedule</h3>
            <div className="divide-y divide-slate-100/80 rounded-xl border border-slate-100 bg-white/80 backdrop-blur-xs">
                {visits.map((visit) => (
                    <VisitorRow key={visit.id} visit={visit} fromTab="schedule" onCancel={onCancel} />
                ))}
            </div>
        </div>
    );
}
