import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import {
    
    AlertOctagon,
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Info,
    ShieldAlert,
} from 'lucide-react';

export type AttentionPreviewItem = {
    id: number | string;
    title: string;
    subtitle: string;
    context: string;
    avatar?: string | null;
};

export type AttentionItem = {
    id: string;
    type: string;
    title: string;
    desc: string;
    count?: number;
    severity: 'info' | 'warning' | 'danger' | 'critical';
    actionLabel?: string;
    actionUrl: string;
    previews?: AttentionPreviewItem[];
};

type Props = {
    items: AttentionItem[];
};

export default function ActionCenter({ items }: Props) {
    const totalPendingCount = items.reduce((sum, item) => sum + (item.count ?? 1), 0);

    return (
        <section className="space-y-3.5">
            {/* Header / Briefing Title */}
            <div className="flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2.5 min-w-0">
                    <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase whitespace-nowrap">Action Center</h3>
                    {items.length > 0 ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 whitespace-nowrap">
                            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-amber-500" />
                            <span>{totalPendingCount} {totalPendingCount === 1 ? 'Action Required' : 'Actions Required'}</span>
                        </span>
                    ) : (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 whitespace-nowrap">
                            <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-600" />
                            <span>All Clear</span>
                        </span>
                    )}
                </div>
                <span className="hidden sm:inline-block shrink-0 text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                    Executive Operational Briefing
                </span>
            </div>

            {/* Empty State */}
            {items.length === 0 ? (
                <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-2xs">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900">Executive Briefing: Normal Operations</h4>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                            No operational alerts, security events, or pending memberships require administrator action today.
                        </p>
                    </div>
                </div>
            ) : (
                /* Action Block Grid */
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {items.map((item) => (
                        <ActionBlockCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </section>
    );
}

function ActionBlockCard({ item }: { item: AttentionItem }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasPreviews = item.previews && item.previews.length > 0;
    const previewList = item.previews ? item.previews.slice(0, 4) : [];
    const remainingCount = (item.count ?? item.previews?.length ?? 0) - previewList.length;

    const severityConfig = getSeverityConfig(item.severity, item.type);
    const SeverityIcon = severityConfig.icon;

    return (
        <div
            className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-4 shadow-2xs transition hover:shadow-md ${severityConfig.cardBorder}`}
        >
            <div>
                {/* Header Row: Title, Severity Pill & Count */}
                <div className="flex flex-col gap-2.5 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${severityConfig.iconBg}`}>
                            <SeverityIcon className={`h-4 w-4 ${severityConfig.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 transition group-hover:text-primary-600 leading-snug">{item.title}</h4>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase whitespace-nowrap ${severityConfig.pillClass}`}
                                >
                                    {severityConfig.label}
                                </span>
                                {item.count !== undefined && item.count > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                        {item.count} {item.count === 1 ? 'item' : 'items'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Primary Action Button */}
                    <Link
                        href={item.actionUrl}
                        className="inline-flex shrink-0 self-start sm:self-auto items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-slate-800 active:scale-95"
                    >
                        <span>{item.actionLabel ?? 'Take Action'}</span>
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                </div>

                {/* Executive Summary Line */}
                <div className="pt-3">
                    <p className="text-xs leading-relaxed font-medium text-slate-600">{item.desc}</p>
                </div>

                {/* Progressive Disclosure Preview Section */}
                {hasPreviews && (
                    <div className="mt-3">
                        <button
                            onClick={() => setIsExpanded((prev) => !prev)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 transition hover:text-slate-900"
                        >
                            <span>{isExpanded ? 'Hide Preview' : `Preview Recent (${previewList.length})`}</span>
                            {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="mt-2.5 space-y-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5">
                                {previewList.map((pv) => (
                                    <div
                                        key={pv.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-white p-2 text-xs shadow-2xs"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-bold text-slate-900">{pv.title}</p>
                                            <p className="truncate text-[10px] font-semibold text-slate-400">{pv.subtitle}</p>
                                        </div>
                                        <span className="shrink-0 text-[10px] font-bold text-slate-500">{pv.context}</span>
                                    </div>
                                ))}

                                {remainingCount > 0 && (
                                    <div className="pt-1 text-center text-[10px] font-bold text-slate-400">
                                        + {remainingCount} more requiring administrator action
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function getSeverityConfig(severity: AttentionItem['severity'], type?: string) {
    if (type === 'suspicious_activity') {
        const isHigh = severity === 'critical' || severity === 'danger';

        return {
            label: isHigh ? 'High' : 'Elevated',
            icon: ShieldAlert,
            iconBg: isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700',
            iconColor: isHigh ? 'text-rose-700' : 'text-amber-700',
            pillClass: isHigh
                ? 'bg-rose-100 text-rose-800 border border-rose-200/60'
                : 'bg-amber-100 text-amber-800 border border-amber-200/60',
            cardBorder: isHigh ? 'border-rose-200/80 hover:border-rose-300' : 'border-amber-200/80 hover:border-amber-300',
        };
    }

    switch (severity) {
        case 'critical':
        case 'danger':
            return {
                label: 'Critical',
                icon: AlertOctagon,
                iconBg: 'bg-rose-100 text-rose-700',
                iconColor: 'text-rose-700',
                pillClass: 'bg-rose-100 text-rose-800 border border-rose-200/60',
                cardBorder: 'border-rose-200/80 hover:border-rose-300',
            };
        case 'warning':
            return {
                label: 'Warning',
                icon: AlertTriangle,
                iconBg: 'bg-amber-100 text-amber-700',
                iconColor: 'text-amber-700',
                pillClass: 'bg-amber-100 text-amber-800 border border-amber-200/60',
                cardBorder: 'border-amber-200/80 hover:border-amber-300',
            };
        case 'info':
        default:
            return {
                label: 'Information',
                icon: Info,
                iconBg: 'bg-blue-100 text-blue-700',
                iconColor: 'text-blue-700',
                pillClass: 'bg-blue-100 text-blue-800 border border-blue-200/60',
                cardBorder: 'border-slate-200 hover:border-slate-300',
            };
    }
}
