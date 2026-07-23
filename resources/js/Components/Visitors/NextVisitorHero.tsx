import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import VisitorAvatar from '@/Components/Visitors/VisitorAvatar';
import type { AccessCode } from '@/types/access-code';
import { deriveCategory, formatRelativeDate } from '@/Utils/visitorTheme';

type Props = {
    nextCode?: AccessCode | null;
};

export default function NextVisitorHero({ nextCode }: Props) {
    if (!nextCode) {
        return null;
    }

    const visitorName = nextCode.visitor_name || 'Guest';
    const category = deriveCategory(nextCode.purpose, nextCode.type);
    const dateFormatted = formatRelativeDate(nextCode.starts_at || (nextCode as any).effective_visit_at || (nextCode as any).arrival_date);
    const timeStr = (nextCode as any).arrival_time ? (nextCode as any).arrival_time : 'Anytime';
    const label = dateFormatted === 'Today' ? 'Arriving Today' : 'Arriving Next';

    return (
        <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-xl border border-primary-700 bg-primary-900 p-3.5 text-white shadow-md"
        >
            {/* Ambient Kontrol Blue Glow Accent */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary-500/20 blur-xl" />

            <div className="relative z-10 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Visitor Category Avatar */}
                    <VisitorAvatar category={category} name={visitorName} size="md" />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-300">
                                {label}
                            </span>
                            <span className="text-[10px] text-primary-400 font-medium">•</span>
                            <span className="text-[10px] text-primary-200 font-semibold">
                                {dateFormatted} {timeStr !== 'Anytime' ? `at ${timeStr}` : ''}
                            </span>
                        </div>

                        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
                            <h2 className="text-sm font-bold tracking-tight text-white">
                                {visitorName}
                            </h2>
                            {nextCode.purpose && (
                                <span className="text-[11px] text-primary-300 font-normal">
                                    · {nextCode.purpose}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <Link
                    href={`/resident/visitors/${nextCode.id}?from_tab=upcoming`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-bold text-white transition hover:bg-white/25"
                >
                    View Pass
                    <ChevronRight className="h-3.5 w-3.5 opacity-80" />
                </Link>
            </div>
        </motion.div>
    );
}
