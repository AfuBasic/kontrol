import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Props {
    className?: string;
}

export default function PushNotificationToggle({ className = '' }: Props) {
    const { permission, isSubscribed, isLoading, error, subscribe, unsubscribe, isSupported, canSubscribe } = usePushNotifications();

    if (!isSupported) {
        return (
            <div className={`flex items-center justify-between rounded-xl border border-gray-200 p-4 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                        <BellOff className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Not supported on this device/browser</p>
                    </div>
                </div>
            </div>
        );
    }

    if (permission === 'denied') {
        return (
            <div className={`flex items-center justify-between rounded-xl border border-gray-200 p-4 ${className}`}>
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <BellOff className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Blocked - enable in browser settings</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-between rounded-xl border border-gray-200 p-4 ${className}`}>
            <div className="flex items-center gap-4">
                <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSubscribed ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-500'
                    }`}
                >
                    {isSubscribed ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                </div>
                <div>
                    <h3 className="font-medium text-gray-900">Push Notifications</h3>
                    <p className="text-sm text-gray-500">
                        {isSubscribed ? 'Get notified when visitors arrive' : 'Enable instant visitor arrival alerts'}
                    </p>
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>
            </div>
            <button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={isLoading}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all disabled:opacity-50 ${
                    isSubscribed
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
            >
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : isSubscribed ? (
                    'Disable'
                ) : (
                    'Enable'
                )}
            </button>
        </div>
    );
}
