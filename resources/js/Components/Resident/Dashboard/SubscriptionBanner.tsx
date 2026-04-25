import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Clock } from 'lucide-react';
import type { ResidentSubscription } from '@/Types/auth';

interface SubscriptionBannerProps {
    subscription: ResidentSubscription;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
    if (!subscription) return null;

    const { status, trial_ends_at, current_period_end } = subscription;

    // 1. PAST DUE (CRITICAL)
    if (status === 'past_due') {
        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mb-6 overflow-hidden rounded-[24px] bg-red-50 p-4 border border-red-100"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <AlertCircle size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-red-900">Access Restricted</h4>
                        <p className="text-xs text-red-700/80 leading-relaxed mt-0.5">
                            Your access is currently limited. Visit the Kontrol web platform to restore full features.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // 2. TRIAL ENDING (WARNING)
    if (status === 'trial' && trial_ends_at) {
        const trialEnd = new Date(trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-6 overflow-hidden rounded-[24px] bg-indigo-50 p-4 border border-indigo-100"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <Clock size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-indigo-900">Trial Ending Soon</h4>
                            <p className="text-xs text-indigo-700/80 leading-relaxed mt-0.5">
                                Your free trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. Manage your access on the Kontrol web platform.
                            </p>
                        </div>
                    </div>
                </motion.div>
            );
        }
    }

    // 3. ACTIVE EXPIRING (INFO)
    if (status === 'active' && current_period_end) {
        const periodEnd = new Date(current_period_end);
        const daysLeft = Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-6 overflow-hidden rounded-[24px] bg-amber-50 p-4 border border-amber-100"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <CreditCard size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-amber-900">Subscription Expiring</h4>
                            <p className="text-xs text-amber-700/80 leading-relaxed mt-0.5">
                                Your access expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. Renew on the Kontrol web platform to avoid interruption.
                            </p>
                        </div>
                    </div>
                </motion.div>
            );
        }
    }

    return null;
}
