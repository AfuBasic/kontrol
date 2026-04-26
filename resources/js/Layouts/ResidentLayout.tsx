import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Home, Users, LayoutGrid, User, Plus } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import type { SharedData } from '@/types';
import PullToRefresh from '@/Components/PullToRefresh';
import { useForceLogout } from '@/Hooks/useForceLogout';
import usePathFromUrl from '@/Hooks/usePathFromUrl';
import CreateCodeBottomSheet from '@/Components/Resident/CreateCodeBottomSheet';
import SubscriptionBanner from '@/Components/Resident/Dashboard/SubscriptionBanner';
import NotificationDetailSheet from '@/Components/Resident/NotificationDetailSheet';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import NotificationController from '@/actions/App/Http/Controllers/Resident/NotificationController';

interface Props {
    children: ReactNode;
    hideHeader?: boolean;
    hideNav?: boolean;
    className?: string;
}

export default function ResidentLayout({ children, hideHeader = false, hideNav = false, className }: Props) {
    const { auth, webpush_public_key } = usePage<SharedData & { webpush_public_key?: string }>().props;
    const currentPath = usePage().url;

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [selectedNotification, setSelectedNotification] = useState<any>(null);
    const [lastReceivedNotification, setLastReceivedNotification] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(auth?.user?.unread_notifications_count ?? 0);

    // Force logout if account is disabled
    useForceLogout(auth?.user?.id);

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

        userChannel.notification((notification: any) => {
            // Update unread count
            setUnreadCount((prev) => prev + 1);

            // Show toast
            setToastMessage(notification.message || 'New notification received');
            setLastReceivedNotification({
                id: notification.id,
                data: notification, // Echo sends the data directly
                created_at_human: 'Just now',
            });
            setShowToast(true);

            // Reload auth data to keep state in sync
            router.reload({ only: ['auth'] });
        });

        return () => {
            window.Echo.leave(`App.Models.User.${auth.user.id}`);
        };
    }, [auth?.user?.id]);

    const handleNotificationClick = (notification: any) => {
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

        const setupPush = async () => {
            try {
                // PATH 1: Native Platform (Capacitor FCM)
                if (Capacitor.isNativePlatform()) {
                    let permStatus = await PushNotifications.checkPermissions();

                    if (permStatus.receive === 'prompt') {
                        permStatus = await PushNotifications.requestPermissions();
                    }

                    if (permStatus.receive !== 'granted') {
                        console.warn('Push notification permission not granted (Native)');
                        return;
                    }

                    await PushNotifications.register();

                    // Registration listeners
                    PushNotifications.addListener('registration', (token) => {
                        axios
                            .post('/push/subscribe', {
                                token: token.value,
                                platform: Capacitor.getPlatform(),
                            })
                            .catch((err) => {
                                console.error('Failed to sync native push token:', err);
                            });
                    });

                    PushNotifications.addListener('registrationError', (error) => {
                        console.error('Native push registration error:', error);
                    });

                    PushNotifications.addListener('pushNotificationReceived', (notification) => {
                        console.info('Native push received in foreground:', notification);
                        router.reload({ only: ['auth'] });
                    });

                    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                        const data = notification.notification.data;
                        const targetUrl = data?.action_url || data?.url;
                        if (targetUrl) {
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
                            console.info('WebPush subscription synced successfully');
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
    }, [auth?.user?.id, webpush_public_key]);

    // Listen for global notification detail requests
    useEffect(() => {
        const handleDetailRequest = (e: any) => {
            handleNotificationClick(e.detail);
        };
        window.addEventListener('show-notification-detail', handleDetailRequest);
        return () => window.removeEventListener('show-notification-detail', handleDetailRequest);
    }, []);

    const navItems = [
        { name: 'Dashboard', href: '/resident/home', icon: (active: boolean) => <Home className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
        { name: 'Visitors', href: '/resident/visitors', icon: (active: boolean) => <Users className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
        { name: 'CREATE_CODE', href: '#', icon: () => null },
        {
            name: 'Feed',
            href: '/resident/activity',
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
        { name: 'Profile', href: '/resident/profile', icon: (active: boolean) => <User className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
    ];

    return (
        <PullToRefresh>
            <div className={`flex min-h-screen flex-col bg-slate-50 ${className || ''}`}>
                {/* Header - Conditional Light Premium Header */}
                {!hideHeader && (
                    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
                        <div className="mx-auto max-w-lg px-6">
                            <div className="flex h-16 items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                                    <span className="text-xl font-black tracking-tight text-slate-900">Kontrol</span>
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* Main Content */}
                <main className="relative mx-auto w-full max-w-lg flex-1 py-8">
                    {auth?.user?.resident_subscription && (
                        <div className="px-2">
                            <SubscriptionBanner subscription={auth.user.resident_subscription} />
                        </div>
                    )}
                    <div className="px-6">{children}</div>
                </main>

                {/* Bottom Navigation - Refined Glass Design */}
                {!hideNav && (
                    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 px-6">
                        <motion.nav
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto mx-auto max-w-sm overflow-visible rounded-[32px] bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.05] backdrop-blur-2xl"
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                {navItems.map((item, index) => {
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

                                    const isActive =
                                        currentPath === usePathFromUrl(item.href) || currentPath.startsWith(usePathFromUrl(item.href) + '/');

                                    return (
                                        <Link key={item.name} href={item.href} className="group relative flex flex-1 flex-col items-center gap-1">
                                            <div
                                                className={`rounded-xl p-2.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                                            >
                                                {item.icon(isActive)}
                                            </div>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="navIndicator"
                                                    className="absolute bottom-0 h-1 w-1 rounded-full bg-indigo-600"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.nav>
                    </div>
                )}

                {/* Code Creation Sheet */}
                <CreateCodeBottomSheet isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />

                {/* Notification Detail Sheet */}
                <NotificationDetailSheet notification={selectedNotification} onClose={() => setSelectedNotification(null)} />

                {/* Toast Notification */}
                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="fixed bottom-32 left-1/2 z-50 w-full max-w-xs -translate-x-1/2 px-4"
                            onClick={() => {
                                if (lastReceivedNotification) {
                                    handleNotificationClick(lastReceivedNotification);
                                    setShowToast(false);
                                }
                            }}
                        >
                            <div className="flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-100 backdrop-blur-xl transition-all active:scale-95">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold">{toastMessage}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PullToRefresh>
    );
}
