import { Link } from '@inertiajs/react';
import resident from '@/routes/resident';
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
        <div className="space-y-1.5 py-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Schedule</h3>
            <div className="divide-y divide-slate-100/80 rounded-xl border border-slate-100 bg-white/80 backdrop-blur-xs">
                {visits.map((visit) => (
                    <div
                        key={visit.id}
                        className="group flex items-center justify-between px-3.5 py-3 transition hover:bg-slate-50/60"
                    >
                        <Link
                            href={resident.visitors.show.url(visit.id, { query: { from_tab: 'schedule' } })}
                            className="flex flex-1 items-center gap-3 min-w-0"
                        >
                            {/* Time Axis */}
                            <span className="w-16 shrink-0 font-mono text-xs font-bold text-slate-900">
                                {visit.arrival_time || 'All Day'}
                            </span>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                    {visit.visitor_name}
                                </p>
                                {visit.purpose && (
                                    <p className="truncate text-[11px] text-slate-400">
                                        {visit.purpose}
                                    </p>
                                )}
                            </div>
                        </Link>

                        {/* Status dot & Cancel action */}
                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    visit.status === 'active'
                                        ? 'bg-emerald-500'
                                        : visit.status === 'scheduled'
                                          ? 'bg-blue-500'
                                          : 'bg-slate-300'
                                }`}
                                title={visit.status}
                            />
                            {onCancel && visit.status !== 'revoked' && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onCancel(visit.id);
                                    }}
                                    className="hidden text-[11px] font-medium text-slate-400 hover:text-rose-600 group-hover:inline-block"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
