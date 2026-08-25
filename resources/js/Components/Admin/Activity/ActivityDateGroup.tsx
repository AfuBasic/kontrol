import { format, parseISO, isToday, isYesterday } from 'date-fns';
import React from 'react';
import ActivityRow from '@/Components/Admin/Activity/ActivityRow';
import type { ActivityItem } from '@/types/activity';

interface ActivityDateGroupProps {
    date: string;
    items: ActivityItem[];
}

export default function ActivityDateGroup({ date, items }: ActivityDateGroupProps) {
    const getDateLabel = (dateStr: string) => {
        try {
            const parsed = parseISO(dateStr);
            if (isToday(parsed)) {
                return 'Today';
            }
            if (isYesterday(parsed)) {
                return 'Yesterday';
            }
            return format(parsed, 'EEEE, MMMM d, yyyy');
        } catch {
            return dateStr;
        }
    };

    return (
        <section className="space-y-3">
            {/* Sticky/pinned date header banner */}
            <div className="sticky top-28 z-10 -mx-2 bg-slate-50/90 px-2 py-1.5 backdrop-blur-md dark:bg-slate-950/90">
                <h3 className="font-bold text-xs tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    {getDateLabel(date)}
                </h3>
            </div>

            {/* Flat list of rows without vertical rails */}
            <div className="space-y-2.5">
                {items.map((act) => (
                    <ActivityRow key={act.id} activity={act} />
                ))}
            </div>
        </section>
    );
}
