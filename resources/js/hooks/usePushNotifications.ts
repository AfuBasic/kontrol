import { useCallback, useEffect, useState } from 'react';

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface PushSubscriptionState {
    permission: PermissionState;
    isSubscribed: boolean;
    isLoading: boolean;
    error: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function getVapidPublicKey(): Promise<string> {
    const response = await fetch('/push/vapid-public-key');
    const data = await response.json();
    return data.publicKey;
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!('serviceWorker' in navigator)) {
        throw new Error('Service workers are not supported');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    return registration;
}

async function subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription> {
    const vapidPublicKey = await getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    return subscription;
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/push/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
        throw new Error('Failed to save subscription to server');
    }
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    const response = await fetch('/push/unsubscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
    }
}

export function usePushNotifications() {
    const [state, setState] = useState<PushSubscriptionState>({
        permission: 'default',
        isSubscribed: false,
        isLoading: true,
        error: null,
    });

    // Check initial state
    useEffect(() => {
        async function checkState() {
            // Check if push notifications are supported
            if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
                setState({
                    permission: 'unsupported',
                    isSubscribed: false,
                    isLoading: false,
                    error: null,
                });
                return;
            }

            // Get current permission
            const permission = Notification.permission as PermissionState;

            // Check if already subscribed
            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();

                setState({
                    permission,
                    isSubscribed: subscription !== null,
                    isLoading: false,
                    error: null,
                });
            } catch (error) {
                setState({
                    permission,
                    isSubscribed: false,
                    isLoading: false,
                    error: null,
                });
            }
        }

        checkState();
    }, []);

    const subscribe = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            // Request permission
            const permission = await Notification.requestPermission();

            if (permission !== 'granted') {
                setState((prev) => ({
                    ...prev,
                    permission: permission as PermissionState,
                    isLoading: false,
                    error: permission === 'denied' ? 'Notification permission denied' : null,
                }));
                return false;
            }

            // Register service worker and subscribe
            const registration = await registerServiceWorker();
            const subscription = await subscribeToPush(registration);

            // Save to server
            await saveSubscriptionToServer(subscription);

            setState({
                permission: 'granted',
                isSubscribed: true,
                isLoading: false,
                error: null,
            });

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            return false;
        }
    }, []);

    const unsubscribe = useCallback(async () => {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                // Remove from server first
                await removeSubscriptionFromServer(subscription);
                // Then unsubscribe locally
                await subscription.unsubscribe();
            }

            setState((prev) => ({
                ...prev,
                isSubscribed: false,
                isLoading: false,
                error: null,
            }));

            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe';
            setState((prev) => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
            return false;
        }
    }, []);

    return {
        ...state,
        subscribe,
        unsubscribe,
        isSupported: state.permission !== 'unsupported',
        canSubscribe: state.permission !== 'unsupported' && state.permission !== 'denied' && !state.isSubscribed,
    };
}
