import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2, ChevronRight, Clock, User } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';

type Props = {
    nextCode?: AccessCode | null;
    totalExpectedToday?: number;
};

export default function NextVisitorHero({ nextCode, totalExpectedToday = 0 }: Props) {
    if (!nextCode) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50/80 to-slate-100/40 p-5 text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
            >
                <div className="flex items-center gap-3.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/80 shadow-xs">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Next Visit
                            </h2>
                        </div>
                        <p className="mt-0.5 text-sm font-semibold text-slate-800">
                            You&apos;re all clear
                        </p>
                        <p className="text-xs text-slate-400 font-normal">
                            No upcoming visitors scheduled at the moment.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    const visitorName = nextCode.visitor_name || 'Guest';
    const isToday = nextCode.arrival_date === new Date().toISOString().slice(0, 10);
    const arrivalTimeStr = nextCode.arrival_time ? nextCode.arrival_time : 'Anytime';

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-2xl border border-slate-900/90 bg-slate-950 p-5 text-white shadow-md transition-all hover:border-slate-800"
        >
            {/* Soft decorative background glow */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-2xl" />

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-400/20">
                            <Clock className="h-3 w-3" />
                            Next Visitor
                        </span>

                        {isToday && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/20">
                                Today
                            </span>
                        )}
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                        <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                            {visitorName}
                        </h2>
                        {nextCode.purpose && (
                            <span className="text-xs text-slate-400 font-medium">
                                · {nextCode.purpose}
                            </span>
                        )}
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                            {nextCode.arrival_date ? nextCode.arrival_date : 'Scheduled'}
                        </span>
                        <span>·</span>
                        <span className="text-white font-semibold">{arrivalTimeStr}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 pt-2 sm:pt-0">
                    <Link
                        href={`/resident/visitors/${nextCode.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 active:scale-98"
                    >
                        View Pass
                        <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
