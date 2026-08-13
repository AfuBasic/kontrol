import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import type { PermissionStatus } from '@capacitor/push-notifications';
import { Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Bell, User, History, ClipboardList } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

import * as EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import * as HistoryController from '@/actions/App/Http/Controllers/Security/HistoryController';
import HomeController from '@/actions/App/Http/Controllers/Security/HomeController';
import * as NotificationController from '@/actions/App/Http/Controllers/Security/NotificationController';
import * as ProfileController from '@/actions/App/Http/Controllers/Security/ProfileController';
import ContextSwitcher from '@/Components/ContextSwitcher';
import OfflineBanner from '@/Components/OfflineBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import PwaInstallModal from '@/Components/PwaInstallModal';
import SosAlertOverlay from '@/Components/SosAlertOverlay';
import SystemHealthMonitor from '@/Components/SystemHealthMonitor';
import { useOnlineStatus } from '@/Hooks/useOnlineStatus';
import '@/echo';

const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

interface Props {
    children: ReactNode;
    hideNav?: boolean;
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            current_estate_id?: number;
        };
    };
    estateName?: string;
    unreadCount?: number;
    flash?: {
        success?: string;
        error?: string;
    };
    is_local?: boolean;
    [key: string]: unknown;
}

const navItems = [
    {
        name: 'Home',
        href: HomeController.url(),
        icon: Home,
        matchPaths: ['/security'],
    },
    {
        name: 'Feed',
        href: EstateBoardController.index.url(),
        icon: Newspaper,
        matchPaths: ['/security/feed'],
    },
    {
        name: 'History',
        href: HistoryController.index.url(),
        icon: History,
        matchPaths: ['/security/history'],
    },
    {
        name: 'Alerts',
        href: NotificationController.index.url(),
        icon: Bell,
        matchPaths: ['/security/notifications'],
    },
    {
        name: 'Incidents',
        href: '/security/incidents',
        icon: ClipboardList,
        matchPaths: ['/security/incidents'],
    },
    {
        name: 'Profile',
        href: ProfileController.edit.url(),
        icon: User,
        matchPaths: ['/security/profile'],
    },
];

export default function SecurityLayout({ children, hideNav = false, variant = 'light' }: Props & { variant?: 'light' | 'dark' }) {
    const page = usePage<PageProps>();
    const { auth, estateName, unreadCount: initialUnreadCount = 0, flash, is_local } = page.props;
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const { isOnline } = useOnlineStatus();

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [lastReceivedNotification, setLastReceivedNotification] = useState<any>(null);

    // Sync unread count when props change
    useEffect(() => {
        setUnreadCount(initialUnreadCount);
    }, [initialUnreadCount]);

    // Listen for new posts on security channel
    useEffect(() => {
        const estateId = auth?.user?.current_estate_id;
        if (!estateId) return;

        const channel = window.Echo.private(`estates.${estateId}.security`);

        channel.listen('.post.created', (event: { post: unknown; message: string }) => {
            setToastMessage(event.message);
            setToastType('success');
            setShowToast(true);
            setUnreadCount((prev) => prev + 1);
            setTimeout(() => setShowToast(false), 4000);
        });

        return () => {
            channel.stopListening('.post.created');
            window.Echo.leave(`estates.${estateId}.security`);
        };
    }, [auth?.user?.current_estate_id]);

    useEffect(() => {
        if (flash?.success) {
            setToastMessage(flash.success);
            setToastType('success');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } else if (flash?.error) {
            setToastMessage(flash.error);
            setToastType('error');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    }, [flash]);

    // Push Notification Setup
    useEffect(() => {
        const setupPush = async () => {
            try {
                // PATH 1: Native Platform (Capacitor FCM)
                if (Capacitor.isNativePlatform()) {
                    // Clear delivered notifications and app badge count on launch
                    try {
                        await PushNotifications.removeAllDeliveredNotifications();
                    } catch (e) {
                        console.warn('Failed to clear delivered notifications:', e);
                    }

                    let permStatus = await PushNotifications.checkPermissions();

                    if (permStatus.receive === 'prompt') {
                        permStatus = await (
                            PushNotifications as unknown as {
                                requestPermissions: (options: Record<string, unknown>) => Promise<PermissionStatus>;
                            }
                        ).requestPermissions({
                            ios: { criticalAlert: true },
                        });
                    }

                    if (permStatus.receive !== 'granted') {
                        console.warn('Push notification permission not granted (Native)');
                        return;
                    }

                    await PushNotifications.register();

                    // Registration listeners
                    PushNotifications.addListener('registration', (token) => {
                        axios.post('/push/subscribe', {
                            token: token.value,
                            platform: Capacitor.getPlatform(),
                        });
                    });

                    PushNotifications.addListener('registrationError', (error) => {
                        console.error('Native push registration error:', error.error);
                    });

                    PushNotifications.addListener('pushNotificationReceived', (notification) => {
                        setLastReceivedNotification(notification);
                        setToastMessage(notification.body || 'New alert received');
                        setToastType('success');
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 5000);
                        router.reload({ only: ['auth', 'unreadCount'] });
                    });

                    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                        const data = notification.notification.data;
                        const targetUrl = data?.action_url || data?.url;
                        const type = data?.type;

                        // Clear delivered notifications when tapping one
                        PushNotifications.removeAllDeliveredNotifications().catch(() => {});

                        // Only navigate for critical alerts (like SOS) and if the path is different
                        if (targetUrl && type !== 'visitor_arrived' && targetUrl !== currentPath) {
                            router.visit(targetUrl);
                        }
                    });
                }
                // PATH 2: Web Platform (Browser WebPush)
                else if ('serviceWorker' in navigator && 'PushManager' in window) {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/',
                    });

                    await navigator.serviceWorker.ready;

                    let permission = Notification.permission;
                    if (permission === 'default') {
                        permission = await Notification.requestPermission();
                    }

                    const webpush_public_key = page.props.webpush_public_key as string;

                    if (permission === 'granted' && webpush_public_key) {
                        try {
                            const subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(webpush_public_key),
                            });

                            await axios.post('/push/subscribe', subscription.toJSON());
                        } catch (subErr) {
                            console.error('Failed to subscribe to WebPush:', subErr);
                        }
                    }
                }
            } catch (err) {
                console.error('Push notification setup failed:', err);
            }
        };

        if (auth?.user?.id) {
            setupPush();
        }

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [auth, page.props.webpush_public_key, currentPath]);

    const isActive = (item: (typeof navItems)[0]) => {
        // Check for exact match first
        if (item.matchPaths.some((path) => currentPath === path)) {
            return true;
        }

        // Find if the item has any starts-with matches
        const matchedPath = item.matchPaths.find((path) => currentPath.startsWith(path + '/'));
        if (!matchedPath) {
            return false;
        }

        // Check if another item has a longer (more specific) prefix match
        const otherItemsMatch = navItems
            .filter((other) => other !== item)
            .some((other) =>
                other.matchPaths.some((otherPath) => {
                    return (
                        otherPath.length > matchedPath.length &&
                        (currentPath === otherPath || currentPath.startsWith(otherPath + '/'))
                    );
                })
            );

        return !otherItemsMatch;
    };

    const isDark = variant === 'dark';

    return (
        <div className={`flex min-h-screen flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
            <OfflineBanner variant="security" />
            {/* Single Header with Safe Area integrated */}
            <motion.header
                id="kontrol-security-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`pt-safe sticky top-0 z-[60] border-b backdrop-blur-xl ${
                    isDark ? 'border-slate-800/80 bg-slate-950/95 text-white' : 'border-slate-100 bg-white/80 text-slate-900'
                }`}
            >
                <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                    <Link
                        href={HomeController.url()}
                        onClick={(e) => {
                            if (!isOnline && currentPath !== '/security') {
                                e.preventDefault();
                                setToastMessage('Network offline. Cannot change pages.');
                                setToastType('error');
                                setShowToast(true);
                                setTimeout(() => setShowToast(false), 4000);
                            }
                        }}
                        className="flex items-center gap-2.5"
                    >
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9 object-contain" />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</span>
                                {is_local && (
                                    <span className="py-0.2 rounded-sm bg-amber-500/15 px-1 text-[8px] font-black tracking-wider text-amber-500 uppercase">
                                        Local
                                    </span>
                                )}
                            </div>
                            {estateName && (
                                <span className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{estateName}</span>
                            )}
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block">
                            <ContextSwitcher variant={variant} />
                        </div>
                        <SystemHealthMonitor size="md" />
                        <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                                isDark
                                    ? 'bg-slate-800 text-slate-300 ring-1 ring-slate-700'
                                    : 'bg-linear-to-br from-primary-100 to-primary-200 text-primary-700'
                            }`}
                        >
                            {auth?.user?.name
                                ?.split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)
                                .toUpperCase() || '?'}
                        </div>
                    </div>
                </div>
            </motion.header>

            <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-24">
                <PullToRefresh>{children}</PullToRefresh>
            </main>

            {/* Bottom Navigation - slim, monochromatic, animated active indicator */}
            {!hideNav && (
                <motion.nav
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 }}
                    className="pb-safe fixed inset-x-0 bottom-0 z-40 bg-white/85 backdrop-blur-xl"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-slate-200/80" aria-hidden="true" />
                    <div className="mx-auto max-w-lg px-2">
                        <ul className="grid grid-cols-6 items-stretch">
                            {navItems.map((item) => {
                                const active = isActive(item);
                                const Icon = item.icon;
                                const hasUnread = item.name === 'Alerts' && unreadCount > 0;

                                return (
                                    <li key={item.name} className="relative">
                                        <Link
                                            href={item.href}
                                            onClick={(e) => {
                                                if (!isOnline && !active) {
                                                    e.preventDefault();
                                                    setToastMessage('Network offline. Cannot navigate tabs.');
                                                    setToastType('error');
                                                    setShowToast(true);
                                                    setTimeout(() => setShowToast(false), 4000);
                                                }
                                            }}
                                            aria-current={active ? 'page' : undefined}
                                            className="group relative flex h-full flex-col items-center justify-center gap-1 px-1 pt-2.5 pb-1.5 outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15"
                                        >
                                            {/* Animated top accent - morphs between active tabs */}
                                            {active && (
                                                <motion.span
                                                    layoutId="security-nav-indicator"
                                                    className="absolute inset-x-5 top-0 h-[2px] rounded-b-full bg-slate-900"
                                                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                                                />
                                            )}

                                            <span className="relative inline-flex h-7 w-7 items-center justify-center transition-transform duration-150 group-active:scale-90">
                                                <Icon
                                                    className={`h-[22px] w-[22px] transition-colors ${
                                                        active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                                                    }`}
                                                    strokeWidth={active ? 2.2 : 1.8}
                                                />
                                                {hasUnread && (
                                                    <span className="absolute top-0 right-0 flex h-2 w-2 items-center justify-center">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                                                        <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white/85" />
                                                    </span>
                                                )}
                                            </span>

                                            <span
                                                className={`text-[10.5px] leading-none tracking-[0.02em] transition-colors ${
                                                    active ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'
                                                }`}
                                            >
                                                {item.name}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </motion.nav>
            )}

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed right-4 bottom-28 left-4 z-50 mx-auto max-w-md cursor-pointer"
                        onClick={() => {
                            const data = lastReceivedNotification?.data;
                            const type = data?.type;
                            const targetUrl = data?.action_url || data?.url;

                            if (targetUrl && type !== 'visitor_arrived' && targetUrl !== currentPath) {
                                router.visit(targetUrl);
                            }
                            setShowToast(false);
                        }}
                    >
                        <div
                            className={`rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-lg transition-all active:scale-95 ${
                                toastType === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}
                        >
                            {toastMessage}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <SosAlertOverlay />
            <PwaInstallModal />
        </div>
    );
}
