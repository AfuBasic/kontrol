import React from 'react';
import {
    CheckCircle2,
    CircleDot,
    Clock,
    Flame,
    Lock,
} from 'lucide-react';
import type { Incident, IncidentStatus } from '@/types/incidents';

interface ActivityItem {
    id: number;
    description: string;
    created_at: string;
    causer?: { name: string } | null;
}

interface Props {
    incident: Incident;
    activities?: ActivityItem[];
    className?: string;
}

interface Step {
    key: IncidentStatus;
    label: string;
    timestamp?: string | null;
    icon: React.ComponentType<{ className?: string }>;
}

export default function IncidentTimeline({ incident, activities = [], className = '' }: Props) {
    const steps: Step[] = [
        {
            key: 'pending',
            label: 'Reported',
            timestamp: incident.created_at,
            icon: CircleDot,
        },
        {
            key: 'acknowledged',
            label: 'Acknowledged',
            timestamp: incident.acknowledged_at,
            icon: Clock,
        },
        {
            key: 'resolving',
            label: 'In Progress',
            timestamp: incident.resolving_at,
            icon: Flame,
        },
        {
            key: 'solved',
            label: 'Resolved',
            timestamp: incident.solved_at,
            icon: CheckCircle2,
        },
        {
            key: 'closed',
            label: 'Closed',
            timestamp: incident.closed_at,
            icon: Lock,
        },
    ];

    const statusOrder: IncidentStatus[] = ['pending', 'acknowledged', 'resolving', 'solved', 'closed'];
    const currentIndex = statusOrder.indexOf(incident.status);

    const formatDate = (isoString?: string | null) => {
        if (!isoString) return null;
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Incident Lifecycle
                </h3>
                {incident.reference_code && (
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        {incident.reference_code}
                    </span>
                )}
            </div>

            <div className="relative space-y-6 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                {steps.map((step, idx) => {
                    const isCompleted = step.timestamp != null || idx <= currentIndex;
                    const isCurrent = step.key === incident.status;
                    const Icon = step.icon;

                    let circleBg = 'bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500';
                    if (isCurrent) {
                        circleBg = 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50 dark:ring-indigo-950/50';
                    } else if (isCompleted) {
                        circleBg = 'bg-emerald-500 border-emerald-500 text-white';
                    }

                    return (
                        <div key={step.key} className="relative flex items-start gap-3.5">
                            <div
                                className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${circleBg}`}
                            >
                                <Icon className="w-4 h-4" />
                            </div>

                            <div className="flex-1 pt-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className={`text-sm font-bold truncate ${
                                            isCurrent
                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                : isCompleted
                                                ? 'text-slate-900 dark:text-slate-100'
                                                : 'text-slate-400 dark:text-slate-500'
                                        }`}
                                    >
                                        {step.label}
                                    </p>
                                    {step.timestamp && (
                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {formatDate(step.timestamp)}
                                        </span>
                                    )}
                                </div>

                                {isCurrent && (
                                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                                        Current stage
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resolution summary callout if solved/closed */}
            {(incident.solved_at || incident.closed_at) && (
                <div className="mt-6 rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            Resolution Recorded
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-400 leading-relaxed">
                        {incident.closed_at
                            ? `Closed on ${formatDate(incident.closed_at)}`
                            : `Marked resolved on ${formatDate(incident.solved_at)}`}
                    </p>
                </div>
            )}

            {/* Activities list for admin context */}
            {activities.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Recent Activity Log
                    </h4>
                    <div className="space-y-2.5">
                        {activities.slice(0, 5).map((act) => (
                            <div key={act.id} className="text-xs flex items-start justify-between gap-2">
                                <span className="text-slate-600 dark:text-slate-300 font-medium">
                                    {act.causer ? (
                                        <span className="font-bold text-slate-900 dark:text-slate-100">
                                            {act.causer.name}{' '}
                                        </span>
                                    ) : null}
                                    {act.description}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap">
                                    {act.created_at}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
