import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, StickyNote } from 'lucide-react';
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
        nodeClass: 'bg-emerald-500 text-white ring-3 ring-emerald-100',
        textClass: 'text-emerald-700 font-semibold',
        icon: 'dot',
    },
    scheduled: {
        label: 'Scheduled',
        nodeClass: 'border-2 border-indigo-400 bg-white text-indigo-500',
        textClass: 'text-indigo-600 font-medium',
        icon: 'ring',
    },
    used: {
        label: 'Completed',
        nodeClass: 'bg-slate-300 text-slate-700',
        textClass: 'text-slate-500 font-medium',
        icon: 'check',
    },
    expired: {
        label: 'Expired',
        nodeClass: 'border border-slate-300 bg-slate-100 text-slate-400',
        textClass: 'text-slate-400 font-normal',
        icon: 'ring',
    },
    revoked: {
        label: 'Cancelled',
        nodeClass: 'border border-rose-300 bg-rose-50 text-rose-400',
        textClass: 'text-rose-400 font-normal',
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
        nodeClass: 'border border-slate-300 bg-white text-slate-400',
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

    const rowContent = (
        <div className="group relative flex items-center gap-3 py-2 px-1 rounded-lg transition-colors hover:bg-slate-50/90 active:bg-slate-100/80">
            {/* 1. Time Column (Left-aligned, prominent) */}
            {showTime && (
                <div className="w-16 shrink-0 text-right">
                    <span
                        className={`text-xs font-semibold tabular-nums tracking-tight ${
                            isHistoryItem ? 'text-slate-400 font-normal' : 'text-slate-700'
                        }`}
                    >
                        {timeLabel || 'Anytime'}
                    </span>
                </div>
            )}

            {/* 2. Timeline Node & Connector */}
            <div className="relative flex flex-col items-center shrink-0">
                <div
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] transition-transform group-hover:scale-110 ${statusConfig.nodeClass}`}
                >
                    {statusConfig.icon === 'check' && <Check className="h-2 w-2 stroke-[3]" />}
                </div>

                {!isLastInGroup && (
                    <div className="absolute top-4 bottom-0 w-px bg-slate-200/80" />
                )}
            </div>

            {/* 3. Event Details (Typography-first) */}
            <div className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                <div className="min-w-0 flex items-baseline gap-2 flex-wrap">
                    <span
                        className={`text-sm font-semibold tracking-tight truncate ${
                            isHistoryItem ? 'text-slate-500 font-normal' : 'text-slate-900'
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

                {/* Status & Actions on right edge */}
                <div className="flex items-center gap-2 shrink-0">
                    {renderMeta ? (
                        renderMeta(code)
                    ) : (
                        <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
                            {typeLabel}
                        </span>
                    )}

                    {showStatus && (
                        <span className={`text-[11px] ${statusConfig.textClass}`}>
                            {statusConfig.label}
                        </span>
                    )}

                    {renderActions && (
                        <div className="opacity-70 group-hover:opacity-100 transition-opacity">
                            {renderActions(code)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (href) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
            >
                <Link href={href} className="block cursor-pointer">
                    {rowContent}
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
            {rowContent}
        </motion.div>
    );
}

export { DEFAULT_STATUS_MAP };
