import { useEffect, useState } from 'react';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';

type Props = {
    upcoming: VisitorTimelineItem[];
};

export default function ContextBanner({ upcoming }: Props) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);

    // Find the chronologically next visit today or in future
    const todayStr = now.toISOString().split('T')[0];
    const todayVisits = upcoming.filter((v) => v.arrival_date === todayStr);

    // Check for imminent visitor (within 2 hours)
    const imminent = upcoming.find((v) => {
        if (!v.effective_visit_at) return false;
        const visitTime = new Date(v.effective_visit_at).getTime();
        const diffMinutes = (visitTime - now.getTime()) / (1000 * 60);
        return diffMinutes > 0 && diffMinutes <= 120;
    });

    let message = '';
    let isImminent = false;

    if (imminent) {
        isImminent = true;
        const visitTime = new Date(imminent.effective_visit_at).getTime();
        const diffMinutes = Math.round((visitTime - now.getTime()) / (1000 * 60));
        message = `${imminent.visitor_name} arrives in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}.`;
    } else if (todayVisits.length >= 3) {
        message = `Busy day ahead — ${todayVisits.length} visitors scheduled today.`;
    } else if (todayVisits.length > 0) {
        const next = todayVisits[0];
        message = `Next up: ${next.visitor_name}${next.arrival_time ? ` at ${next.arrival_time}` : ''}.`;
    } else if (upcoming.length > 0) {
        const next = upcoming[0];
        message = `Next visitor: ${next.visitor_name} (${next.arrival_date_formatted || next.arrival_date}).`;
    } else {
        message = "You're all clear today.";
    }

    return (
        <div className="py-2.5">
            <div className="flex items-center gap-2">
                {isImminent && (
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                    </span>
                )}
                <p className={`text-sm font-semibold tracking-tight ${isImminent ? 'text-amber-950 font-bold' : 'text-slate-700'}`}>
                    {message}
                </p>
            </div>
        </div>
    );
}
