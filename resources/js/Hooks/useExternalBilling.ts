import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import * as ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import type { SharedData } from '@/types';

type ExternalBillingOptions = {
    coupon?: string;
    destination?: 'subscription' | 'index' | 'payment' | 'receipts';
};

export function useExternalBilling() {
    const { app_url: appUrl } = usePage<SharedData>().props;

    const openExternalBilling = async (optionsOrCoupon?: string | ExternalBillingOptions | React.MouseEvent | any) => {
        const isNative = Capacitor.isNativePlatform();

        let coupon: string | undefined;
        let destination: 'subscription' | 'index' | 'payment' | 'receipts' = 'subscription';

        if (typeof optionsOrCoupon === 'string' && optionsOrCoupon !== '[object Object]' && optionsOrCoupon.trim() !== '') {
            coupon = optionsOrCoupon.trim();
        } else if (optionsOrCoupon && typeof optionsOrCoupon === 'object' && !('nativeEvent' in optionsOrCoupon)) {
            if (optionsOrCoupon.coupon && typeof optionsOrCoupon.coupon === 'string') {
                coupon = optionsOrCoupon.coupon.trim();
            }
            if (optionsOrCoupon.destination) {
                destination = optionsOrCoupon.destination;
            }
        }

        const path = destination === 'index' ? '/resident/billing' : `/resident/billing/${destination}`;
        const params: Record<string, string> = { destination };
        if (coupon) {
            params.coupon = coupon;
        }

        const queryString = new URLSearchParams(params).toString();

        // 1. Native Mobile Platform (iOS/Android)
        // Uses external browser + one-time magic URL to comply with App Store rules
        if (isNative) {
            let url = `${appUrl}${path}${coupon ? `?coupon=${encodeURIComponent(coupon)}` : ''}`;
            try {
                const response = await axios.get(ResidentBillingController.generateMagicUrl.url(), { params });
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
        const targetUrl = `${path}${coupon ? `?coupon=${encodeURIComponent(coupon)}` : ''}`;
        router.visit(targetUrl);
    };

    return { openExternalBilling };
}
