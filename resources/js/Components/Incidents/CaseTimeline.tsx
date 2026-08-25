import React from 'react';
import {
    Activity as ActivityIcon,
    AlertCircle,
    CheckCircle2,
    Clock,
    Flame,
    History,
    Lock,
    User,
} from 'lucide-react';
import type { Incident } from '@/types/incidents';

export interface IncidentActivityItem {
    id: number;
    description: string;
    created_at: string;
    created_at_human?: string;
    causer?: {
        name: string;
    } | null;
}

interface Props {
    incident: Incident;
    activities?: IncidentActivityItem[];
    className?: string;
}

interface UnifiedTimelineEvent {
    id: string;
    timestamp: Date;
    dateFormatted: string;
    title: string;
    description?: string;
    actor?: string;
    icon: React.ElementType;
    isMilestone?: boolean;
    badge?: string;
    dotColor: string;
}

export default function CaseTimeline({ incident, activities = [], className = '' }: Props) {
    const formatDate = (isoString: string | null | undefined): string => {
        if (!isoString) return '';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return String(isoString);
        }
    };

    // Build unified chronological list of events (milestones + detailed activity actions)
    const events: UnifiedTimelineEvent[] = [];

    // Milestone: Created / Reported
    if (incident.created_at) {
        events.push({
            id: 'milestone-created',
            timestamp: new Date(incident.created_at),
            dateFormatted: formatDate(incident.created_at),
            title: 'Incident Reported',
            description: incident.reporter
                ? `Reported by ${incident.reporter.name} (${incident.reporter_role_label || 'Resident'})`
                : 'Incident reported into the system',
            actor: incident.reporter?.name,
            icon: AlertCircle,
            isMilestone: true,
            badge: 'Reported',
            dotColor: 'bg-amber-500 text-white border-amber-500',
        });
    }

    // Milestone: Acknowledged
    if (incident.acknowledged_at) {
        events.push({
            id: 'milestone-acknowledged',
            timestamp: new Date(incident.acknowledged_at),
            dateFormatted: formatDate(incident.acknowledged_at),
            title: 'Management Acknowledged',
            description: 'Case reviewed and acknowledged by estate management.',
            icon: Clock,
            isMilestone: true,
            badge: 'Acknowledged',
            dotColor: 'bg-blue-600 text-white border-blue-600',
        });
    }

    // Milestone: Resolving / In Progress
    if (incident.resolving_at) {
        events.push({
            id: 'milestone-resolving',
            timestamp: new Date(incident.resolving_at),
            dateFormatted: formatDate(incident.resolving_at),
            title: 'Resolution Commenced',
            description: 'Incident moved to active field resolution and investigation.',
            icon: Flame,
            isMilestone: true,
            badge: 'In Progress',
            dotColor: 'bg-indigo-600 text-white border-indigo-600',
        });
    }

    // Milestone: Solved / Resolved
    if (incident.solved_at) {
        events.push({
            id: 'milestone-solved',
            timestamp: new Date(incident.solved_at),
            dateFormatted: formatDate(incident.solved_at),
            title: 'Resolved by Management',
            description: 'Case marked as resolved and submitted for reporter confirmation.',
            icon: CheckCircle2,
            isMilestone: true,
            badge: 'Resolved',
            dotColor: 'bg-emerald-600 text-white border-emerald-600',
        });
    }

    // Milestone: Closed
    if (incident.closed_at) {
        events.push({
            id: 'milestone-closed',
            timestamp: new Date(incident.closed_at),
            dateFormatted: formatDate(incident.closed_at),
            title: 'Case Confirmed & Closed',
            description: 'Incident verified by reporter and formally closed.',
            icon: Lock,
            isMilestone: true,
            badge: 'Closed',
            dotColor: 'bg-slate-700 text-white border-slate-700',
        });
    }

    // Include Spatie Activity Events (filtered to avoid pure duplicate milestone labels)
    activities.forEach((act) => {
        const desc = act.description.toLowerCase();
        // Avoid duplicating generic milestone status logs if already represented
        const isDuplicateMilestone =
            desc.includes('created') ||
            (desc.includes('acknowledged') && incident.acknowledged_at) ||
            (desc.includes('resolving') && incident.resolving_at) ||
            (desc.includes('closed incident') && incident.closed_at);

        if (!isDuplicateMilestone) {
            let actDate: Date;
            try {
                actDate = new Date(act.created_at);
            } catch {
                actDate = new Date();
            }

            events.push({
                id: `activity-${act.id}`,
                timestamp: actDate,
                dateFormatted: formatDate(act.created_at) || act.created_at_human || '',
                title: act.description,
                actor: act.causer?.name,
                icon: ActivityIcon,
                isMilestone: false,
                dotColor: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600',
            });
        }
    });

    // Sort all events newest first
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <section
            className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}
        >
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                        Case Operational History
                    </h3>
                </div>
                {incident.reference_code && (
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                        {incident.reference_code}
                    </span>
                )}
            </div>

            {/* Timeline Items */}
            {events.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                    No history events recorded yet.
                </div>
            ) : (
                <div className="relative space-y-6 before:absolute before:left-[17px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200/80 dark:before:bg-slate-800">
                    {events.map((event) => {
                        const Icon = event.icon;

                        return (
                            <div key={event.id} className="relative flex items-start gap-3.5 sm:gap-4">
                                <div
                                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 shadow-2xs ${event.dotColor}`}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                </div>

                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-xs sm:text-sm font-bold ${
                                                    event.isMilestone
                                                        ? 'text-slate-900 dark:text-slate-100'
                                                        : 'text-slate-700 dark:text-slate-300'
                                                }`}
                                            >
                                                {event.title}
                                            </p>
                                            {event.badge && (
                                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                    {event.badge}
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                            {event.dateFormatted}
                                        </span>
                                    </div>

                                    {event.description && (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                            {event.description}
                                        </p>
                                    )}

                                    {event.actor && !event.description?.includes(event.actor) && (
                                        <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                                            <User className="h-3 w-3" />
                                            <span>Action by {event.actor}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
