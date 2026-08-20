import { Calendar, User, Truck, Wrench, Stethoscope, Heart, Briefcase, HelpCircle } from 'lucide-react';
import type { ElementType } from 'react';

export type VisitorCategory = 'guest' | 'family' | 'delivery' | 'maintenance' | 'medical' | 'event' | 'domestic' | 'other';

export type VisitorStatus = 'expected' | 'checked_in' | 'completed' | 'expired';

/**
 * Shared Status Configuration using Kontrol Theme Design Tokens
 */
export const STATUS_CONFIG: Record<VisitorStatus, { label: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }> = {
    expected: {
        label: 'Expected',
        bgClass: 'bg-primary-50',
        textClass: 'text-primary-700',
        borderClass: 'border-primary-200',
        dotClass: 'bg-primary-500',
    },
    checked_in: {
        label: 'Checked in',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-800',
        borderClass: 'border-amber-200',
        dotClass: 'bg-amber-500',
    },
    completed: {
        label: 'Completed',
        bgClass: 'bg-success-50',
        textClass: 'text-success-700',
        borderClass: 'border-success-100',
        dotClass: 'bg-success-500',
    },
    expired: {
        label: 'Expired',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-600',
        borderClass: 'border-gray-200',
        dotClass: 'bg-gray-400',
    },
};

/**
 * Category Icon & Theme Color Mapping
 */
export const CATEGORY_CONFIG: Record<VisitorCategory, { icon: ElementType; bgClass: string; textClass: string }> = {
    guest: { icon: User, bgClass: 'bg-primary-50', textClass: 'text-primary-600' },
    family: { icon: Heart, bgClass: 'bg-rose-50', textClass: 'text-rose-600' },
    delivery: { icon: Truck, bgClass: 'bg-amber-50', textClass: 'text-amber-600' },
    maintenance: { icon: Wrench, bgClass: 'bg-orange-50', textClass: 'text-orange-600' },
    medical: { icon: Stethoscope, bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' },
    event: { icon: Calendar, bgClass: 'bg-purple-50', textClass: 'text-purple-600' },
    domestic: { icon: Briefcase, bgClass: 'bg-blue-50', textClass: 'text-blue-600' },
    other: { icon: HelpCircle, bgClass: 'bg-gray-100', textClass: 'text-gray-600' },
};

/**
 * Derive normalized status from raw access code properties
 */
export function normalizeStatus(code: {
    status: string;
    used_at?: string | null;
    revoking_at?: string | null;
    expires_at?: string | null;
    access_logs_count?: number;
}): VisitorStatus {
    const rawStatus = code.status?.toLowerCase();
    const hasAccessLogs = (code.access_logs_count ?? 0) > 0 || !!code.used_at;

    if (rawStatus === 'used' || code.used_at) {
        return 'completed';
    }
    if (rawStatus === 'expired' || (code.expires_at && new Date(code.expires_at) < new Date())) {
        return 'expired';
    }
    if (rawStatus === 'revoked' || rawStatus === 'cancelled') {
        return 'expired';
    }
    if (hasAccessLogs) {
        return 'checked_in';
    }
    return 'expected';
}

/**
 * Helper to derive category from visitor purpose or code type
 */
export function deriveCategory(purpose?: string | null, type?: string | null): VisitorCategory {
    if (type === 'event') return 'event';
    if (!purpose) return 'guest';

    const p = purpose.toLowerCase();
    if (p.includes('family') || p.includes('parent') || p.includes('relative')) return 'family';
    if (p.includes('delivery') || p.includes('courier') || p.includes('food') || p.includes('rider') || p.includes('package')) return 'delivery';
    if (
        p.includes('maintenance') ||
        p.includes('electrician') ||
        p.includes('plumber') ||
        p.includes('ac') ||
        p.includes('repair') ||
        p.includes('technician')
    )
        return 'maintenance';
    if (p.includes('medical') || p.includes('doctor') || p.includes('health') || p.includes('checkup')) return 'medical';
    if (p.includes('domestic') || p.includes('cleaner') || p.includes('nanny') || p.includes('maid')) return 'domestic';

    return 'guest';
}

/**
 * Friendly relative date formatting utility
 * "Today", "Tomorrow", "Wed, Jul 26", or "Jul 26" for > 14 days out.
 */
export function formatRelativeDate(dateInput: string | Date | null | undefined): string {
    if (!dateInput) return '';

    let targetYear: number;
    let targetMonth: number;
    let targetDay: number;
    let weekdayStr = '';
    let monthStr = '';
    let dayNum = 0;

    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
        const [y, m, d] = dateInput.trim().split('-').map(Number);
        targetYear = y;
        targetMonth = m - 1;
        targetDay = d;
        const localDate = new Date(targetYear, targetMonth, targetDay);
        weekdayStr = localDate.toLocaleDateString('en-US', { weekday: 'short' });
        monthStr = localDate.toLocaleDateString('en-US', { month: 'short' });
        dayNum = targetDay;
    } else {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return String(dateInput);
        targetYear = date.getFullYear();
        targetMonth = date.getMonth();
        targetDay = date.getDate();
        weekdayStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        monthStr = date.toLocaleDateString('en-US', { month: 'short' });
        dayNum = targetDay;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(targetYear, targetMonth, targetDay);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';

    if (Math.abs(diffDays) <= 14) {
        return `${weekdayStr}, ${monthStr} ${dayNum}`;
    }

    return `${monthStr} ${dayNum}`;
}

/**
 * Robust visitor name resolution with smart fallbacks
 */
export function resolveVisitorName(visitorName?: string | null, type?: string | null, purpose?: string | null): string {
    if (visitorName && visitorName.trim()) {
        return visitorName.trim();
    }

    if (type === 'event') {
        return 'Event Guests';
    }

    if (purpose && purpose.trim()) {
        const p = purpose.trim();
        return p.charAt(0).toUpperCase() + p.slice(1);
    }

    if (type === 'long_lived') {
        return 'Regular Visitor';
    }

    return 'Guest Visitor';
}

