import React from 'react';
import { CheckCircle2, CircleDot, Clock, Flame, Lock } from 'lucide-react';
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
    variant?: 'default' | 'security';
    className?: string;
}

interface Step {
    key: IncidentStatus;
    label: string;
    timestamp?: string | null;
    icon: React.ComponentType<{ className?: string }>;
}

export default function IncidentTimeline({ incident, activities = [], variant = 'default', className = '' }: Props) {
    const isSecurity = variant === 'security';
    const dark = (classes: string): string => (isSecurity ? '' : classes);

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
        if (!isoString) {
            return null;
        }

        try {
            const d = new Date(isoString);

            if (isSecurity) {
                const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                return `${date} · ${time}`;
            }

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
        <div
            className={
                isSecurity
                    ? `border-t border-slate-100 pt-4 lg:rounded-2xl lg:border lg:border-slate-200/90 lg:bg-white lg:p-4 lg:pt-4 lg:shadow-xs lg:ring-1 lg:ring-slate-100/60 ${className}`
                    : `rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs ${dark('dark:border-slate-800 dark:bg-slate-900')} ${className}`
            }
        >
            <div
                className={
                    isSecurity
                        ? 'mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3'
                        : `mb-4 flex items-center justify-between border-b border-slate-100 pb-4 ${dark('dark:border-slate-800')}`
                }
            >
                <h3
                    className={
                        isSecurity
                            ? 'text-xs font-bold text-slate-900'
                            : `text-xs font-black tracking-wider text-slate-400 uppercase ${dark('dark:text-slate-500')}`
                    }
                >
                    Incident Lifecycle
                </h3>
                {incident.reference_code && (
                    <span
                        className={
                            isSecurity
                                ? 'font-mono text-[11px] font-bold text-slate-400'
                                : `font-mono text-xs font-bold text-slate-500 ${dark('dark:text-slate-400')}`
                        }
                    >
                        {incident.reference_code}
                    </span>
                )}
            </div>

            {isSecurity ? (
                <ol className="space-y-0">
                    {steps.map((step, idx) => {
                        const isLast = idx === steps.length - 1;
                        const isCompleted = step.timestamp != null || idx < currentIndex;
                        const isCurrent = step.key === incident.status;
                        const Icon = step.icon;
                        const connectorReached = isCompleted || isCurrent;

                        let circleBg = 'border-slate-400 bg-white text-slate-500';
                        let labelClass = 'font-semibold text-slate-500';

                        if (isCurrent) {
                            circleBg = 'border-indigo-600 bg-indigo-600 text-white ring-2 ring-indigo-100';
                            labelClass = 'font-bold text-slate-900';
                        } else if (isCompleted) {
                            circleBg = 'border-emerald-500 bg-emerald-500 text-white';
                            labelClass = 'font-bold text-slate-900';
                        }

                        return (
                            <li key={step.key} className="relative flex items-start gap-3">
                                <div className="flex w-8 shrink-0 flex-col items-center self-stretch">
                                    <div
                                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-xl border transition-colors ${circleBg}`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    {!isLast && <div className={`mt-1 min-h-4 w-px flex-1 ${connectorReached ? 'bg-indigo-200' : 'bg-slate-200'}`} />}
                                </div>

                                <div className={`min-w-0 flex-1 ${isLast ? 'pb-0' : 'pb-4'}`}>
                                    <div className="flex flex-col gap-0.5 min-[400px]:flex-row min-[400px]:items-baseline min-[400px]:justify-between min-[400px]:gap-3">
                                        <p className={`text-sm ${labelClass}`}>{step.label}</p>
                                        {step.timestamp && (
                                            <time className="text-[11px] font-medium text-slate-500" dateTime={step.timestamp}>
                                                {formatDate(step.timestamp)}
                                            </time>
                                        )}
                                    </div>
                                    {isCurrent && <p className="mt-0.5 text-xs font-medium text-slate-500">Current stage</p>}
                                </div>
                            </li>
                        );
                    })}
                </ol>
            ) : (
                <div
                    className={`relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-0.5 before:bg-slate-100 ${dark('dark:before:bg-slate-800')}`}
                >
                    {steps.map((step, idx) => {
                        const isCompleted = step.timestamp != null || idx <= currentIndex;
                        const isCurrent = step.key === incident.status;
                        const Icon = step.icon;

                        let circleBg = `bg-slate-100 border-slate-200 text-slate-400 ${dark('dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500')}`;
                        if (isCurrent) {
                            circleBg = `bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20 ring-4 ring-indigo-50 ${dark('dark:ring-indigo-950/50')}`;
                        } else if (isCompleted) {
                            circleBg = 'bg-emerald-500 border-emerald-500 text-white';
                        }

                        return (
                            <div key={step.key} className="relative flex items-start gap-3.5">
                                <div
                                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-all ${circleBg}`}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>

                                <div className="min-w-0 flex-1 pt-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p
                                            className={`truncate text-sm font-bold ${
                                                isCurrent
                                                    ? `text-indigo-600 ${dark('dark:text-indigo-400')}`
                                                    : isCompleted
                                                      ? `text-slate-900 ${dark('dark:text-slate-100')}`
                                                      : `text-slate-400 ${dark('dark:text-slate-500')}`
                                            }`}
                                        >
                                            {step.label}
                                        </p>
                                        {step.timestamp && (
                                            <span
                                                className={`text-[11px] font-semibold whitespace-nowrap text-slate-400 ${dark('dark:text-slate-500')}`}
                                            >
                                                {formatDate(step.timestamp)}
                                            </span>
                                        )}
                                    </div>

                                    {isCurrent && (
                                        <p className={`mt-0.5 text-xs font-medium text-slate-500 ${dark('dark:text-slate-400')}`}>Current stage</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {(incident.solved_at || incident.closed_at) && (
                <div
                    className={
                        isSecurity
                            ? 'mt-4 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3'
                            : `mt-6 rounded-xl border border-emerald-100 bg-emerald-50/80 p-3.5 ${dark('dark:border-emerald-900/40 dark:bg-emerald-950/30')}`
                    }
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 shrink-0 text-emerald-600 ${dark('dark:text-emerald-400')}`} />
                        <span className={`text-xs font-bold text-emerald-900 ${dark('dark:text-emerald-200')}`}>Resolution Recorded</span>
                    </div>
                    <p className={`mt-1 text-xs leading-relaxed text-emerald-700/90 ${dark('dark:text-emerald-400')}`}>
                        {incident.closed_at ? `Closed on ${formatDate(incident.closed_at)}` : `Marked resolved on ${formatDate(incident.solved_at)}`}
                    </p>
                </div>
            )}

            {activities.length > 0 && (
                <div className={`mt-6 border-t border-slate-100 pt-5 ${dark('dark:border-slate-800')}`}>
                    <h4 className={`mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase ${dark('dark:text-slate-400')}`}>
                        Recent Activity Log
                    </h4>
                    <div className="space-y-2.5">
                        {activities.slice(0, 5).map((act) => (
                            <div key={act.id} className="flex items-start justify-between gap-2 text-xs">
                                <span className={`font-medium text-slate-600 ${dark('dark:text-slate-300')}`}>
                                    {act.causer ? (
                                        <span className={`font-bold text-slate-900 ${dark('dark:text-slate-100')}`}>{act.causer.name} </span>
                                    ) : null}
                                    {act.description}
                                </span>
                                <span className="shrink-0 text-[10px] whitespace-nowrap text-slate-400">{act.created_at}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
