import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    Building2,
    Car,
    Droplet,
    Globe,
    HelpCircle,
    Lightbulb,
    ShieldAlert,
    Tag,
    Trash2,
    Volume2,
    Zap,
} from 'lucide-react';
import type { IncidentCategory } from '@/types/incidents';

interface CategoryTheme {
    icon: LucideIcon;
    bg: string;
    text: string;
    border: string;
    badgeBg: string;
}

export const KNOWN_CATEGORY_THEMES: Record<string, CategoryTheme> = {
    electricity: {
        icon: Zap,
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-200 dark:border-amber-800/40',
        badgeBg: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    water_plumbing: {
        icon: Droplet,
        bg: 'bg-sky-500/10 dark:bg-sky-500/20',
        text: 'text-sky-700 dark:text-sky-400',
        border: 'border-sky-200 dark:border-sky-800/40',
        badgeBg: 'bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    },
    road_infrastructure: {
        icon: Car,
        bg: 'bg-stone-500/10 dark:bg-stone-500/20',
        text: 'text-stone-700 dark:text-stone-300',
        border: 'border-stone-200 dark:border-stone-700/50',
        badgeBg: 'bg-stone-50 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
    },
    security: {
        icon: ShieldAlert,
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-200 dark:border-rose-800/40',
        badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
    },
    sanitation_waste: {
        icon: Trash2,
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800/40',
        badgeBg: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    noise_disturbance: {
        icon: Volume2,
        bg: 'bg-purple-500/10 dark:bg-purple-500/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800/40',
        badgeBg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
    },
    lighting: {
        icon: Lightbulb,
        bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
        text: 'text-yellow-700 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800/40',
        badgeBg: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    },
    common_areas: {
        icon: Building2,
        bg: 'bg-teal-500/10 dark:bg-teal-500/20',
        text: 'text-teal-700 dark:text-teal-400',
        border: 'border-teal-200 dark:border-teal-800/40',
        badgeBg: 'bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
    },
    internet_cable: {
        icon: Globe,
        bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
        text: 'text-indigo-700 dark:text-indigo-400',
        border: 'border-indigo-200 dark:border-indigo-800/40',
        badgeBg: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
    },
    other: {
        icon: HelpCircle,
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700/50',
        badgeBg: 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
};

export const DEFAULT_THEME: CategoryTheme = {
    icon: Tag,
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800/40',
    badgeBg: 'bg-purple-50 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
};

export const CATEGORY_CONFIG: Record<string, CategoryTheme & { label: string }> = new Proxy(
    {},
    {
        get: (_target, prop: string) => {
            const { label, theme } = resolveCategoryDetails(prop);
            return { ...theme, label };
        },
    }
);

export function resolveCategoryDetails(category: any): { label: string; theme: CategoryTheme } {
    if (!category) {
        return { label: 'General / Other', theme: KNOWN_CATEGORY_THEMES.other };
    }

    const rawValue = typeof category === 'object' && category !== null
        ? (category.label || category.value || '')
        : String(category);

    const trimmed = String(rawValue).trim();
    if (!trimmed) {
        return { label: 'General / Other', theme: KNOWN_CATEGORY_THEMES.other };
    }

    const lower = trimmed.toLowerCase();
    const slug = lower.replace(/[-\s]/g, '_');

    // If matches a known theme directly
    if (KNOWN_CATEGORY_THEMES[slug]) {
        // Standardize default display label for standard enum values if passed as slug
        const isExactSlug = ['electricity', 'water_plumbing', 'road_infrastructure', 'security', 'sanitation_waste', 'noise_disturbance', 'lighting', 'common_areas', 'internet_cable', 'other'].includes(slug);
        const standardLabels: Record<string, string> = {
            electricity: 'Electricity & Power',
            water_plumbing: 'Water & Plumbing',
            road_infrastructure: 'Roads & Infrastructure',
            security: 'Security & Safety',
            sanitation_waste: 'Sanitation & Waste',
            noise_disturbance: 'Noise & Disturbance',
            lighting: 'Lighting & Streetlights',
            common_areas: 'Common Areas & Amenities',
            internet_cable: 'Internet & Telecom',
            other: 'General / Other',
        };

        const displayLabel = isExactSlug && standardLabels[slug] ? standardLabels[slug] : trimmed;
        return { label: displayLabel, theme: KNOWN_CATEGORY_THEMES[slug] };
    }

    // Keyword matching for dynamic estate-configured categories
    if (lower.includes('noise') || lower.includes('music') || lower.includes('sound') || lower.includes('loud')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.noise_disturbance };
    }
    if (lower.includes('theft') || lower.includes('security') || lower.includes('safety') || lower.includes('guard') || lower.includes('intruder') || lower.includes('unauthorized') || lower.includes('entry') || lower.includes('vandalism')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.security };
    }
    if (lower.includes('water') || lower.includes('plumb') || lower.includes('pipe') || lower.includes('drain') || lower.includes('sewage') || lower.includes('leak')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.water_plumbing };
    }
    if (lower.includes('power') || lower.includes('electr') || lower.includes('generator') || lower.includes('voltage') || lower.includes('blackout') || lower.includes('transformer')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.electricity };
    }
    if (lower.includes('road') || lower.includes('car') || lower.includes('pothole') || lower.includes('traffic') || lower.includes('parking') || lower.includes('gate') || lower.includes('barrier')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.road_infrastructure };
    }
    if (lower.includes('trash') || lower.includes('waste') || lower.includes('garbage') || lower.includes('sanitation') || lower.includes('clean')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.sanitation_waste };
    }
    if (lower.includes('light') || lower.includes('lamp') || lower.includes('bulb')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.lighting };
    }
    if (lower.includes('medical') || lower.includes('health') || lower.includes('emergency') || lower.includes('ambulance') || lower.includes('fire')) {
        return {
            label: trimmed,
            theme: {
                icon: AlertCircle,
                bg: 'bg-rose-500/10 dark:bg-rose-500/20',
                text: 'text-rose-700 dark:text-rose-400',
                border: 'border-rose-200 dark:border-rose-800/40',
                badgeBg: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
            },
        };
    }
    if (lower.includes('gym') || lower.includes('pool') || lower.includes('clubhouse') || lower.includes('amenit') || lower.includes('park') || lower.includes('garden')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.common_areas };
    }
    if (lower.includes('internet') || lower.includes('wifi') || lower.includes('cable') || lower.includes('telecom') || lower.includes('intercom')) {
        return { label: trimmed, theme: KNOWN_CATEGORY_THEMES.internet_cable };
    }

    if (lower === 'other') {
        return { label: 'General / Other', theme: KNOWN_CATEGORY_THEMES.other };
    }

    // Clean dynamic category fallback
    return { label: trimmed, theme: DEFAULT_THEME };
}

export function normalizeCategoryKey(cat: any): IncidentCategory {
    const { label } = resolveCategoryDetails(cat);
    return label as unknown as IncidentCategory;
}

interface Props {
    category: IncidentCategory | string | { value: string; label?: string };
    size?: 'xs' | 'sm' | 'md';
    showIcon?: boolean;
    showBadge?: boolean;
    className?: string;
}

export default function IncidentCategoryLabel({
    category,
    size = 'sm',
    showIcon = true,
    showBadge = false,
    className = '',
}: Props) {
    const { label, theme } = resolveCategoryDetails(category);
    const Icon = theme.icon;

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
                className={`inline-flex items-center font-bold rounded-lg px-2 py-0.5 border ${theme.badgeBg} ${theme.border} ${sizeClasses} ${className}`}
            >
                {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
                <span>{label}</span>
            </span>
        );
    }

    return (
        <span className={`inline-flex items-center font-bold ${theme.text} ${sizeClasses} ${className}`}>
            {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
            <span>{label}</span>
        </span>
    );
}
