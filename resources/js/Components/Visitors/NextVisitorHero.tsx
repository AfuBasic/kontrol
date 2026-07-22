import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';

type Props = {
    nextCode?: AccessCode | null;
};

export default function NextVisitorHero({ nextCode }: Props) {
    if (!nextCode) {
        return null; // When no upcoming visitors, ContextBanner handles "You're all clear today."
    }

    const visitorName = nextCode.visitor_name || 'Guest';
    const isToday = nextCode.arrival_date === new Date().toISOString().slice(0, 10);
    const timeStr = nextCode.arrival_time ? nextCode.arrival_time : 'Anytime';
    const label = isToday ? 'Arriving Today' : 'Arriving Next';

    return (
        <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-xl border border-slate-900 bg-slate-950 px-3.5 py-2.5 text-white shadow-xs"
        >
            <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                            {label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">•</span>
                        <span className="text-[10px] text-slate-300 font-semibold">
                            {isToday ? 'Today' : nextCode.arrival_date_formatted || nextCode.arrival_date} {timeStr !== 'Anytime' ? `at ${timeStr}` : ''}
                        </span>
                    </div>

                    <div className="mt-0.5 flex items-baseline gap-1.5 min-w-0">
                        <h2 className="truncate text-sm font-bold tracking-tight text-white">
                            {visitorName}
                        </h2>
                        {nextCode.purpose && (
                            <span className="truncate text-[11px] text-slate-400 font-normal">
                                · {nextCode.purpose}
                            </span>
                        )}
                    </div>
                </div>

                <Link
                    href={`/resident/visitors/${nextCode.id}?from_tab=upcoming`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-white/20"
                >
                    View Pass
                    <ChevronRight className="h-3 w-3 opacity-70" />
                </Link>
            </div>
        </motion.div>
    );
}
