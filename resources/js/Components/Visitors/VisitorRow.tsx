import { Link } from '@inertiajs/react';
import StatusBadge from '@/Components/Visitors/StatusBadge';
import VisitorAvatar from '@/Components/Visitors/VisitorAvatar';
import resident from '@/routes/resident';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';
import { deriveCategory, formatRelativeDate } from '@/Utils/visitorTheme';

type Props = {
    visit: VisitorTimelineItem | any;
    fromTab?: 'schedule' | 'history' | 'upcoming';
    onCancel?: (id: number) => void;
};

export default function VisitorRow({ visit, fromTab = 'schedule', onCancel }: Props) {
    const category = deriveCategory(visit.purpose, visit.type);
    const dateFormatted = formatRelativeDate(visit.effective_visit_at || visit.arrival_date);

    return (
        <div className="group flex items-center justify-between px-3.5 py-3 transition hover:bg-slate-50/60">
            <Link href={resident.visitors.show.url(visit.id, { query: { from_tab: fromTab } })} className="flex min-w-0 flex-1 items-center gap-3">
                {/* Category Avatar Anchor */}
                <VisitorAvatar category={category} name={visit.visitor_name} size="md" />

                {/* Visitor Details */}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-bold text-slate-900">{visit.visitor_name}</p>
                        {visit.arrival_time && <span className="font-mono text-[10px] font-semibold text-slate-400">• {visit.arrival_time}</span>}
                    </div>
                    <p className="truncate text-[11px] font-medium text-slate-400">
                        {dateFormatted} {visit.purpose ? `· ${visit.purpose}` : ''}
                    </p>
                </div>
            </Link>

            {/* Status & Actions */}
            <div className="flex items-center gap-2">
                <StatusBadge codeObj={visit} />

                {onCancel && visit.status !== 'revoked' && visit.status !== 'used' && (
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            onCancel(visit.id);
                        }}
                        className="hidden text-[11px] font-semibold text-slate-400 group-hover:inline-block hover:text-rose-600"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </div>
    );
}
