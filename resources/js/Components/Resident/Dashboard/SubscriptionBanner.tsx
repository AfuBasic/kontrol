import { usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Clock, Shield } from 'lucide-react';
import React from 'react';
import { useExternalBilling } from '@/Hooks/useExternalBilling';
import type { SharedData } from '@/types';
import type { ResidentSubscription } from '@/types/auth';

interface SubscriptionBannerProps {
    subscription: ResidentSubscription;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
    const { openExternalBilling } = useExternalBilling();

    if (!subscription) {
        return null;
    }

    const { status, trial_ends_at, current_period_end, is_active, is_grace_period, is_household_member } = subscription;

    // 1. ACCOUNT INACTIVE / EXPIRED / OVERDUE
    if (status === 'past_due') {
        if (is_grace_period) {
            return (
                <Banner
                    title="Overdue"
                    description="Grace period active"
                    cta={!is_household_member ? 'Open web' : undefined}
                    onCtaClick={openExternalBilling}
                    variant="grace"
                />
            );
        }

        if (!is_active) {
            return (
                <Banner
                    title="Account inactive"
                    description="Access limited"
                    cta={!is_household_member ? 'Open web' : undefined}
                    onCtaClick={openExternalBilling}
                    variant="inactive"
                />
            );
        }
    }

    // 2. TRIAL STATUS
    if (status === 'trial' && trial_ends_at) {
        const trialEnd = new Date(trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return (
            <Banner
                title="Trial period"
                description={daysLeft <= 0 ? 'Ends today' : `Ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                cta={!is_household_member ? 'Open web' : undefined}
                onCtaClick={openExternalBilling}
                variant={daysLeft <= 3 ? 'grace' : 'active'}
            />
        );
    }

    // 3. ACCOUNT STATUS INFO (Removed for regular active status as per user request)

    return null;
}

interface BannerProps {
    title: string;
    description: string;
    cta?: string;
    onCtaClick?: () => void;
    variant: 'inactive' | 'grace' | 'active';
}

function Banner({ title, description, cta, onCtaClick, variant }: BannerProps) {
    const backgroundColors = {
        inactive: 'rgba(255, 59, 48, 0.06)',
        grace: 'rgba(255, 149, 0, 0.06)',
        active: 'rgba(52, 199, 89, 0.06)',
    };

    const dotColors = {
        inactive: 'bg-[#FF3B30]',
        grace: 'bg-[#FF9500]',
        active: 'bg-[#34C759]',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ backgroundColor: backgroundColors[variant] }}
            className="mx-4 mb-6 flex h-[48px] items-center rounded-[12px] px-[14px] py-[10px]"
        >
            {/* Status Dot */}
            <div className={`mr-[10px] h-2 w-2 shrink-0 rounded-full ${dotColors[variant]}`} />

            {/* Text Block */}
            <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                <span className="shrink-0 text-[14px] font-medium tracking-tight text-[#1C1C1E]">{title}</span>
                <span className="shrink-0 text-[12px] text-[#6B7280]">·</span>
                <span className="truncate text-[12px] font-medium text-[#6B7280]">{description}</span>
            </div>

            {/* CTA */}
            {cta && (
                <button
                    onClick={onCtaClick}
                    className="ml-auto shrink-0 pl-4 text-[13px] font-medium text-[#6366F1] transition-opacity active:opacity-60"
                >
                    {cta} →
                </button>
            )}
        </motion.div>
    );
}
