import { useEffect, useState } from 'react';
import type { VisitorTimelineItem } from '@/types/visitor-timeline';

type Props = {
    upcoming: VisitorTimelineItem[];
};

export default function ContextBanner({ upcoming }: Props) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

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
        const visitorName = imminent.visitor_name || 'Guest';
        let timeFormatted = '';
        if (diffMinutes >= 45) {
            const roundedHours = Math.round(diffMinutes / 60);
            timeFormatted = `~${roundedHours} hour${roundedHours === 1 ? '' : 's'}`;
        } else {
            timeFormatted = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
        }
        message = `${visitorName} arrives in ${timeFormatted}.`;
    } else if (todayVisits.length >= 3) {
        message = `Busy day ahead - ${todayVisits.length} visitors expected today.`;
    } else if (todayVisits.length > 0) {
        message = `${todayVisits.length} visitor${todayVisits.length === 1 ? '' : 's'} scheduled for today.`;
    } else if (upcoming.length > 0) {
        message = 'Next visitor arriving soon.';
    } else {
        message = "You're all clear today.";
    }

    return (
        <div className="py-1">
            <div className="flex items-center gap-2">
                {isImminent && (
                    <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                )}
                <p className={`text-xs font-semibold tracking-tight ${isImminent ? 'font-bold text-amber-950' : 'text-slate-600'}`}>{message}</p>
            </div>
        </div>
    );
}
