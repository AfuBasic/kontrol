import React from 'react';
import type {
    LucideIcon} from 'lucide-react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Flame,
    Lock
} from 'lucide-react';
import type { IncidentStatus } from '@/types/incidents';

interface IncidentStatusConfig {
    label: string;
    icon: LucideIcon;
    bg: string;
    text: string;
    border: string;
    dot: string;
}

export const STATUS_CONFIG: Record<IncidentStatus, IncidentStatusConfig> = {
    pending: {
        label: 'Reported',
        icon: AlertCircle,
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/60',
        dot: 'bg-amber-500',
    },
    acknowledged: {
        label: 'Acknowledged',
        icon: Clock,
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800/60',
        dot: 'bg-blue-500',
    },
    resolving: {
        label: 'In Progress',
        icon: Flame,
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/60',
        dot: 'bg-indigo-500',
    },
    solved: {
        label: 'Resolved',
        icon: CheckCircle2,
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/60',
        dot: 'bg-emerald-500',
    },
    closed: {
        label: 'Closed',
        icon: Lock,
        bg: 'bg-slate-100 dark:bg-slate-800/60',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400',
    },
};

interface Props {
    status: IncidentStatus | string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    showDot?: boolean;
    className?: string;
}

export default function IncidentStatusBadge({
    status,
    size = 'md',
    showIcon = true,
    showDot = false,
    className = '',
}: Props) {
    const key = (status as IncidentStatus) in STATUS_CONFIG ? (status as IncidentStatus) : 'pending';
    const config = STATUS_CONFIG[key];
    const Icon = config.icon;

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-[11px] gap-1 font-semibold',
        md: 'px-2.5 py-1 text-xs gap-1.5 font-bold',
        lg: 'px-3.5 py-1.5 text-sm gap-2 font-bold',
    }[size];

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-3.5 h-3.5',
        lg: 'w-4 h-4',
    }[size];

    return (
        <span
            className={`inline-flex items-center rounded-full border transition-colors ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
        >
            {showDot && <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />}
            {showIcon && !showDot && <Icon className={`${iconSizes} shrink-0`} />}
            <span>{config.label}</span>
        </span>
    );
}
