import React from 'react';
import { CalendarDays, Megaphone, PartyPopper, Shield, Wrench } from 'lucide-react';
import type { PostCategory } from '@/types';

type Props = {
    category?: PostCategory | string;
    size?: 'sm' | 'md';
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; styles: string }> = {
    general: {
        label: 'General',
        icon: Megaphone,
        styles: 'bg-slate-100 text-slate-700 ring-slate-200/80',
    },
    meeting: {
        label: 'Meeting',
        icon: CalendarDays,
        styles: 'bg-blue-50 text-blue-700 ring-blue-200/80',
    },
    maintenance: {
        label: 'Maintenance',
        icon: Wrench,
        styles: 'bg-amber-50 text-amber-700 ring-amber-200/80',
    },
    security: {
        label: 'Security',
        icon: Shield,
        styles: 'bg-rose-50 text-rose-700 ring-rose-200/80',
    },
    event: {
        label: 'Event',
        icon: PartyPopper,
        styles: 'bg-purple-50 text-purple-700 ring-purple-200/80',
    },
};

export default function CategoryTag({ category = 'general', size = 'sm' }: Props) {
    const key = (category || 'general').toLowerCase();
    const config = CATEGORY_CONFIG[key] || CATEGORY_CONFIG.general;
    const Icon = config.icon;

    const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-[10px] gap-1' : 'px-3 py-1 text-xs gap-1.5';

    return (
        <span
            className={`inline-flex items-center rounded-full font-bold tracking-wider uppercase ring-1 ring-inset ${config.styles} ${sizeClasses}`}
        >
            <Icon className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} />
            <span>{config.label}</span>
        </span>
    );
}
