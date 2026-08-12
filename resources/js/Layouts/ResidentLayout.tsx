import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Link, usePage, router } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    Home,
    Users,
    User,
    Plus,
    Wallet,
    Megaphone,
    Building,
    ClipboardList,
    UserCheck,
    Menu,
    X,
    LogOut,
    AlertCircle,
    Phone,
    Ticket,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import NotificationController from '@/actions/App/Http/Controllers/Resident/NotificationController';
import MarketController from '@/actions/App/Http/Controllers/Market/MarketController';
import EmergencyController from '@/actions/App/Http/Controllers/Resident/EmergencyController';
import MessagesController from '@/actions/App/Http/Controllers/Resident/MessagesController';
import EstateInviteController from '@/actions/App/Http/Controllers/Resident/EstateInviteController';
import InvoiceController from '@/actions/App/Http/Controllers/Resident/InvoiceController';
import GatehouseController from '@/actions/App/Http/Controllers/Resident/GatehouseController';
import HelpDeskController from '@/actions/App/Http/Controllers/Resident/HelpDeskController';
import PollController from '@/actions/App/Http/Controllers/Resident/PollController';
import DirectoryController from '@/actions/App/Http/Controllers/Resident/DirectoryController';
import SettingsController from '@/actions/App/Http/Controllers/Resident/SettingsController';
import ContextController from '@/actions/App/Http/Controllers/Auth/ContextController';
import ConfirmationSheet from '@/Components/ConfirmationSheet';
import OfflineBanner from '@/Components/OfflineBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import ContextSwitcher from '@/Components/ContextSwitcher';
import SubscriptionBanner from '@/Components/Resident/Dashboard/SubscriptionBanner';
import NotificationDetailSheet from '@/Components/Resident/NotificationDetailSheet';
import type { Notification } from '@/Components/Resident/NotificationDetailSheet';
import PwaInstallModal from '@/Components/PwaInstallModal';
import SosButton from '@/Components/SosButton';
import SystemHealthMonitor from '@/Components/SystemHealthMonitor';
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

    // Force light theme in Resident area as it is designed as a light-themed dashboard
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('dark');
        html.classList.add('light');
        html.style.colorScheme = 'light';
    }, []);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
    const [unreadCount, setUnreadCount] = useState(auth?.user?.unread_notifications_count ?? 0);

    // Force logout if account is disabled
    useForceLogout(auth?.user?.id);

    const { flash } = usePage<SharedData>().props;

    useEffect(() => {
        if (flash?.success) {
            setToastMessage(flash.success);
            setToastType('success');
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 3000);
            return () => clearTimeout(timer);
        } else if (flash?.error) {
            setToastMessage(flash.error);
            setToastType('error');
            setShowToast(true);
            const timer = setTimeout(() => setShowToast(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [flash?.success, flash?.error]);

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

    const handleNotificationClick = (notification: Notification) => {
        setSelectedNotification(notification);

        // Mark as read in backend
        if (notification.id && !notification.read_at) {
            router.post(
                NotificationController.markAsRead.url({ id: notification.id }),
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                    onSuccess: () => {
                        setUnreadCount((prev) => Math.max(0, prev - 1));
                    },
                },
            );
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
            const detail = (e as CustomEvent<Notification>).detail;
            handleNotificationClick(detail);
        };
        window.addEventListener('show-notification-detail', handleDetailRequest);
        return () => window.removeEventListener('show-notification-detail', handleDetailRequest);
    }, [auth]);

    const hasAccessCodes = useFeature('access-code-generation');
    const isPropertyOwner = auth?.user?.roles?.includes('property_owner') ?? false;
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                await FirebaseAuthentication.signOut().catch(() => {});
            }
        } catch (error) {
            console.error('Logout failed (Firebase):', error);
        } finally {
            localStorage.removeItem('seen_resident_welcome');
            router.post('/logout');
        }
    };

    const hasHousehold = useFeature('household-management');
    const hasPaymentCollection = useFeature('payment-collection');
    const hasNoticeBoard = useFeature('interactive-notice-board');
    const isHouseholdMember = auth?.user?.roles?.includes('household_member') && !auth?.user?.roles?.includes('resident');

    const showDuesInNav = !isHouseholdMember && hasPaymentCollection;
    const showAnnouncementsInNav = !showDuesInNav && hasNoticeBoard;

    const residentMoreItems = [
        ...(hasHousehold && !isHouseholdMember ? [{ name: 'My Family', href: '/resident/household', icon: UserCheck }] : []),
        ...(!showDuesInNav && !isHouseholdMember && hasPaymentCollection ? [{ name: 'Dues', href: '/resident/dues', icon: Wallet }] : []),
        ...(!showAnnouncementsInNav && hasNoticeBoard ? [{ name: 'Announcements', href: '/resident/estate-board', icon: Megaphone }] : []),
        ...(!isHouseholdMember ? [{ name: 'Incidents', href: '/resident/incidents', icon: ClipboardList }] : []),
        ...(useFeature('estate-contacts') ? [{ name: 'Contacts & Hotline', href: '/resident/contacts', icon: Phone }] : []),
        ...(auth?.user?.has_active_coupons ? [{ name: 'Offers & Coupons', href: '/resident/coupons', icon: Ticket }] : []),
        { name: 'Profile', href: '/resident/profile', icon: User },
    ];

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
            name: 'Dues',
            href: '/resident/dues',
            show: showDuesInNav,
            icon: (active: boolean) => <Wallet className="h-6 w-6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />,
        },
        {
            name: 'Announcements',
            href: '/resident/estate-board',
            show: showAnnouncementsInNav,
            icon: (active: boolean) => <Megaphone className="h-6 w-6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />,
        },
        {
            name: 'More',
            href: '#more',
            icon: () => <Menu className="h-6 w-6" />,
            show: true,
        },
    ].filter((item) => item.show !== false);

    const poMobileNavItems = [
        {
            name: 'Home',
            href: '/resident/home',
            icon: (active: boolean) => <Home className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />,
        },
        {
            name: 'Visitor Passes',
            href: '/resident/visitors',
            icon: (active: boolean) => <Users className={`h-6 w-6 ${active ? 'fill-current' : ''}`} />,
        },
        { name: 'CREATE_CODE', href: '#', icon: () => null },
        {
            name: 'Collect Dues',
            href: '/resident/property-owner/collections',
            icon: (active: boolean) => <Wallet className="h-6 w-6" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />,
        },
        {
            name: 'More',
            href: '#more',
            icon: () => <Menu className="h-6 w-6" />,
        },
    ];

    const poSidebarItems = [
        { name: 'Home', href: '/resident/home', icon: Home },
        { name: 'My Tenants', href: '/resident/property-owner/residents', icon: Users },
        { name: 'My Properties', href: '/resident/property-owner/properties', icon: Building },
        { name: 'Collect Dues', href: '/resident/property-owner/collections', icon: Wallet },
        { name: 'My Tenant Announcements', href: '/resident/property-owner/announcements', icon: Megaphone },
        { name: 'Incidents', href: '/resident/incidents', icon: ClipboardList },
        { name: 'Visitor Passes', href: '/resident/visitors', icon: Users },
        { name: 'Pay Estate Dues', href: '/resident/dues', icon: Wallet },
        { name: 'Estate Announcements', href: '/resident/estate-board', icon: Megaphone },
        ...(useFeature('estate-contacts') ? [{ name: 'Contacts & Hotline', href: '/resident/contacts', icon: Phone }] : []),
        ...(auth?.user?.has_active_coupons ? [{ name: 'Offers & Coupons', href: '/resident/coupons', icon: Ticket }] : []),
        { name: 'My Family', href: '/resident/household', icon: UserCheck },
        { name: 'Profile', href: '/resident/profile', icon: User },
    ];

    return (
        <div className={`flex min-h-screen ${isPropertyOwner ? 'flex-col md:flex-row' : 'flex-col'} bg-slate-50 ${className || ''}`}>
            <div className="fixed top-0 right-0 left-0 z-[60]">
                <OfflineBanner />
            </div>
            {/* Mobile health chip — resident shell has no persistent header */}
            <div className="fixed top-[calc(env(safe-area-inset-top)+0.5rem)] right-3 z-[55] md:hidden">
                <SystemHealthMonitor hideWhenHealthy className="shadow-sm" />
            </div>
            {/* Desktop Property Owner Sidebar */}
            {isPropertyOwner && (
                <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-slate-100 bg-white p-6 md:flex">
                    <div className="flex flex-col gap-8">
                        <div className="flex items-center justify-between gap-2 px-2">
                            <div className="flex items-center gap-3">
                                <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                                <span className="text-xl font-black tracking-tight text-slate-900">Kontrol</span>
                                {props.is_local && (
                                    <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-600 uppercase">
                                        Local
                                    </span>
                                )}
                            </div>
                            <SystemHealthMonitor hideWhenHealthy />
                        </div>
                        <nav className="flex flex-col gap-1">
                            {poSidebarItems.map((item) => {
                                if (item.name === 'SOS') {
                                    return (
                                        <div key={item.name} className="mt-4 px-2 py-3">
                                            <SosButton variant="sidebar" />
                                        </div>
                                    );
                                }

                                const currentPathname = currentPath.split('?')[0];
                                const itemPathname = getPathFromUrl(item.href).split('?')[0];
                                const isActive = currentPathname === itemPathname || currentPathname.startsWith(itemPathname + '/');

                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                                            isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon className="h-5 w-5" />
                                            {item.name}
                                        </div>
                                        {item.name === 'Offers & Coupons' && (
                                            <span className="relative flex h-2 w-2 shrink-0">
                                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                                                <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex flex-col gap-1 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-3 px-2 py-2">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 font-bold text-indigo-600 ring-1 ring-indigo-100">
                                {auth.user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-black text-slate-900">{auth.user?.name}</p>
                                <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Property Owner</p>
                            </div>
                        </div>
                        <Link
                            href={ContextController.index.url()}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
                        >
                            Switch Workspace
                        </Link>
                        <button
                            onClick={() => {
                                const isIPadOrDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
                                if (isIPadOrDesktop) {
                                    if (window.confirm('Are you sure you want to sign out of your account?')) {
                                        handleLogout();
                                    }
                                } else {
                                    setShowLogoutConfirmation(true);
                                }
                            }}
                            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 transition-all hover:bg-rose-50/50"
                        >
                            Sign out
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <div className="flex min-h-screen flex-1 flex-col">
                {/* Header - Conditional Light Premium Header */}
                {!hideHeader && (!isPropertyOwner || Capacitor.isNativePlatform()) && (
                    <header className="fixed inset-x-0 top-0 z-[60] border-b border-slate-100 bg-white pt-[env(safe-area-inset-top,0px)]">
                        <div className="mx-auto max-w-lg px-6 sm:max-w-xl md:max-w-4xl lg:max-w-5xl">
                            <div className="flex h-16 items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                                    <span className="text-xl font-black tracking-tight text-slate-900">Kontrol</span>
                                    {props.is_local && (
                                        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-600 uppercase">
                                            Local
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <ContextSwitcher variant="light" />
                                    <Link
                                        href="/resident/activity?tab=notifications"
                                        className="relative rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-50 active:scale-95"
                                    >
                                        <Bell className="h-6 w-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-1 ring-white">
                                                {unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* Main Content */}
                <main
                    className={`relative mx-auto w-full flex-1 ${
                        hideHeader && hideNav
                            ? 'max-w-none p-0'
                            : `${!isPropertyOwner && !hideNav && component !== 'Resident/Billing/Index' ? 'pb-24' : 'pb-6'} ${
                                  isPropertyOwner ? 'max-w-4xl px-3 md:px-8' : 'max-w-lg sm:max-w-xl md:max-w-4xl lg:max-w-5xl'
                              } ${
                                  !hideHeader && (!isPropertyOwner || Capacitor.isNativePlatform())
                                      ? 'pt-[calc(3.75rem+env(safe-area-inset-top,0px))]'
                                      : 'py-4'
                              }`
                    }`}
                >
                    {auth?.user?.resident_subscription && component !== 'Resident/Billing/Index' && (
                        <div className="mb-3 px-3">
                            <SubscriptionBanner subscription={auth.user.resident_subscription} />
                        </div>
                    )}
                    <PullToRefresh className={hideHeader && hideNav ? '' : 'px-3 sm:px-4 md:px-10'}>{children}</PullToRefresh>
                </main>

                {/* Bottom Navigation for normal Residents */}
                {!isPropertyOwner && !hideNav && component !== 'Resident/Billing/Index' && (
                    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 px-6">
                        <motion.nav
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto mx-auto max-w-sm overflow-visible rounded-[32px] bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5 backdrop-blur-2xl sm:max-w-lg"
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                {navItems.map((item) => {
                                    if (item.name === 'CREATE_CODE') {
                                        return (
                                            <div key="fab" className="relative flex flex-1 justify-center">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => router.visit('/resident/visitors/create')}
                                                    className="absolute -top-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl ring-4 shadow-slate-900/20 ring-white"
                                                >
                                                    <Plus className="h-7 w-7" strokeWidth={3} />
                                                </motion.button>
                                            </div>
                                        );
                                    }

                                    if (item.name === 'More') {
                                        return (
                                            <button
                                                key={item.name}
                                                onClick={() => setMoreMenuOpen(true)}
                                                className="group hover:text-slate-650 relative flex flex-1 cursor-pointer flex-col items-center gap-1 text-slate-400"
                                            >
                                                <div className="relative rounded-xl p-2.5 transition-all">
                                                    {(item.icon as any)(false)}
                                                    {auth?.user?.has_active_coupons && (
                                                        <span className="absolute top-1 right-1 flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
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
                                                {(item.icon as any)(isActive)}
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

                {/* Bottom Navigation for Property Owners on Mobile */}
                {isPropertyOwner && !hideNav && component !== 'Resident/Billing/Index' && (
                    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 px-6 md:hidden">
                        <motion.nav
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto mx-auto max-w-sm overflow-visible rounded-[32px] bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/5 backdrop-blur-2xl sm:max-w-lg"
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                {poMobileNavItems.map((item) => {
                                    if (item.name === 'CREATE_CODE') {
                                        return (
                                            <div key="fab" className="relative flex flex-1 justify-center">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => router.visit('/resident/visitors/create')}
                                                    className="absolute -top-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl ring-4 shadow-slate-900/20 ring-white"
                                                >
                                                    <Plus className="h-7 w-7" strokeWidth={3} />
                                                </motion.button>
                                            </div>
                                        );
                                    }

                                    if (item.name === 'More') {
                                        return (
                                            <button
                                                key={item.name}
                                                onClick={() => setMoreMenuOpen(true)}
                                                className="group relative flex flex-1 flex-col items-center gap-1 text-slate-400 hover:text-slate-600"
                                            >
                                                <div className="relative rounded-xl p-2.5 transition-all">
                                                    {(item.icon as any)(false)}
                                                    {auth?.user?.has_active_coupons && (
                                                        <span className="absolute top-1 right-1 flex h-2 w-2">
                                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500"></span>
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
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
                                                {(item.icon as any)(isActive)}
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
            </div>

            {/* Mobile Property Owner & Resident 'More' Slide-up Menu Drawer */}
            <AnimatePresence>
                {moreMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMoreMenuOpen(false)}
                            className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-xs ${isPropertyOwner ? 'md:hidden' : ''}`}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className={`fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg rounded-t-[40px] border-t border-slate-100 bg-white p-6 pb-12 shadow-2xl ${isPropertyOwner ? 'md:hidden' : ''}`}
                        >
                            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-lg font-black text-slate-900">
                                    {isPropertyOwner ? (auth?.user?.name ? `Hello, ${auth.user.name.split(' ')[0]}` : 'Menu') : 'More Options'}
                                </h3>
                                <button
                                    onClick={() => setMoreMenuOpen(false)}
                                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {(isPropertyOwner ? poSidebarItems.filter((item) => item.name !== 'Collect Dues') : residentMoreItems).map((item) => {
                                    if (item.name === 'SOS') {
                                        return (
                                            <div key={item.name} className="flex flex-col items-center gap-1.5">
                                                <SosButton variant="mobile-menu" />
                                            </div>
                                        );
                                    }

                                    const currentPathname = currentPath.split('?')[0];
                                    const itemPathname = getPathFromUrl(item.href).split('?')[0];
                                    const isActive = currentPathname === itemPathname || currentPathname.startsWith(itemPathname + '/');

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMoreMenuOpen(false)}
                                            className="relative flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center transition-all hover:bg-slate-50"
                                        >
                                            <div
                                                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                                                    isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'
                                                }`}
                                            >
                                                <item.icon className="h-6 w-6" />
                                                {item.name === 'Offers & Coupons' && (
                                                    <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75"></span>
                                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-500"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] leading-tight font-bold text-slate-600">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                            <div className="mt-6 border-t border-slate-100 pt-4 space-y-3">
                                <Link
                                    href={ContextController.index.url()}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 transition-all hover:bg-slate-100/70"
                                >
                                    <Building className="h-5 w-5" />
                                    Switch Workspace
                                </Link>
                                <button
                                    onClick={() => {
                                        setMoreMenuOpen(false);
                                        const isIPadOrDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
                                        if (isIPadOrDesktop) {
                                            if (window.confirm('Are you sure you want to sign out of your account?')) {
                                                handleLogout();
                                            }
                                        } else {
                                            setShowLogoutConfirmation(true);
                                        }
                                    }}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition-all hover:bg-rose-100/70"
                                >
                                    <LogOut className="h-5 w-5" />
                                    Sign out
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Modals and Sheets */}
            <NotificationDetailSheet notification={selectedNotification} onClose={() => setSelectedNotification(null)} />
            <ConfirmationSheet
                isOpen={showLogoutConfirmation}
                onClose={() => !loggingOut && setShowLogoutConfirmation(false)}
                onConfirm={handleLogout}
                title="Sign Out"
                message="Are you sure you want to sign out of your account?"
                confirmLabel="Sign Out"
                type="danger"
                isLoading={loggingOut}
            />

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
                            <div
                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                    toastType === 'error'
                                        ? 'bg-rose-50 text-rose-600'
                                        : toastType === 'success'
                                          ? 'bg-emerald-50 text-emerald-600'
                                          : 'bg-blue-50 text-blue-600'
                                }`}
                            >
                                {toastType === 'error' ? <AlertCircle className="h-5.5 w-5.5" /> : <Bell className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm leading-tight font-bold">{toastMessage}</p>
                                <p className="mt-0.5 text-[10px] font-medium text-slate-400">Tap to dismiss · Swipe to hide</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <PwaInstallModal />
        </div>
    );
}
