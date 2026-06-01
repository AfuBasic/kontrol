import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Home, Users, User, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/Resident/NotificationController';
import PullToRefresh from '@/Components/PullToRefresh';
import CreateCodeBottomSheet from '@/Components/Resident/CreateCodeBottomSheet';
import SubscriptionBanner from '@/Components/Resident/Dashboard/SubscriptionBanner';
import NotificationDetailSheet from '@/Components/Resident/NotificationDetailSheet';
import type { Notification } from '@/Components/Resident/NotificationDetailSheet';
import SosButton from '@/Components/SosButton';
import { useFeature } from '@/Hooks/useFeature';
import { useForceLogout } from '@/Hooks/useForceLogout';
import type { SharedData } from '@/types';

const getPathFromUrl = (href: string): string => {
    if (href.startsWith('//')) {
        const pathStart = href.indexOf('/', 2);
        return pathStart !== -1 ? href.slice(pathStart) : '/';
    }
    if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
            return new URL(href).pathname;
        } catch {
            return href;
        }
    }
    return href;
};

interface Props {
    children: ReactNode;
    hideHeader?: boolean;
    hideNav?: boolean;
    className?: string;
}

export default function ResidentLayout({ children, hideHeader = false, hideNav = false, className }: Props) {
    const { component, url: currentPath, props } = usePage<SharedData & { webpush_public_key?: string }>();
    const { auth, webpush_public_key } = props;

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [unreadCount, setUnreadCount] = useState(auth?.user?.unread_notifications_count ?? 0);

    // Force logout if account is disabled
    useForceLogout(auth?.user?.id);

    // Redirect to download app if accessing on a non-native web browser
    useEffect(() => {
        const path = getPathFromUrl(currentPath);
        const isBillingRoute = path.startsWith('/resident/billing') || path.startsWith('/billing');

        const timer = setTimeout(() => {
            const isNative =
                Capacitor.isNativePlatform() ||
                (window as any).Capacitor?.platform === 'ios' ||
                (window as any).Capacitor?.platform === 'android' ||
                (window as any).webkit?.messageHandlers !== undefined;

            if (!isNative && !isBillingRoute) {
                router.visit('/download-app');
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [currentPath]);

    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) {
            setToastMessage(flash.success);
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success]);

    // Sync unread count with props
    useEffect(() => {
        setUnreadCount(auth?.user?.unread_notifications_count ?? 0);
    }, [auth?.user?.unread_notifications_count]);

    // Real-time notifications listener
    useEffect(() => {
        if (!auth?.user?.id || !window.Echo) return;

        const userChannel = window.Echo.private(`App.Models.User.${auth.user.id}`);

        userChannel.notification((notification: { id?: string; message?: string; [key: string]: unknown }) => {
            // Update unread count
            setUnreadCount((prev) => prev + 1);

            // Show toast
            setToastMessage(notification.message || 'New notification received');
            setShowToast(true);

            // Reload auth data to keep state in sync
            router.reload({ only: ['auth'] });
        });

        return () => {
            if (auth.user?.id) {
                window.Echo.leave(`App.Models.User.${auth.user.id}`);
            }
        };
    }, [auth?.user?.id]);

    const handleNotificationClick = (notification: { id?: string; read_at?: string; [key: string]: unknown }) => {
        setSelectedNotification(notification);

        // Mark as read in backend
        if (notification.id && !notification.read_at) {
            axios.post(NotificationController.markAsRead.url({ id: notification.id })).then(() => {
                setUnreadCount((prev) => Math.max(0, prev - 1));
                router.reload({ only: ['auth'] });
            });
        }
    };

    // Universal Push Notification Registration (Native FCM or Browser WebPush)
    useEffect(() => {
        if (!auth?.user) return;

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

        const syncFcmToken = async () => {
            const platform = Capacitor.getPlatform();
            try {
                if (platform === 'ios') {
                    // iOS: Request permissions via FirebaseMessaging
                    await FirebaseMessaging.requestPermissions();
                    const { token } = await FirebaseMessaging.getToken();

                    if (token) {
                        await axios.post('/push/subscribe', {
                            token,
                            platform: 'ios',
                        });
                    } else {
                        console.error('[iOS] Failed to get FCM token');
                    }
                } else if (platform === 'android') {
                    // Android: Get token from FirebaseMessaging
                    const { token } = await FirebaseMessaging.getToken();

                    if (token) {
                        await axios.post('/push/subscribe', {
                            token,
                            platform: 'android',
                        });
                    } else {
                        console.error('[Android] Failed to get FCM token');
                    }
                }
            } catch (error) {
                console.error(`[${platform.toUpperCase()}] FCM token sync failed:`, error);
            }
        };

        const setupPush = async () => {
            try {
                // PATH 1: Native Platform (Capacitor + Firebase)
                if (Capacitor.isNativePlatform()) {
                    const platform = Capacitor.getPlatform();

                    // Clear delivered notifications and app badge count on launch
                    try {
                        await PushNotifications.removeAllDeliveredNotifications();
                    } catch (e) {
                        console.warn('Failed to clear delivered notifications:', e);
                    }

                    // Check current permission status
                    let permStatus = await PushNotifications.checkPermissions();

                    // Request permissions if needed
                    if (permStatus.receive === 'prompt') {
                        permStatus = await PushNotifications.requestPermissions();
                    }

                    // Exit if permissions denied
                    if (permStatus.receive !== 'granted') {
                        console.warn(`[${platform.toUpperCase()}] Push notifications denied by user`);
                        return;
                    }

                    // Android-specific: Register and create channels
                    if (platform === 'android') {
                        await PushNotifications.register();

                        await PushNotifications.createChannel({
                            id: 'default',
                            name: 'Default',
                            description: 'Default notification channel',
                            importance: 5,
                            visibility: 1,
                            vibration: true,
                        });
                        await PushNotifications.createChannel({
                            id: 'kontrol_v1_alerts',
                            name: 'Kontrol Alerts',
                            description: 'Important security alerts',
                            importance: 5,
                            visibility: 1,
                            vibration: true,
                        });
                    }

                    // iOS: No need to call register(), just get the token
                    // iOS automatically registers with APNs once permissions are granted
                    await syncFcmToken();

                    // Listen for successful registration (Android)
                    PushNotifications.addListener('registration', async () => {
                        // Re-sync token on registration (Android)
                        if (platform === 'android') {
                            await syncFcmToken();
                        }
                    });

                    // Listen for registration errors
                    PushNotifications.addListener('registrationError', (error) => {
                        console.error(`[${platform.toUpperCase()}] Registration error:`, error.error);
                    });

                    // Listen for received notifications
                    PushNotifications.addListener('pushNotificationReceived', (notification) => {
                        setToastMessage(notification.body || notification.title || 'New notification received');
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 5000);

                        // Reload unread count
                        router.reload({ only: ['auth'] });
                    });

                    // Listen for notification actions (when user taps notification)
                    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                        const data = notification.notification.data;
                        const targetUrl = data?.action_url || data?.url;
                        const type = data?.type;

                        // Clear delivered notifications when tapping one
                        PushNotifications.removeAllDeliveredNotifications().catch(() => {});

                        // Only navigate if it's NOT a visitor arrival (which doesn't need "details")
                        // and if we aren't already on that page.
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

        setupPush();

        return () => {
            if (Capacitor.isNativePlatform()) {
                PushNotifications.removeAllListeners();
            }
        };
    }, [auth, webpush_public_key, currentPath]);

    // Listen for global notification detail requests
    useEffect(() => {
        const handleDetailRequest = (e: Event) => {
            const detail = (e as CustomEvent<{ id?: string; read_at?: string; [key: string]: unknown }>).detail;
            handleNotificationClick(detail);
        };
        window.addEventListener('show-notification-detail', handleDetailRequest);
        return () => window.removeEventListener('show-notification-detail', handleDetailRequest);
    }, [auth]);

    const hasAccessCodes = useFeature('access-code-generation');
    const hasVisitFeed = useFeature('real-time-visit-feed');

    const navItems = [
        {
            name: 'Dashboard',
            href: '/resident/home',
            icon: (active: boolean) => <Home className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />,
            show: true,
        },
        {
            name: 'Visitors',
            href: '/resident/visitors',
            icon: (active: boolean) => <Users className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />,
            show: hasAccessCodes,
        },
        { name: 'CREATE_CODE', href: '#', icon: () => null, show: hasAccessCodes },
        {
            name: 'Activity',
            href: '/resident/activity?tab=notifications',
            show: auth?.user?.resident_subscription?.plan_name !== 'Standard' && hasVisitFeed,
            icon: (active: boolean) => (
                <div className="relative">
                    <Bell className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-1 ring-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
            ),
        },
        {
            name: 'Profile',
            href: '/resident/profile',
            icon: (active: boolean) => <User className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />,
            show: true,
        },
    ].filter((item) => item.show !== false);

    return (
        <div className={`flex min-h-screen flex-col bg-slate-50 ${className || ''}`}>
            {/* Header - Conditional Light Premium Header */}
            {!hideHeader && (
                <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-100 bg-white pt-[env(safe-area-inset-top,0px)]">
                    <div className="mx-auto max-w-lg px-6">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-2">
                                <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                                <span className="text-xl font-black tracking-tight text-slate-900">Kontrol</span>
                            </div>
                            {/* <SosButton variant="header" /> */}
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main
                className={`relative mx-auto w-full max-w-lg flex-1 pb-8 ${!hideHeader ? 'pt-[calc(4.5rem+env(safe-area-inset-top,0px))]' : 'py-8'}`}
            >
                {auth?.user?.resident_subscription && component !== 'Resident/Billing/Index' && (
                    <div className="px-2">
                        <SubscriptionBanner subscription={auth.user.resident_subscription} />
                    </div>
                )}
                <PullToRefresh className="px-6">{children}</PullToRefresh>
            </main>

            {/* Bottom Navigation - Refined Glass Design */}
            {!hideNav && component !== 'Resident/Billing/Index' && (
                <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 px-6">
                    <motion.nav
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="pointer-events-auto mx-auto max-w-sm overflow-visible rounded-[32px] bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5 backdrop-blur-2xl"
                    >
                        <div className="flex items-center justify-between px-3 py-2">
                            {navItems.map((item) => {
                                if (item.name === 'CREATE_CODE') {
                                    return (
                                        <div key="fab" className="relative flex flex-1 justify-center">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => setCreateModalOpen(true)}
                                                className="absolute -top-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl ring-4 shadow-slate-900/20 ring-white"
                                            >
                                                <Plus className="h-7 w-7" strokeWidth={3} />
                                            </motion.button>
                                        </div>
                                    );
                                }

                                const currentPathname = currentPath.split('?')[0];
                                const itemPathname = getPathFromUrl(item.href).split('?')[0];
                                const isActive = currentPathname === itemPathname || currentPathname.startsWith(itemPathname + '/');

                                return (
                                    <Link key={item.name} href={item.href} className="group relative flex flex-1 flex-col items-center gap-1">
                                        <div
                                            className={`rounded-xl p-2.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                                        >
                                            {item.icon(isActive)}
                                        </div>
                                        {isActive && (
                                            <motion.div layoutId="navIndicator" className="absolute bottom-0 h-1 w-1 rounded-full bg-indigo-600" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </motion.nav>
                </div>
            )}

            {/* Modals and Sheets */}
            <CreateCodeBottomSheet isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
            <NotificationDetailSheet notification={selectedNotification} onClose={() => setSelectedNotification(null)} />

            {/* Toast Notification */}
            <AnimatePresence>
                {showToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 200, transition: { duration: 0.2 } }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.8}
                        onDragEnd={(_, info) => {
                            if (Math.abs(info.offset.x) > 100) {
                                setShowToast(false);
                            }
                        }}
                        className="fixed bottom-32 left-1/2 z-50 w-full max-w-xs -translate-x-1/2 px-4"
                    >
                        <motion.div
                            onClick={() => setShowToast(false)}
                            whileTap={{ scale: 0.95 }}
                            className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-100 backdrop-blur-xl transition-all"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm leading-tight font-bold">{toastMessage}</p>
                                <p className="mt-0.5 text-[10px] font-medium text-slate-400">Tap to dismiss · Swipe to hide</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
