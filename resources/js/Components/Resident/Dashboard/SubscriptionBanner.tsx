import { motion } from 'framer-motion';
import React from 'react';
import { useExternalBilling } from '@/Hooks/useExternalBilling';
import type { ResidentSubscription } from '@/types/auth';

interface SubscriptionBannerProps {
    subscription: ResidentSubscription;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
    const { openExternalBilling } = useExternalBilling();

    if (!subscription || !subscription.can_manage_billing) {
        return null;
    }

    const { status, trial_ends_at, is_active, is_grace_period } = subscription;

    // 1. ACCOUNT INACTIVE / EXPIRED / OVERDUE
    if (status === 'past_due') {
        if (is_grace_period) {
            return (
                <Banner
                    title="Overdue"
                    description="Grace period active"
                    cta="Settle now"
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
                    cta="Settle now"
                    onCtaClick={openExternalBilling}
                    variant="inactive"
                />
            );
        }
    }

    // 2. TRIAL STATUS
    if (status === 'trial' && trial_ends_at) {
        const now = new Date();
        const trialEnd = new Date(trial_ends_at);

        // Reset hours for date-only comparison
        const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endDate = new Date(trialEnd.getFullYear(), trialEnd.getMonth(), trialEnd.getDate());

        const diffTime = endDate.getTime() - todayDate.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffTime < 0) {
            return (
                <Banner
                    title="Trial expired"
                    description="Access limited"
                    cta="Settle now"
                    onCtaClick={openExternalBilling}
                    variant="inactive"
                />
            );
        }

        if (diffTime === 0) {
            return (
                <Banner
                    title="Trial period"
                    description="Ends today"
                    cta="Settle now"
                    onCtaClick={openExternalBilling}
                    variant="grace"
                />
            );
        }

        // Less than or equal to 3 days: show 'Settle now'
        // More than 3 days: do not show CTA
        const showCta = daysLeft <= 3;

        return (
            <Banner
                title="Trial period"
                description={`Ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                cta={showCta ? 'Settle now' : undefined}
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
            className="mx-0 mb-6 flex min-h-[44px] items-center justify-between rounded-[12px] px-3 py-2 sm:h-[48px] sm:px-[14px] sm:py-[10px]"
        >
            <div className="flex min-w-0 flex-1 items-center">
                {/* Status Dot */}
                <div className={`mr-2 h-2 w-2 shrink-0 rounded-full sm:mr-[10px] ${dotColors[variant]}`} />

                {/* Text Block */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                    <span className="shrink-0 font-medium text-[13px] tracking-tight text-[#1C1C1E] sm:text-[14px]">{title}</span>
                    <span className="shrink-0 text-[11px] text-[#6B7280] sm:text-[12px]">·</span>
                    <span className="truncate font-medium text-[11px] text-[#6B7280] sm:text-[12px]">{description}</span>
                </div>
            </div>

            {/* CTA */}
            {cta && (
                <button
                    onClick={onCtaClick}
                    className="ml-2 shrink-0 pl-2 font-semibold text-[12px] text-[#6366F1] transition-opacity active:opacity-60 sm:ml-auto sm:pl-4 sm:font-medium sm:text-[13px]"
                >
                    {cta} →
                </button>
            )}
        </motion.div>
    );
}
