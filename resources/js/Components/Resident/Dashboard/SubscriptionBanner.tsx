import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, AlertCircle, Clock, Shield } from 'lucide-react';
import type { ResidentSubscription } from '@/types/auth';
import { usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

interface SubscriptionBannerProps {
    subscription: ResidentSubscription;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
    const { app_url: appUrl } = usePage<SharedData>().props;

    if (!subscription) return null;

    const { status, trial_ends_at, current_period_end } = subscription;

    // 1. ACCOUNT INACTIVE / EXPIRED (STATUS-DRIVEN)
    if (status === 'past_due' && current_period_end) {
        const periodEnd = new Date(current_period_end);
        const msLeft = periodEnd.getTime() - new Date().getTime();
        const isInactive = msLeft <= 0;

        if (isInactive) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-6 overflow-hidden rounded-[24px] bg-slate-900 p-5 text-white shadow-2xl shadow-slate-900/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-indigo-400 ring-1 ring-white/10">
                            <Shield size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <h4 className="text-base font-black tracking-tight">Account Inactive</h4>
                                <button
                                    onClick={() => window.open(`${appUrl}/resident/billing`, 'BillingHub', 'width=500,height=800,resizable=yes,scrollbars=yes')}
                                    className="rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-600/20 active:scale-95"
                                >
                                    Open Web Portal
                                </button>
                            </div>
                            <p className="mt-0.5 text-xs leading-relaxed font-medium text-slate-400">
                                Your access is currently limited. Manage your account status on the Kontrol web platform.
                            </p>
                        </div>
                    </div>
                </motion.div>
            );
        }

        let timeLeftText = '';
        const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            timeLeftText = `${days}d ${hours}h left`;
        } else if (hours > 0) {
            timeLeftText = `${hours}h ${minutes}m left`;
        } else {
            timeLeftText = `${minutes}m left`;
        }

        return (
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mb-6 overflow-hidden rounded-[24px] border border-amber-100 bg-amber-50 p-5 shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg shadow-amber-600/20">
                        <Clock size={24} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="text-base font-black tracking-tight text-amber-900">Grace Period</h4>
                            {timeLeftText && (
                                <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[8px] font-black tracking-widest text-white uppercase">
                                    {timeLeftText}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed font-bold text-amber-700/70">
                            Your grace period is currently active.
                            <br />
                            Update your preferences on the Kontrol web portal.
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    // 2. TRIAL STATUS
    if (status === 'trial' && trial_ends_at) {
        const trialEnd = new Date(trial_ends_at);
        const daysLeft = Math.ceil((trialEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-6 overflow-hidden rounded-[24px] border border-indigo-100 bg-indigo-50 p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            <Clock size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-indigo-900">Trial Period Ending</h4>
                            <p className="mt-0.5 text-xs leading-relaxed text-indigo-700/80">
                                Your trial ends in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. Manage your account on the Kontrol web platform.
                            </p>
                        </div>
                    </div>
                </motion.div>
            );
        }
    }

    // 3. ACCOUNT STATUS INFO
    if (status === 'active' && current_period_end) {
        const periodEnd = new Date(current_period_end);
        const daysLeft = Math.ceil((periodEnd.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 3) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-4 mb-6 overflow-hidden rounded-[24px] border border-amber-100 bg-amber-50 p-4"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                            <Shield size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-amber-900">Account Status Update</h4>
                            <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80">
                                Your current plan will be updated in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}. 
                                View details on the Kontrol web platform.
                            </p>
                        </div>
                    </div>
                </motion.div>
            );
        }
    }

    return null;
}
