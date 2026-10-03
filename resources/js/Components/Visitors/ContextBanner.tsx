import { useEffect, useState } from 'react';
export type UpcomingSummary = {
    total: number;
    today: number;
    imminent: { visitor_name: string | null; effective_visit_at: string } | null;
};

type Props = {
    summary: UpcomingSummary;
};

export default function ContextBanner({ summary }: Props) {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    // Counts come from the server so they stay correct while the list below loads page by page.
    const imminent = summary.imminent;
    const todayCount = summary.today;

    let message = '';
    let isImminent = false;

    if (imminent) {
        isImminent = true;
        const visitTime = new Date(imminent.effective_visit_at).getTime();
        const diffMinutes = Math.max(1, Math.round((visitTime - now.getTime()) / (1000 * 60)));
        const visitorName = imminent.visitor_name || 'Guest';
        let timeFormatted = '';
        if (diffMinutes >= 45) {
            const roundedHours = Math.round(diffMinutes / 60);
            timeFormatted = `~${roundedHours} hour${roundedHours === 1 ? '' : 's'}`;
        } else {
            timeFormatted = `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
        }
        message = `${visitorName} arrives in ${timeFormatted}.`;
    } else if (todayCount >= 3) {
        message = `Busy day ahead - ${todayCount} visitors expected today.`;
    } else if (todayCount > 0) {
        message = `${todayCount} visitor${todayCount === 1 ? '' : 's'} scheduled for today.`;
    } else if (summary.total > 0) {
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
