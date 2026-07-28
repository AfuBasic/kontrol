import { useState, useEffect } from 'react';
import { isInstalledPwa } from '@/Utils/platform';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [isChecking, setIsChecking] = useState<boolean>(true);

    useEffect(() => {
        setIsInstalled(isInstalledPwa());

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsChecking(false);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setDeferredPrompt(null);
            setIsChecking(false);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        // Give browser up to 1.8s to emit beforeinstallprompt if supported
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 1800);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
            clearTimeout(timer);
        };
    }, []);

    const promptInstall = async (): Promise<boolean> => {
        if (!deferredPrompt) {
            return false;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            setDeferredPrompt(null);
            return outcome === 'accepted';
        } catch (err) {
            console.warn('PWA prompt invocation error:', err);
            return false;
        }
    };

    return {
        canPrompt: !!deferredPrompt,
        isChecking,
        isInstalled,
        promptInstall,
    };
}
