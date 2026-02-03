import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
    }
}

const DISMISSED_KEY = 'pwa-install-dismissed';
const DISMISSED_DURATION = 24 * 60 * 60 * 1000; // 1 day

export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed the prompt recently
        const dismissedAt = localStorage.getItem(DISMISSED_KEY);
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            if (Date.now() - dismissedTime < DISMISSED_DURATION) {
                setIsDismissed(true);
                return;
            }
            localStorage.removeItem(DISMISSED_KEY);
        }

        // Listen for the install prompt
        const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setInstallPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const promptInstall = useCallback(async () => {
        if (!installPrompt) return false;

        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;

        if (outcome === 'accepted') {
            setInstallPrompt(null);
            return true;
        }

        return false;
    }, [installPrompt]);

    const dismissPrompt = useCallback(() => {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
        setIsDismissed(true);
        setInstallPrompt(null);
    }, []);

    const canPrompt = !isInstalled && !isDismissed && installPrompt !== null;

    return {
        canPrompt,
        isInstalled,
        promptInstall,
        dismissPrompt,
    };
}
