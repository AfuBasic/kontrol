import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Clock, Shield } from 'lucide-react';
import type { ResidentSubscription } from '@/types/auth';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';
import ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';

interface SubscriptionBannerProps {
    subscription: ResidentSubscription;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
    const { app_url: appUrl } = usePage<SharedData>().props;

    if (!subscription) {
        return null;
    }

    const { status, trial_ends_at, current_period_end } = subscription;

    const openWebPortal = async () => {
        try {
            const response = await fetch(ResidentBillingController.generateMagicUrl.url());
            const data = await response.json();
            if (data.magic_url) {
                // Use _blank to ensure it opens in the system browser and avoids window name collision issues
                window.open(data.magic_url, '_blank');
            } else {
                window.open(`${appUrl}/resident/billing`, '_blank');
            }
        } catch (e) {
            window.open(`${appUrl}/resident/billing`, '_blank');
        }
    };

    // 1. ACCOUNT INACTIVE / EXPIRED
    if (status === 'past_due' && current_period_end) {
        const periodEnd = new Date(current_period_end);
        const msLeft = periodEnd.getTime() - new Date().getTime();
        const isInactive = msLeft <= 0;

        if (isInactive) {
            return (
                <Banner
                    title="Account inactive"
                    description="Access limited"
                    cta="Open web"
                    onCtaClick={openWebPortal}
                    variant="inactive"
                />
            );
        }

        // GRACE PERIOD
        const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const timeLeftText = days > 0 ? `Ends in ${days}d` : `Ends in ${hours}h`;

        return (
            <Banner
                title="Grace period"
                description={timeLeftText}
                cta="Open web"
                onCtaClick={openWebPortal}
                variant="grace"
            />
        );
    }

    // 2. TRIAL STATUS
    if (status === 'trial' && trial_ends_at) {
        const trialEnd = new Date(trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        return (
            <Banner
                title="Trial period"
                description={daysLeft <= 0 ? 'Ends today' : `Ends in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
                cta="Open web"
                onCtaClick={openWebPortal}
                variant={daysLeft <= 3 ? 'grace' : 'active'}
            />
        );
    }

    // 3. ACCOUNT STATUS INFO
    if (status === 'active' && current_period_end) {
        const periodEnd = new Date(current_period_end);
        const daysLeft = Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3) {
            return (
                <Banner
                    title="Active"
                    description="All systems normal"
                    variant="active"
                />
            );
        }
    }

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
                <span className="shrink-0 text-[14px] font-medium tracking-tight text-[#1C1C1E]">
                    {title}
                </span>
                <span className="shrink-0 text-[12px] text-[#6B7280]">·</span>
                <span className="truncate text-[12px] font-medium text-[#6B7280]">
                    {description}
                </span>
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
