import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { usePage } from '@inertiajs/react';
import axios from 'axios';
import ResidentBillingController from '@/actions/App/Http/Controllers/Resident/BillingController';
import type { SharedData } from '@/types';

export function useExternalBilling() {
    const { app_url: appUrl } = usePage<SharedData>().props;

    const openExternalBilling = async () => {
        const isNative = Capacitor.isNativePlatform();

        // 1. Native Mobile Platform (iOS/Android)
        if (isNative) {
            let url = `${appUrl}/resident/billing`;
            try {
                const response = await axios.get(ResidentBillingController.generateMagicUrl.url());
                url = response.data.magic_url || url;
            } catch (e) {
                console.error('Failed to generate magic URL for native:', e);
            }

            try {
                // Browser.open handles opening outside the app correctly
                await Browser.open({ url });
            } catch (e: any) {
                // If Browser plugin is not implemented (native build missing), fallback to window.open
                console.warn('Capacitor Browser plugin not implemented/unimplemented:', e);
                // Use _system to attempt to force external browser in many native environments
                window.open(url, '_system');
            }
            return;
        }

        // 2. Web Platform
        const newWindow = window.open('about:blank', '_blank');
        if (newWindow) {
            newWindow.document.write(
                '<p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #64748b;">Opening secure billing portal...</p>',
            );
        }

        try {
            const response = await axios.get(ResidentBillingController.generateMagicUrl.url());
            const data = response.data;

            if (data.magic_url && newWindow) {
                newWindow.location.href = data.magic_url;
            } else if (newWindow) {
                newWindow.location.href = `${appUrl}/resident/billing`;
            }
        } catch (e) {
            console.error('Failed to generate magic URL for web:', e);
            if (newWindow) {
                newWindow.location.href = `${appUrl}/resident/billing`;
            }
        }
    };

    return { openExternalBilling };
}
