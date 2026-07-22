import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, Clock, StickyNote } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';

export type StatusConfig = {
    label: string;
    nodeClass: string;
    textClass: string;
    icon?: 'check' | 'dot' | 'ring';
};

const DEFAULT_STATUS_MAP: Record<string, StatusConfig> = {
    active: {
        label: 'Expected',
        nodeClass: 'bg-emerald-500 ring-4 ring-emerald-50 text-white',
        textClass: 'text-emerald-700 font-semibold',
        icon: 'dot',
    },
    scheduled: {
        label: 'Scheduled',
        nodeClass: 'border-2 border-indigo-500 bg-white text-indigo-600',
        textClass: 'text-indigo-600 font-medium',
        icon: 'ring',
    },
    used: {
        label: 'Checked In',
        nodeClass: 'bg-slate-700 text-white',
        textClass: 'text-slate-600 font-medium',
        icon: 'check',
    },
    expired: {
        label: 'Expired',
        nodeClass: 'border-2 border-slate-300 bg-slate-100 text-slate-400',
        textClass: 'text-slate-400 font-normal',
        icon: 'ring',
    },
    revoked: {
        label: 'Cancelled',
        nodeClass: 'border-2 border-rose-300 bg-rose-50 text-rose-500',
        textClass: 'text-rose-500 font-normal',
        icon: 'ring',
    },
};

export type VisitorAgendaCardProps = {
    code: AccessCode;
    statusMap?: Record<string, StatusConfig>;
    renderMeta?: (code: AccessCode) => React.ReactNode;
    renderActions?: (code: AccessCode) => React.ReactNode;
    onPress?: (code: AccessCode) => void;
    href?: string;
    showTime?: boolean;
    showStatus?: boolean;
    isLastInGroup?: boolean;
};

export default function VisitorAgendaCard({
    code,
    statusMap = DEFAULT_STATUS_MAP,
    renderMeta,
    renderActions,
    href,
    showTime = true,
    showStatus = true,
    isLastInGroup = false,
}: VisitorAgendaCardProps) {
    const statusConfig = statusMap[code.status] ?? DEFAULT_STATUS_MAP[code.status] ?? {
        label: code.status,
        nodeClass: 'border-2 border-slate-300 bg-white text-slate-400',
        textClass: 'text-slate-500 font-normal',
        icon: 'ring',
    };

    const visitorName = code.visitor_name || 'Guest';
    const isHistoryItem = !!code.completion_at;

    const timeLabel = isHistoryItem
        ? (code.completion_time ?? null)
        : (code.arrival_time ?? null);

    const typeLabel =
        code.type === 'single_use'
            ? 'One-Time'
            : code.type === 'long_lived'
              ? 'Long-Term'
              : 'Event';

    const cardInner = (
        <div className="group relative flex items-start gap-4 py-2.5 px-2 transition-colors rounded-xl hover:bg-slate-50/80">
            {/* Timeline vertical connector & status node */}
            <div className="relative flex flex-col items-center shrink-0 pt-1">
                {/* Status node */}
                <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] transition-transform group-hover:scale-110 ${statusConfig.nodeClass}`}
                >
                    {statusConfig.icon === 'check' && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                </div>

                {/* Connecting line */}
                {!isLastInGroup && (
                    <div className="absolute top-5 bottom-0 w-px bg-slate-200/70" />
                )}
            </div>

            {/* Time column */}
            {showTime && (
                <div className="w-16 shrink-0 pt-0.5 text-right">
                    <span
                        className={`text-xs font-semibold tabular-nums tracking-tight ${
                            isHistoryItem ? 'text-slate-400' : 'text-slate-700'
                        }`}
                    >
                        {timeLabel || 'Anytime'}
                    </span>
                </div>
            )}

            {/* Visitor details */}
            <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                        className={`text-sm font-semibold leading-snug truncate ${
                            isHistoryItem ? 'text-slate-500 line-through/40' : 'text-slate-900'
                        }`}
                    >
                        {visitorName}
                    </span>

                    {code.purpose && (
                        <span className="text-xs text-slate-400 font-normal truncate">
                            · {code.purpose}
                        </span>
                    )}

                    {code.notes && (
                        <StickyNote className="h-3 w-3 text-slate-300 shrink-0" />
                    )}
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400 font-normal">
                    {renderMeta ? (
                        renderMeta(code)
                    ) : (
                        <span>{typeLabel}</span>
                    )}

                    {showStatus && (
                        <>
                            <span>·</span>
                            <span className={`text-[11px] ${statusConfig.textClass}`}>
                                {statusConfig.label}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Action buttons on far right */}
            {renderActions && (
                <div className="shrink-0 pt-0.5 opacity-80 transition-opacity group-hover:opacity-100">
                    {renderActions(code)}
                </div>
            )}
        </div>
    );

    if (href) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
            >
                <Link href={href} className="block cursor-pointer">
                    {cardInner}
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
        >
            {cardInner}
        </motion.div>
    );
}

export { DEFAULT_STATUS_MAP };
