import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';

type Props = {
    nextCode?: AccessCode | null;
    totalExpectedToday?: number;
};

export default function PlannerSummary({ nextCode, totalExpectedToday = 0 }: Props) {
    if (!nextCode) {
        return (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 py-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>You&apos;re all clear today. No upcoming visitors scheduled.</span>
            </div>
        );
    }

    const visitorName = nextCode.visitor_name || 'Guest';
    const isToday = nextCode.arrival_date === new Date().toISOString().slice(0, 10);
    const arrivalTime = nextCode.arrival_time || 'Anytime';

    return (
        <div className="flex items-center justify-between gap-3 text-xs font-medium text-slate-600 py-1 border-b border-slate-100/80 pb-3">
            <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="truncate font-semibold text-slate-900">
                    Next: {visitorName}
                </span>
                <span className="text-slate-400 font-normal shrink-0">
                    · {isToday ? 'Today' : nextCode.arrival_date} at {arrivalTime}
                </span>
            </div>

            {totalExpectedToday > 0 && (
                <div className="shrink-0 text-[11px] font-semibold text-slate-400">
                    {totalExpectedToday} {totalExpectedToday === 1 ? 'visit' : 'visits'} today
                </div>
            )}
        </div>
    );
}
