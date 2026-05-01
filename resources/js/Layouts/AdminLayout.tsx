import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import {
    ArrowLeftStartOnRectangleIcon,
    Bars3Icon,
    BellIcon,
    BuildingOffice2Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    UserCircleIcon,
    UserGroupIcon,
    UsersIcon,
    XMarkIcon,
    ClipboardDocumentListIcon,
    MegaphoneIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useState, lazy, Suspense } from 'react';

import ActivityLogController from '@/actions/App/Http/Controllers/Admin/ActivityLogController';
import BillingController from '@/actions/App/Http/Controllers/Admin/BillingController';
import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import NotificationController from '@/actions/App/Http/Controllers/Admin/NotificationController';
import ProfileController from '@/actions/App/Http/Controllers/Admin/ProfileController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import RoleController from '@/actions/App/Http/Controllers/Admin/RoleController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
import { useFeature } from '@/Hooks/useFeature';
import { useForceLogout } from '@/Hooks/useForceLogout';
import usePathFromUrl from '@/Hooks/usePathFromUrl';
import { useSidebarState } from '@/Hooks/useSidebarState';
import type { SharedData } from '@/types';

// Dynamic Imports
const PendingInvoiceNotification = lazy(() => import('@/Components/PendingInvoiceNotification'));
const Toast = lazy(() => import('@/Components/Toast'));
const SosAlertOverlay = lazy(() => import('@/Components/SosAlertOverlay'));
const MobileBottomNav = lazy(() => import('@/Components/Admin/MobileBottomNav'));
const PullToRefresh = lazy(() => import('@/Components/PullToRefresh'));

interface Props {
    children: ReactNode;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    role?: string;
    feature?: string;
    comingSoon?: boolean;
};

const baseNav: NavItem[] = [
    { name: 'Dashboard', href: DashboardController.url(), icon: Squares2X2Icon },
    { name: 'Announcement', href: EstateBoardController.index.url(), icon: MegaphoneIcon, feature: 'estate-board' },
    { name: 'Residents', href: ResidentController.index.url(), icon: UsersIcon, permission: 'residents.view', feature: 'resident-directory' },
    {
        name: 'Security',
        href: SecurityPersonnelController.index.url(),
        icon: ShieldCheckIcon,
        permission: 'security.view',
        feature: 'security-personnel-management',
    },
    { name: 'Roles', href: RoleController.index.url(), icon: UserGroupIcon, permission: 'roles.view', feature: 'user-access-control' },
    { name: 'Users', href: UserController.index.url(), icon: UserGroupIcon, permission: 'admins.view' },
];

const primaryNav: NavItem[] = baseNav;

const secondaryNav: NavItem[] = [{ name: 'Settings', href: SettingsController.index.url(), icon: Cog6ToothIcon, role: 'admin' }];

export default function AdminLayout({ children }: Props) {
    const page = usePage<
        SharedData & {
            flash: { success?: string; error?: string };
            billing_enabled?: boolean;
            has_overdue_invoice?: boolean;
            pendingInvoice?: any;
            webpush_public_key?: string;
        }
    >();
    const { auth, flash, billing_enabled, has_overdue_invoice, pendingInvoice, webpush_public_key } = page.props;
    const { url: fullUrl } = page;
    const url = fullUrl.split('?')[0];
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
    const [toastUrl, setToastUrl] = useState<string | null>(null);
    const [lastReceivedNotification, setLastReceivedNotification] = useState<any>(null);
    const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const { isCollapsed, toggle } = useSidebarState();
    useForceLogout(auth?.user?.id);

    // Local state for instant updates
    const [unreadCount, setUnreadCount] = useState(auth.user?.unread_notifications_count || 0);
    const [notifications, setNotifications] = useState(auth.user?.notifications || []);

    // Sync local state with props when page reloads/updates
    useEffect(() => {
        setUnreadCount(auth.user?.unread_notifications_count || 0);
        setNotifications(auth.user?.notifications || []);
    }, [auth.user?.unread_notifications_count, auth.user?.notifications]);

    // Close all open menus on navigation
    useEffect(() => {
        setNotificationOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
    }, [url]);

    useEffect(() => {
        if (flash?.success) {
            setToastMessage(flash.success);
            setToastType('success');
            setShowToast(true);
        } else if (flash?.error) {
            setToastMessage(flash.error);
            setToastType('error');
            setShowToast(true);
        }
    }, [flash]);

    // Real-time notifications - estate channel
    useEffect(() => {
        if (auth.user?.current_estate_id) {
            const channel = window.Echo.private(`estates.${auth.user.current_estate_id}`);

            channel.on('error', (error: unknown) => {
                console.error('Echo connection error:', error);
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            channel.listen('.resident.created', (e: any) => {
                setToastMessage(e.message);
                setToastType(e.type || 'info');
                setToastUrl(e.action_url || e.url || null);
                setShowToast(true);

                setUnreadCount((prev) => prev + 1);
                setNotifications((prev) => [
                    {
                        id: `temp-${Date.now()}`,
                        data: {
                            message: e.message,
                        },
                        created_at_human: 'Just now',
                    },
                    ...prev,
                ]);

                router.reload({ only: ['auth'] });
            });
        }

        return () => {
            if (auth.user?.current_estate_id) {
                window.Echo.leave(`estates.${auth.user.current_estate_id}`);
            }
        };
    }, [auth.user?.current_estate_id]);

    // Real-time notifications - user's private notification channel
    useEffect(() => {
        if (auth.user?.id) {
            const userChannel = window.Echo.private(`App.Models.User.${auth.user.id}`);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userChannel.notification((notification: any) => {
                setToastMessage(notification.message);
                setToastType(notification.type || 'info');
                setToastUrl(notification.action_url || notification.url || null);
                setLastReceivedNotification({
                    id: notification.id,
                    data: notification,
                    created_at_human: 'Just now',
                });
                setShowToast(true);

                setUnreadCount((prev) => prev + 1);
                setNotifications((prev) => [
                    {
                        id: notification.id || `temp-${Date.now()}`,
                        data: {
                            message: notification.message,
                        },
                        created_at_human: 'Just now',
                    },
                    ...prev,
                ]);

                router.reload({ only: ['auth'] });
            });
        }

        return () => {
            if (auth.user?.id) {
                window.Echo.leave(`App.Models.User.${auth.user.id}`);
            }
        };
    }, [auth.user?.id]);

    // Universal Push Notification Registration (Native FCM or Browser WebPush)
    useEffect(() => {
        if (!auth.user) {
            return;
        }

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
                        setToastMessage(notification.body || 'New notification received');
                        setToastType('info');
                        setLastReceivedNotification(notification);
                        setShowToast(true);
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

                    // Wait for service worker to be ready
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

                            // Send subscription object to backend
                            await axios.post('/push/subscribe', subscription.toJSON());
                            console.info('WebPush subscription synced successfully');
                        } catch (subErr) {
                            console.error('Failed to subscribe to WebPush:', subErr);
                        }
                    } else if (permission === 'denied') {
                        console.warn('WebPush permission denied');
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
    }, [auth.user?.id]);

    const userPermissions = auth.user?.permissions?.map((p) => p.name) ?? [];
    const userRoles = auth.user?.roles ?? [];
    const isAdmin = userRoles.includes('admin');

    async function handleLogout() {
        if (loggingOut) return;
        setLoggingOut(true);
        try {
            if (Capacitor.isNativePlatform()) {
                const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
                await FirebaseAuthentication.signOut().catch(() => {});
            }
            router.post('/logout');
        } catch (error) {
            console.error('Logout failed:', error);
            setLoggingOut(false);
            window.location.href = '/login';
        }
    }

    function isCurrentPath(href: string) {
        const path = usePathFromUrl(href);
        const dashboardPath = usePathFromUrl(DashboardController.url());
        if (path === dashboardPath) {
            return url === path || url === path + '/';
        }

        return url.startsWith(path);
    }

    function canAccess(item: NavItem): boolean {
        if (item.role && !userRoles.includes(item.role)) {
            return false;
        }

        // Feature Gating (Principal Engineer Pattern)
        if (item.feature && !useFeature(item.feature)) {
            return false;
        }

        if (!item.permission) return true;
        if (isAdmin) return true;
        return userPermissions.includes(item.permission);
    }

    function filterNav(items: NavItem[]): NavItem[] {
        return items.filter((item) => canAccess(item));
    }

    const navWithBilling = billing_enabled
        ? [...primaryNav, { name: 'Billing', href: BillingController.url(), icon: CreditCardIcon, feature: 'automated-invoicing' }]
        : primaryNav;

    const visiblePrimaryNav = filterNav(navWithBilling);
    const visibleSecondaryNav = filterNav(secondaryNav);

    const sidebarWidth = isCollapsed ? 72 : 240;

    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Mobile View Structure */}
            <div className="md:hidden">
                <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200/50 bg-white/80 ring-1 ring-black/5 backdrop-blur-xl">
                    <div className="h-[env(safe-area-inset-top)] w-full" />
                    <div className="flex h-16 items-center justify-between px-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-all active:scale-90 active:bg-slate-100"
                        >
                            <Bars3Icon className="h-6 w-6" />
                        </button>

                        <Link href={DashboardController.url()} className="flex items-center gap-2">
                            <img src="/assets/images/app-icon.png" alt="Kontrol" className="h-7 w-auto" />
                            <span className="text-xl font-black tracking-tighter text-[#0A3D91] uppercase">Kontrol</span>
                        </Link>

                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-[#0A3D91] shadow-sm ring-1 ring-slate-200">
                            <span className="text-sm font-bold">{auth.user?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                    </div>
                </header>

                <Suspense fallback={null}>
                    <PullToRefresh>
                        <main className="min-h-screen pt-[calc(4rem+env(safe-area-inset-top))] pb-28">
                            <div className="p-4">
                                <PendingInvoiceNotification invoice={pendingInvoice} />
                                {children}
                            </div>
                        </main>
                    </PullToRefresh>

                    <MobileBottomNav url={url} unreadNotifications={unreadCount} />
                </Suspense>
            </div>

            {/* Desktop View Structure */}
            <div className="hidden md:flex">
                <motion.aside
                    initial={false}
                    animate={{ width: sidebarWidth }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="fixed inset-y-0 left-0 z-40 flex flex-col bg-linear-to-b from-[#0A3D91] to-[#041E4A]"
                >
                    <div className="flex h-14 items-center border-b border-white/10 px-4">
                        <Link href={DashboardController.url()} className="shrink-0 overflow-hidden">
                            <AnimatePresence mode="wait" initial={false}>
                                {isCollapsed ? (
                                    <motion.img
                                        key="collapsed"
                                        src="/assets/images/kontrol-icon-white.png"
                                        alt="Kontrol"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-10 w-10"
                                    />
                                ) : (
                                    <motion.div
                                        key="expanded"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-28 overflow-hidden"
                                    >
                                        <img src="/assets/images/kontrol-white.png" alt="Kontrol" className="h-full w-auto object-contain" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Link>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-1">
                            {visiblePrimaryNav.map((item) =>
                                item.comingSoon ? (
                                    <div
                                        key={item.name}
                                        title={isCollapsed ? `${item.name} (Coming Soon)` : undefined}
                                        className="group relative flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-white/40"
                                    >
                                        <item.icon className="h-5 w-5 shrink-0 text-white/30" />
                                        {!isCollapsed && (
                                            <div className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap">
                                                <span>{item.name}</span>
                                                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
                                                    Soon
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        prefetch
                                        title={isCollapsed ? item.name : undefined}
                                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
                                            isCurrentPath(item.href)
                                                ? 'bg-white/20 text-white shadow-sm'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {isCurrentPath(item.href) && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white"
                                            />
                                        )}
                                        <item.icon
                                            className={`h-5 w-5 shrink-0 ${isCurrentPath(item.href) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                                        />
                                        {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">{item.name}</span>}
                                    </Link>
                                ),
                            )}
                        </div>

                        {visibleSecondaryNav.length > 0 && (
                            <>
                                <div className="my-4 border-t border-white/10" />
                                <div className="space-y-1">
                                    {visibleSecondaryNav.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            prefetch
                                            title={isCollapsed ? item.name : undefined}
                                            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
                                                isCurrentPath(item.href)
                                                    ? 'bg-white/20 text-white shadow-sm'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            <item.icon
                                                className={`h-5 w-5 shrink-0 ${isCurrentPath(item.href) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                                            />
                                            {!isCollapsed && <span className="overflow-hidden whitespace-nowrap">{item.name}</span>}
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </nav>

                    <div className="border-t border-white/10 p-3">
                        <button
                            onClick={toggle}
                            className="mb-2 flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            {isCollapsed ? (
                                <ChevronDoubleRightIcon className="h-5 w-5 shrink-0" />
                            ) : (
                                <ChevronDoubleLeftIcon className="h-5 w-5 shrink-0" />
                            )}
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F6FDB] ring-2 ring-white/30">
                                    <span className="text-xs font-semibold text-white">{auth.user?.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                {!isCollapsed && (
                                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                                        <p className="truncate text-left text-sm font-medium text-white">{auth.user?.name}</p>
                                        <ChevronDownIcon
                                            className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                )}
                            </button>
                            <AnimatePresence>
                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            className="absolute bottom-full left-0 z-20 mb-2 w-56 origin-bottom-left rounded-xl border border-[#1F6FDB]/20 bg-white p-1.5 shadow-xl"
                                        >
                                            <Link
                                                href={ProfileController.edit.url()}
                                                onClick={() => setUserMenuOpen(false)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#1F6FDB]"
                                            >
                                                <UserCircleIcon className="h-4 w-4 text-[#1F6FDB]" />
                                                Profile
                                            </Link>
                                            {isAdmin && useFeature('activity-logs') && (
                                                <Link
                                                    href={ActivityLogController.index.url()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#1F6FDB]"
                                                >
                                                    <ClipboardDocumentListIcon className="h-4 w-4 text-[#1F6FDB]" />
                                                    Activity Log
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => setShowLogoutConfirmation(true)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#1F6FDB]"
                                            >
                                                <ArrowLeftStartOnRectangleIcon className="h-4 w-4 text-[#1F6FDB]" />
                                                Sign out
                                            </button>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.aside>

                <motion.div
                    initial={false}
                    animate={{ marginLeft: sidebarWidth }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="min-h-screen flex-1 px-6 py-8 lg:px-8"
                >
                    <header className="mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[#1F6FDB]" />
                            <span className="text-sm font-medium tracking-wider text-slate-500 uppercase">Dashboard</span>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setNotificationOpen(!notificationOpen)}
                                className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all hover:text-[#1F6FDB] hover:shadow-md"
                            >
                                <BellIcon className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                                    </span>
                                )}
                            </button>
                            <AnimatePresence>
                                {notificationOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setNotificationOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute top-full right-0 z-20 mt-3 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                                <h3 className="font-bold text-slate-900">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600">
                                                        {unreadCount} New
                                                    </span>
                                                )}
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length > 0 ? (
                                                    notifications.map((n) => (
                                                        <div
                                                            key={n.id}
                                                            onClick={() => {
                                                                const targetUrl = (n.data?.action_url || n.data?.url) as string | undefined;
                                                                if (targetUrl) {
                                                                    router.visit(targetUrl);
                                                                    setNotificationOpen(false);
                                                                }
                                                            }}
                                                            className="cursor-pointer rounded-xl p-4 transition-colors hover:bg-slate-50"
                                                        >
                                                            <p className="text-sm font-medium text-slate-900">
                                                                {n.data?.message ? String(n.data.message) : 'New notification'}
                                                            </p>
                                                            <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">
                                                                {n.created_at_human}
                                                            </p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="py-12 text-center text-slate-400">
                                                        <BellIcon className="mx-auto mb-2 h-8 w-8 opacity-20" />
                                                        <p className="text-sm">No notifications yet</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2 pt-0">
                                                <button
                                                    onClick={() => {
                                                        router.post(NotificationController.markAllAsRead.url());
                                                        setUnreadCount(0);
                                                        setNotifications([]);
                                                        setNotificationOpen(false);
                                                        // Clear native notifications and badge
                                                        if (Capacitor.isNativePlatform()) {
                                                            PushNotifications.removeAllDeliveredNotifications();
                                                            if ('setAppBadge' in navigator) {
                                                                (navigator as any).setAppBadge(0).catch(() => {});
                                                            }
                                                        }
                                                    }}
                                                    className="w-full rounded-xl bg-blue-50 py-2.5 text-xs font-bold text-[#1F6FDB] transition-colors hover:bg-blue-100"
                                                >
                                                    Mark all as read
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </header>

                    <PendingInvoiceNotification invoice={pendingInvoice} />
                    {children}
                </motion.div>
            </div>

            {/* Mobile Navigation & Bottom Bar */}
            <MobileBottomNav url={url} unreadNotifications={unreadCount} />

            {/* Mobile Sidebar (Drawer-style for 'More' or complex navigation) */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm md:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="pt-safe fixed inset-y-0 left-0 z-70 flex w-72 flex-col bg-linear-to-b from-[#0A3D91] to-[#041E4A] md:hidden"
                        >
                            <div className="flex h-16 items-center justify-end px-4">
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/70 transition-all active:scale-90"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-1 overflow-y-auto p-4 pt-2">
                                {visiblePrimaryNav.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${isCurrentPath(item.href) ? 'bg-white/20 text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-bold">{item.name}</span>
                                    </Link>
                                ))}
                                <div className="my-4 h-px bg-white/10" />
                                {visibleSecondaryNav.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${isCurrentPath(item.href) ? 'bg-white/20 text-white shadow-lg' : 'text-white/60 hover:bg-white/10'}`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="font-bold">{item.name}</span>
                                    </Link>
                                ))}
                            </nav>
                            <div className="border-t border-white/10 bg-black/20 p-4">
                                <Link href={ProfileController.edit.url()} className="flex items-center gap-3 px-4 py-3 text-white/70">
                                    <UserCircleIcon className="h-5 w-5" /> Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        setMobileMenuOpen(false);
                                        setShowLogoutConfirmation(true);
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-white/70"
                                >
                                    <ArrowLeftStartOnRectangleIcon className="h-5 w-5" /> Sign Out
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Flash & Toast Messages */}
            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutConfirmation && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
                            onClick={() => setShowLogoutConfirmation(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/20 bg-white/80 p-8 shadow-2xl ring-1 ring-black/5 backdrop-blur-2xl"
                        >
                            <div className="mb-6 flex justify-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500 ring-4 ring-red-50/50">
                                    <ArrowLeftStartOnRectangleIcon className="h-8 w-8" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-center text-xl font-black tracking-tight text-slate-900">Sign Out</h3>
                            <p className="mb-8 text-center text-sm leading-relaxed text-slate-500">
                                Are you sure you want to end your session? You will need to sign back in to access your dashboard.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={handleLogout}
                                    disabled={loggingOut}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-500 font-bold text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600 active:scale-95 disabled:opacity-70"
                                >
                                    {loggingOut && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                                    {loggingOut ? 'Signing Out...' : 'Yes, Sign Out'}
                                </button>
                                <button
                                    onClick={() => !loggingOut && setShowLogoutConfirmation(false)}
                                    disabled={loggingOut}
                                    className="flex h-12 items-center justify-center rounded-2xl bg-slate-100 font-bold text-slate-600 transition-all hover:bg-slate-200 active:scale-95 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <Suspense fallback={null}>
                <Toast
                    show={showToast}
                    message={toastMessage}
                    type={toastType}
                    onClick={() => {
                        const data = lastReceivedNotification?.data;
                        const type = data?.type;
                        const targetUrl = toastUrl || data?.action_url || data?.url;

                        if (targetUrl && type !== 'visitor_arrived') {
                            router.visit(targetUrl);
                        }
                        setShowToast(false);
                    }}
                    onClose={() => {
                        setShowToast(false);
                        setToastUrl(null);
                    }}
                />

                {auth.user && userRoles.includes('security') && <SosAlertOverlay />}
            </Suspense>
        </div>
    );
}
