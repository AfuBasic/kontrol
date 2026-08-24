import React from 'react';
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    Clock,
    Flame,
    Lock,
    Shield,
    Sparkles,
    UserCheck,
} from 'lucide-react';
import type { Incident, IncidentStatus } from '@/types/incidents';

interface Props {
    incident: Incident;
    onAcknowledge: () => void;
    onBeginResolution: () => void;
    onOpenResolveModal: () => void;
    isUpdatingStatus?: boolean;
    className?: string;
}

interface StateDetails {
    badgeLabel: string;
    title: string;
    description: string;
    icon: React.ElementType;
    bgClass: string;
    borderClass: string;
    textClass: string;
    accentClass: string;
}

const STATE_CONFIG: Record<IncidentStatus, StateDetails> = {
    pending: {
        badgeLabel: 'Reported',
        title: 'Awaiting Management Acknowledgement',
        description:
            'This incident was reported and is currently pending initial review. Acknowledge this report to notify the reporter and start tracking response SLA.',
        icon: AlertCircle,
        bgClass: 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900',
        borderClass: 'border-amber-200/90 dark:border-amber-900/50',
        textClass: 'text-amber-900 dark:text-amber-200',
        accentClass: 'bg-amber-500 text-white',
    },
    acknowledged: {
        badgeLabel: 'Acknowledged',
        title: 'Acknowledged — Ready for Action',
        description:
            'Management has acknowledged the report. When maintenance personnel or security begins field work, begin resolution to mark this case in progress.',
        icon: Clock,
        bgClass: 'bg-gradient-to-br from-blue-50/90 via-blue-50/40 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900',
        borderClass: 'border-blue-200/90 dark:border-blue-900/50',
        textClass: 'text-blue-900 dark:text-blue-200',
        accentClass: 'bg-blue-600 text-white',
    },
    resolving: {
        badgeLabel: 'In Progress',
        title: 'Active Resolution Underway',
        description:
            'Work is actively being executed on this case. Once technicians or security confirm the issue has been rectified, record resolution notes and mark as resolved.',
        icon: Flame,
        bgClass: 'bg-gradient-to-br from-indigo-50/90 via-indigo-50/40 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900',
        borderClass: 'border-indigo-200/90 dark:border-indigo-900/50',
        textClass: 'text-indigo-900 dark:text-indigo-200',
        accentClass: 'bg-indigo-600 text-white',
    },
    solved: {
        badgeLabel: 'Resolved by Management',
        title: 'Resolved — Awaiting Reporter Confirmation',
        description:
            'Estate management marked this issue as resolved. The original reporter has been notified to verify the fix and close the case.',
        icon: CheckCircle2,
        bgClass: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900',
        borderClass: 'border-emerald-200/90 dark:border-emerald-900/50',
        textClass: 'text-emerald-900 dark:text-emerald-200',
        accentClass: 'bg-emerald-600 text-white',
    },
    closed: {
        badgeLabel: 'Closed & Archived',
        title: 'Case Successfully Closed',
        description:
            'This incident was confirmed resolved and closed by the reporter. It is archived for estate historical and compliance records.',
        icon: Lock,
        bgClass: 'bg-gradient-to-br from-slate-100/90 via-slate-50 to-white dark:from-slate-800/60 dark:via-slate-900 dark:to-slate-900',
        borderClass: 'border-slate-200 dark:border-slate-800',
        textClass: 'text-slate-800 dark:text-slate-200',
        accentClass: 'bg-slate-700 text-white',
    },
};

export default function CurrentResponseSection({
    incident,
    onAcknowledge,
    onBeginResolution,
    onOpenResolveModal,
    isUpdatingStatus = false,
    className = '',
}: Props) {
    const status = incident.status;
    const config = STATE_CONFIG[status] || STATE_CONFIG.pending;
    const Icon = config.icon;

    return (
        <section
            className={`relative overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${config.bgClass} ${config.borderClass} ${className}`}
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                {/* Status & Operational Narrative */}
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-xs ${config.accentClass}`}
                    >
                        <Icon className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">
                                Current Response
                            </span>
                            <span className="inline-flex items-center rounded-md bg-white/80 dark:bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs border border-slate-200/60 dark:border-slate-700">
                                {config.badgeLabel}
                            </span>
                            {incident.assignee && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Assigned to {incident.assignee.name}</span>
                                </span>
                            )}
                        </div>

                        <h2 className={`text-base sm:text-lg font-black tracking-tight ${config.textClass}`}>
                            {config.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-normal">
                            {config.description}
                        </p>
                    </div>
                </div>

                {/* Authoritative Single Next Action Button */}
                <div className="shrink-0 pt-2 md:pt-0 border-t border-slate-200/60 dark:border-slate-800 md:border-t-0">
                    {status === 'pending' && (
                        <button
                            type="button"
                            onClick={onAcknowledge}
                            disabled={isUpdatingStatus}
                            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <Sparkles className="h-4 w-4" />
                            <span>{isUpdatingStatus ? 'Updating...' : 'Acknowledge Incident'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}

                    {status === 'acknowledged' && (
                        <button
                            type="button"
                            onClick={onBeginResolution}
                            disabled={isUpdatingStatus}
                            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <Flame className="h-4 w-4" />
                            <span>{isUpdatingStatus ? 'Updating...' : 'Begin Resolution'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}

                    {status === 'resolving' && (
                        <button
                            type="button"
                            onClick={onOpenResolveModal}
                            disabled={isUpdatingStatus}
                            className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>{isUpdatingStatus ? 'Updating...' : 'Mark as Resolved'}</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    )}

                    {status === 'solved' && (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                            <Shield className="h-4 w-4 shrink-0" />
                            <span>Awaiting resident closing confirmation</span>
                        </div>
                    )}

                    {status === 'closed' && (
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span>Closed & Archived</span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
