import React from 'react';
import {
    Activity,
    AlertTriangle,
    Building2,
    Car,
    Droplet,
    Globe,
    HelpCircle,
    Lightbulb,
    LucideIcon,
    ShieldAlert,
    Trash2,
    Volume2,
    Zap,
} from 'lucide-react';
import type { IncidentCategory } from '@/types/incidents';

interface CategoryConfig {
    label: string;
    icon: LucideIcon;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
}

export const CATEGORY_CONFIG: Record<IncidentCategory, CategoryConfig> = {
    electricity: {
        label: 'Electricity & Power',
        icon: Zap,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/40',
        badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    water_plumbing: {
        label: 'Water & Plumbing',
        icon: Droplet,
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-200 dark:border-sky-800/40',
        badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    },
    road_infrastructure: {
        label: 'Roads & Infrastructure',
        icon: Car,
        bg: 'bg-stone-500/10 dark:bg-stone-500/20',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-200 dark:border-stone-700/50',
        badgeBg: 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
    },
    security: {
        label: 'Security & Safety',
        icon: ShieldAlert,
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800/40',
        badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    },
    sanitation_waste: {
        label: 'Sanitation & Waste',
        icon: Trash2,
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/40',
        badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    noise_disturbance: {
        label: 'Noise & Disturbance',
        icon: Volume2,
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800/40',
        badgeBg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    },
    lighting: {
        label: 'Lighting & Streetlights',
        icon: Lightbulb,
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800/40',
        badgeBg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    },
    common_areas: {
        label: 'Common Areas & Amenities',
        icon: Building2,
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800/40',
        badgeBg: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    },
    internet_cable: {
        label: 'Internet & Telecom',
        icon: Globe,
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/40',
        badgeBg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    other: {
        label: 'General / Other',
        icon: HelpCircle,
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700/50',
        badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
    },
};

interface Props {
    category: IncidentCategory | string | { value: string; label?: string };
    size?: 'xs' | 'sm' | 'md';
    showIcon?: boolean;
    showBadge?: boolean;
    className?: string;
}

export function normalizeCategoryKey(cat: any): IncidentCategory {
    if (!cat) return 'other';
    const val = typeof cat === 'object' && cat.value ? cat.value : String(cat);
    const normalized = val.toLowerCase().replace(/[-\s]/g, '_');
    return (normalized in CATEGORY_CONFIG ? normalized : 'other') as IncidentCategory;
}

export default function IncidentCategoryLabel({
    category,
    size = 'sm',
    showIcon = true,
    showBadge = false,
    className = '',
}: Props) {
    const key = normalizeCategoryKey(category);
    const config = CATEGORY_CONFIG[key];
    const Icon = config.icon;

    const sizeClasses = {
        xs: 'text-[10px] gap-1',
        sm: 'text-xs gap-1.5',
        md: 'text-sm gap-2',
    }[size];

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
    }[size];

    if (showBadge) {
        return (
            <span
                className={`inline-flex items-center font-bold rounded-lg px-2 py-0.5 border ${config.badgeBg} ${config.border} ${sizeClasses} ${className}`}
            >
                {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
                <span>{config.label}</span>
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center font-bold ${config.text} ${sizeClasses} ${className}`}>
            {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
            <span>{config.label}</span>
        </span>
    );
}
