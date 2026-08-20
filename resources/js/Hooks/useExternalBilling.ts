import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import type { SharedData } from '@/types';

export function useExternalBilling() {
    const { app_url: appUrl } = usePage<SharedData>().props;

    const openExternalBilling = async (couponCode?: string | React.MouseEvent | any) => {
        const isNative = Capacitor.isNativePlatform();
        const validCoupon = typeof couponCode === 'string' && couponCode !== '[object Object]' && couponCode.trim() !== '' ? couponCode.trim() : undefined;
        const queryParams = validCoupon ? { params: { coupon: validCoupon } } : {};

        // 1. Native Mobile Platform (iOS/Android)
        // Uses external browser + one-time magic URL to comply with App Store rules
        if (isNative) {
            let url = `${appUrl}/resident/billing${validCoupon ? `?coupon=${encodeURIComponent(validCoupon)}` : ''}`;
            try {
                const response = await axios.get(ResidentBillingController.generateMagicUrl.url(), queryParams);
                url = response.data.magic_url || url;
            } catch (e) {
                console.error('Failed to generate magic URL for native:', e);
            }

            try {
                await Browser.open({ url });
            } catch (e: any) {
                console.warn('Capacitor Browser plugin not implemented/unimplemented:', e);
                window.open(url, '_system');
            }
            return;
        }

        // 2. Web Platform
        // On web, user is already authenticated with an active session & estate context.
        // Navigate directly in-app using Inertia.
        const targetUrl = `/resident/billing${validCoupon ? `?coupon=${encodeURIComponent(validCoupon)}` : ''}`;
        router.visit(targetUrl);
    };

    return { openExternalBilling };
}
