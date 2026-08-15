import { AlertOctagon, AlertTriangle, CalendarDays, Circle, Globe, Megaphone, PartyPopper, Shield, Users, Wrench } from 'lucide-react';

import type { PostAudience, PostCategory, PostPriority } from '@/types';

export const CATEGORY_COLORS: Record<PostCategory, string> = {
    general: 'bg-slate-100 text-slate-700 ring-slate-200',
    meeting: 'bg-blue-100 text-blue-700 ring-blue-200',
    maintenance: 'bg-orange-100 text-orange-700 ring-orange-200',
    security: 'bg-rose-100 text-rose-700 ring-rose-200',
    event: 'bg-purple-100 text-purple-700 ring-purple-200',
};

export const PRIORITY_BADGES: Record<PostPriority, string> = {
    normal: 'bg-slate-100 text-slate-600',
    important: 'bg-amber-100 text-amber-700',
    critical: 'bg-rose-100 text-rose-700',
};

export const PRIORITY_BORDERS: Record<PostPriority, string> = {
    normal: 'ring-slate-100',
    important: 'ring-amber-200',
    critical: 'ring-rose-300 shadow-rose-100',
};

export const audienceOptions: { value: PostAudience; label: string; description: string; icon: typeof Globe }[] = [
    { value: 'all', label: 'Everyone', description: 'Residents and security', icon: Globe },
    { value: 'residents', label: 'Residents', description: 'Residents only', icon: Users },
    { value: 'security', label: 'Security', description: 'Security personnel', icon: Shield },
];

export const categoryOptions: { value: PostCategory; label: string; icon: typeof Megaphone }[] = [
    { value: 'general', label: 'General', icon: Megaphone },
    { value: 'meeting', label: 'Meeting', icon: CalendarDays },
    { value: 'maintenance', label: 'Maintenance', icon: Wrench },
    { value: 'security', label: 'Security', icon: Shield },
    { value: 'event', label: 'Event', icon: PartyPopper },
];

export const priorityOptions: { value: PostPriority; label: string; description: string; icon: typeof Circle }[] = [
    { value: 'normal', label: 'Normal', description: 'Standard update', icon: Circle },
    { value: 'important', label: 'Important', description: 'Needs attention', icon: AlertTriangle },
    { value: 'critical', label: 'Critical', description: 'Urgent notice', icon: AlertOctagon },
];

export function getAudienceLabel(audience: PostAudience): string {
    switch (audience) {
        case 'residents':
            return 'Residents';
        case 'security':
            return 'Security';
        default:
            return 'Everyone';
    }
}
