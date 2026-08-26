import React from 'react';
import { Clock, Users, ChevronRight } from 'lucide-react';
import { ActiveVisitItem } from '@/Components/Visitors/ResidentActiveVisits';

type Props = {
    activeVisits: ActiveVisitItem[];
    onViewAll: () => void;
};

export default function ActiveVisitsCallout({ activeVisits, onViewAll }: Props) {
    if (activeVisits.length === 0) {
        return null;
    }

    const firstTwo = activeVisits.slice(0, 2);
    const count = activeVisits.length;

    return (
        <div
            onClick={onViewAll}
            className="group cursor-pointer rounded-2xl border border-emerald-200/80 bg-linear-to-r from-emerald-50/80 via-white to-emerald-50/40 p-3.5 shadow-2xs transition-all hover:border-emerald-300 hover:shadow-xs dark:border-emerald-900/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-emerald-950/10"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        {count} {count === 1 ? 'visitor currently inside' : 'visitors currently inside'}
                    </span>
                </div>

                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 transition-transform group-hover:translate-x-0.5 dark:text-emerald-400">
                    <span>View active</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                </span>
            </div>

            <div className="mt-2 space-y-1">
                {firstTwo.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                            {v.visitor.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            since {v.verified_at_time || v.verified_at}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
