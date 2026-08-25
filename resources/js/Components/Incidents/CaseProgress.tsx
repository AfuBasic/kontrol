import React from 'react';
import { AlertCircle, CheckCircle2, Clock, Flame, Lock } from 'lucide-react';
import type { Incident, IncidentStatus } from '@/types/incidents';

interface Props {
    incident: Incident;
    className?: string;
}

interface Step {
    key: IncidentStatus;
    label: string;
    icon: React.ElementType;
}

const STEPS: Step[] = [
    { key: 'pending', label: 'Reported', icon: AlertCircle },
    { key: 'acknowledged', label: 'Acknowledged', icon: Clock },
    { key: 'resolving', label: 'In Progress', icon: Flame },
    { key: 'solved', label: 'Resolved', icon: CheckCircle2 },
    { key: 'closed', label: 'Closed', icon: Lock },
];

export default function CaseProgress({ incident, className = '' }: Props) {
    const currentIdx = STEPS.findIndex((s) => s.key === incident.status);

    return (
        <section
            className={`rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
        >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 dark:text-slate-500">
                    Case Lifecycle Progress
                </span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    Step {currentIdx + 1} of {STEPS.length}
                </span>
            </div>

            {/* Step Pipeline */}
            <div className="grid grid-cols-5 gap-1 sm:gap-2">
                {STEPS.map((step, idx) => {
                    const isCompleted = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    const Icon = step.icon;

                    return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                            {/* Track bar / Indicator */}
                            <div className="w-full flex items-center gap-1 mb-2">
                                <div
                                    className={`h-1.5 w-full rounded-full transition-all ${
                                        isCurrent
                                            ? 'bg-indigo-600'
                                            : isCompleted
                                              ? 'bg-emerald-500'
                                              : 'bg-slate-100 dark:bg-slate-800'
                                    }`}
                                />
                            </div>

                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                                    isCurrent
                                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/20'
                                        : isCompleted
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                          : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                                }`}
                            >
                                <Icon className="h-4 w-4 shrink-0" />
                            </div>

                            <span
                                className={`mt-1.5 text-[10px] sm:text-xs font-bold truncate max-w-full ${
                                    isCurrent
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : isCompleted
                                          ? 'text-slate-900 dark:text-slate-200'
                                          : 'text-slate-400 dark:text-slate-500'
                                }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
