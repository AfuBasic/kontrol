import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Clock, Tag, Users, Calendar, AlertCircle, StickyNote } from 'lucide-react';
import type { AccessCode } from '@/types/access-code';

// ── Status configuration ──────────────────────────────────────────────────────

type StatusConfig = {
    label: string;
    className: string;
};

const DEFAULT_STATUS_MAP: Record<string, StatusConfig> = {
    active: { label: 'Expected', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    scheduled: { label: 'Scheduled', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    used: { label: 'Checked In', className: 'bg-blue-50 text-blue-700 border-blue-100' },
    expired: { label: 'Expired', className: 'bg-slate-100 text-slate-500 border-slate-200' },
    revoked: { label: 'Cancelled', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

const PASS_TYPE_ICON: Record<string, React.ElementType> = {
    single_use: Tag,
    long_lived: Calendar,
    event: Users,
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * VisitorAgendaCard — compact, scannable agenda row for the Visitor Timeline.
 *
 * Decision 5: This component is completely role-agnostic. It accepts
 * render-prop style overrides for status labels, secondary metadata, and
 * available actions so the exact same card can power:
 *   • Resident Visitor Passes
 *   • Security Expected Visitors
 *   • Estate Visitor Schedule / Dashboard widgets
 *
 * Decision 4: Only consumes arrival_time and completion_time — never raw
 * database timestamps.
 */
export type VisitorAgendaCardProps = {
    code: AccessCode;

    /** Override status label/colour mapping for role-specific wording. */
    statusMap?: Record<string, StatusConfig>;

    /**
     * Optional secondary metadata line rendered below the visitor name.
     * Defaults to the pass type label.
     */
    renderMeta?: (code: AccessCode) => React.ReactNode;

    /** Actions rendered at the right edge of the card. */
    renderActions?: (code: AccessCode) => React.ReactNode;

    /** Called when the card body is tapped (in addition to the link). */
    onPress?: (code: AccessCode) => void;

    /** URL the card navigates to. Defaults to the resident show route. */
    href?: string;

    /** Show arrival time label. Default: true. */
    showTime?: boolean;

    /** Show status badge. Default: true. */
    showStatus?: boolean;
};

export default function VisitorAgendaCard({
    code,
    statusMap = DEFAULT_STATUS_MAP,
    renderMeta,
    renderActions,
    href,
    showTime = true,
    showStatus = true,
}: VisitorAgendaCardProps) {
    const statusConfig = statusMap[code.status] ?? DEFAULT_STATUS_MAP[code.status] ?? {
        label: code.status,
        className: 'bg-slate-100 text-slate-600 border-slate-200',
    };

    const TypeIcon = PASS_TYPE_ICON[code.type] ?? Tag;
    const visitorLabel = code.visitor_name ?? 'Guest';
    const isHistoryItem = !!code.completion_at;

    // Decide which time to surface depending on context
    const timeLabel = isHistoryItem
        ? (code.completion_time ?? null)
        : (code.arrival_time ?? null);

    const cardContent = (
        <div className="flex items-center gap-3 w-full min-w-0">
            {/* Avatar / icon */}
            <div
                className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold select-none ${
                    isHistoryItem
                        ? 'bg-slate-100 text-slate-400'
                        : 'bg-indigo-50 text-indigo-600'
                }`}
            >
                {visitorLabel.charAt(0).toUpperCase()}
            </div>

            {/* Body */}
            <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span
                        className={`text-[13px] font-semibold leading-snug truncate ${
                            isHistoryItem ? 'text-slate-500' : 'text-slate-900'
                        }`}
                    >
                        {visitorLabel}
                    </span>
                    {code.type === 'event' && code.guest_limit && (
                        <span className="text-[10px] text-slate-400 font-medium">
                            {code.guest_limit} guests
                        </span>
                    )}
                    {code.notes && (
                        <StickyNote className="h-3 w-3 text-slate-300 flex-shrink-0" />
                    )}
                </div>

                {/* Secondary meta line */}
                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                    {showTime && timeLabel ? (
                        <>
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{timeLabel}</span>
                        </>
                    ) : showTime ? (
                        <span className="italic">Anytime</span>
                    ) : null}

                    {renderMeta ? (
                        renderMeta(code)
                    ) : (
                        <>
                            {showTime && <span className="text-slate-200">·</span>}
                            <TypeIcon className="h-3 w-3 flex-shrink-0" />
                            <span>
                                {code.type === 'single_use'
                                    ? 'One-Time'
                                    : code.type === 'long_lived'
                                      ? 'Long-Term'
                                      : 'Event'}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Right side: status + actions */}
            <div className="flex flex-shrink-0 items-center gap-2">
                {showStatus && (
                    <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusConfig.className}`}
                    >
                        {statusConfig.label}
                    </span>
                )}
                {renderActions?.(code)}
            </div>
        </div>
    );

    const wrapperClass =
        'flex w-full items-center gap-0 rounded-xl px-3.5 py-3 transition-colors active:bg-slate-50 hover:bg-slate-50/80 cursor-pointer';

    if (href) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            >
                <Link href={href} className={wrapperClass}>
                    {cardContent}
                </Link>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 20 }}
            className={wrapperClass}
        >
            {cardContent}
        </motion.div>
    );
}

export { DEFAULT_STATUS_MAP };
