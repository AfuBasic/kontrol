import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import {
    ArrowLeftStartOnRectangleIcon,
    Bars3Icon,
    BellIcon,
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
    BuildingOfficeIcon,
    ClipboardDocumentListIcon,
    CurrencyDollarIcon,
    MegaphoneIcon,
    BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    Search,
    LayoutDashboard,
    Building,
    Users,
    Home,
    ClipboardList,
    Wallet,
    Ticket,
    Mail,
    Settings,
    Menu,
    X,
    ArrowLeftRight,
} from 'lucide-react';
import * as ContextController from '@/actions/App/Http/Controllers/Auth/ContextController';
import { type ReactNode, useEffect, useState, lazy, Suspense } from 'react';

import * as ActivityLogController from '@/actions/App/Http/Controllers/Admin/ActivityLogController';
import * as AdministrativeAssignmentController from '@/actions/App/Http/Controllers/Admin/AdministrativeAssignmentController';
import BillingController from '@/actions/App/Http/Controllers/Admin/BillingController';
import * as CollectionController from '@/actions/App/Http/Controllers/Admin/CollectionController';
import * as TransactionController from '@/actions/App/Http/Controllers/Admin/TransactionController';
import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import * as EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import * as IncidentController from '@/actions/App/Http/Controllers/Admin/IncidentController';
import * as NotificationController from '@/actions/App/Http/Controllers/Admin/NotificationController';
import * as ProfileController from '@/actions/App/Http/Controllers/Admin/ProfileController';
import * as TrustedDeviceController from '@/actions/App/Http/Controllers/Account/TrustedDeviceController';
import * as PropertyOwnerController from '@/actions/App/Http/Controllers/Admin/PropertyOwnerController';
import * as ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import * as RoleController from '@/actions/App/Http/Controllers/Admin/RoleController';
import * as SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import * as SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import * as UserController from '@/actions/App/Http/Controllers/Admin/UserController';
import * as VisitorLogController from '@/actions/App/Http/Controllers/Admin/VisitorLogController';
import OfflineBanner from '@/Components/OfflineBanner';
import PullToRefresh from '@/Components/PullToRefresh';
import SystemHealthMonitor from '@/Components/SystemHealthMonitor';
import ContextSwitcher from '@/Components/ContextSwitcher';
import CommandPalette from '@/Components/Admin/CommandPalette';
import { baseNav, secondaryNav, type NavItem } from '@/Config/navigation';
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

interface Props {
    children: ReactNode;
    title?: string;
}

const primaryNav: NavItem[] = baseNav;

const NavGroup = ({ group, items, isCollapsed, isCurrentPath }: any) => {
    return (
        <div className="mb-6 space-y-1">
            {!isCollapsed && group !== 'Main' && (
                <div className="mt-4 mb-2 px-3 text-[10px] font-bold tracking-wider text-white/40 uppercase">{group}</div>
            )}

            <div className="space-y-1">
                {items.map((item: any) =>
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
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">Soon</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            key={item.name}
                            href={item.href}
                            prefetch="click"
                            title={isCollapsed ? item.name : undefined}
                            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
                                isCurrentPath(item.href) ? 'bg-white/20 text-white shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'
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
        </div>
    );
};

export default function AdminLayout({ children, title }: Props) {
    const page = usePage<
        SharedData & {
            flash: { success?: string; error?: string };
            billing_enabled?: boolean;
            has_overdue_invoice?: boolean;
            pendingInvoice?: any;
            webpush_public_key?: string;
        }
    >();
    const { auth, flash, billing_enabled, pendingInvoice, webpush_public_key, is_local } = page.props;
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
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const { isCollapsed, toggle } = useSidebarState();
    useForceLogout(auth?.user?.id);

    // Local state for instant updates
    const [unreadCount, setUnreadCount] = useState(auth.user?.unread_notifications_count || 0);
    const [notifications, setNotifications] = useState(auth.user?.notifications || []);

    const hasPaymentCollection = useFeature('payment-collection');
    const hasEstateBoard = useFeature('estate-board');
    const hasResidentDirectory = useFeature('resident-directory');
    const hasSecurityPersonnel = useFeature('security-personnel-management');
    const hasRoleManagement = useFeature('user-access-control');
    const hasActivityLogs = useFeature('activity-logs');
    const hasAutomatedInvoicing = useFeature('automated-invoicing');

    const featureFlags: Record<string, boolean> = {
        'payment-collection': hasPaymentCollection,
        'estate-board': hasEstateBoard,
        'resident-directory': hasResidentDirectory,
        'security-personnel-management': hasSecurityPersonnel,
        'user-access-control': hasRoleManagement,
        'activity-logs': hasActivityLogs,
        'automated-invoicing': hasAutomatedInvoicing,
    };

    // Sync local state with props when page reloads/updates
    useEffect(() => {
        setUnreadCount(auth.user?.unread_notifications_count || 0);
        setNotifications(auth.user?.notifications || []);
    }, [auth.user?.unread_notifications_count, auth.user?.notifications]);

    // Command Palette Keyboard Shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                // Don't trigger if user is actively typing in an input, textarea, or select
                const activeElement = document.activeElement as HTMLElement;
                const isInputFocused =
                    activeElement?.tagName === 'INPUT' ||
                    activeElement?.tagName === 'TEXTAREA' ||
                    activeElement?.tagName === 'SELECT' ||
                    activeElement?.isContentEditable;

                if (!isInputFocused) {
                    e.preventDefault();
                    setCommandPaletteOpen(true);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Force light mode for Admin panel
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }, []);

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

            channel.listen('.resident.created', (e: any) => {
                const message = typeof e.message === 'string' ? e.message : typeof e === 'string' ? e : JSON.stringify(e);

                // Prevent duplicate toast if it matches current flash message
                if (flash?.success === message) {
                    return;
                }

                setToastMessage(message);
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

            channel.listen('.incident.created', (e: any) => {
                const message = e.message || 'A new incident was reported.';
                setToastMessage(message);
                setToastType('info');
                setToastUrl(e.incident?.hashid ? `/admin/incidents/${e.incident.hashid}` : null);
                setShowToast(true);
                router.reload({ only: ['auth'] });
            });

            channel.listen('.collection.published', (e: any) => {
                const message = e.message || `Collection '${e.title}' published successfully.`;
                setToastMessage(message);
                setToastType('success');
                setToastUrl(e.collection_ulid ? `/admin/collections/${e.collection_ulid}` : null);
                setShowToast(true);
                router.reload();
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

            userChannel.notification((notification: any) => {
                const message = notification.message || (typeof notification === 'string' ? notification : JSON.stringify(notification));

                // Avoid showing notification if it's likely a duplicate of a recent broadcast
                if (flash?.success === message) {
                    return;
                }

                setToastMessage(message);
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
                    // Clear delivered notifications and app badge count on launch
                    try {
                        await PushNotifications.removeAllDeliveredNotifications();
                    } catch (e) {
                        console.warn('Failed to clear delivered notifications:', e);
                    }

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
                        console.error('Native push registration error:', error.error);
                    });

                    PushNotifications.addListener('pushNotificationReceived', (notification) => {
                        setToastMessage(notification.body || 'New notification received');
                        setToastType('info');
                        setLastReceivedNotification(notification);
                        setShowToast(true);
                        router.reload({ only: ['auth'] });
                    });

                    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                        const data = notification.notification.data;
                        const targetUrl = data?.action_url || data?.url;

                        // Clear delivered notifications when tapping one
                        PushNotifications.removeAllDeliveredNotifications().catch(() => {});

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
        if (item.feature && featureFlags[item.feature] === false) {
            return false;
        }

        if (!item.permission) return true;
        if (isAdmin) return true;
        return userPermissions.includes(item.permission);
    }

    function filterNav(items: NavItem[]): NavItem[] {
        return items.filter((item) => canAccess(item));
    }

    const navWithBilling = billing_enabled ? [...primaryNav, { name: 'Billing', href: BillingController.url(), icon: CreditCardIcon }] : primaryNav;

    const visiblePrimaryNav = filterNav(navWithBilling);
    const visibleSecondaryNav = filterNav(secondaryNav);

    const sidebarWidth = isCollapsed ? 72 : 240;

    return (
        <div className="min-h-screen bg-slate-50">
            <OfflineBanner />
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
                            {is_local && (
                                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-amber-600 uppercase">
                                    Local
                                </span>
                            )}
                        </Link>

                        <div className="flex items-center gap-2">
                            <SystemHealthMonitor hideWhenHealthy />
                            <button
                                onClick={() => setCommandPaletteOpen(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-all active:scale-90 active:bg-slate-100"
                            >
                                <span className="sr-only">Search Kontrol</span>
                                <Search className="h-5 w-5" />
                            </button>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-[#0A3D91] shadow-sm ring-1 ring-slate-200">
                                <span className="text-sm font-bold">{auth.user?.name?.charAt(0).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <Suspense fallback={null}>
                    <main className="min-h-screen pt-[calc(4rem+env(safe-area-inset-top))] pb-28">
                        <div className="p-4">
                            <PendingInvoiceNotification invoice={pendingInvoice} />
                            <PullToRefresh>{children}</PullToRefresh>
                        </div>
                    </main>

                    <CommandPalette
                        isOpen={commandPaletteOpen}
                        setIsOpen={setCommandPaletteOpen}
                        canAccess={canAccess}
                        billingEnabled={billing_enabled || false}
                    />

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
                                        className="flex h-28 items-center gap-2 overflow-hidden"
                                    >
                                        <img src="/assets/images/kontrol-white.png" alt="Kontrol" className="h-full w-auto object-contain" />
                                        {is_local && (
                                            <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase">
                                                Local
                                            </span>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </Link>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-3">
                        <div className="space-y-4">
                            {Object.entries(
                                visiblePrimaryNav.reduce(
                                    (acc, item) => {
                                        const group = item.group || 'Main';
                                        if (!acc[group]) acc[group] = [];
                                        acc[group].push(item);
                                        return acc;
                                    },
                                    {} as Record<string, NavItem[]>,
                                ),
                            ).map(([group, items]) => (
                                <NavGroup key={group} group={group} items={items} isCollapsed={isCollapsed} isCurrentPath={isCurrentPath} />
                            ))}
                        </div>

                        {visibleSecondaryNav.length > 0 && (
                            <>
                                <div className="my-4 border-t border-white/10" />
                                <div className="space-y-1">
                                    {visibleSecondaryNav.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            prefetch="click"
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
                            className="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                            {isCollapsed ? (
                                <ChevronDoubleRightIcon className="h-5 w-5 shrink-0" />
                            ) : (
                                <ChevronDoubleLeftIcon className="h-5 w-5 shrink-0" />
                            )}
                        </button>
                    </div>
                </motion.aside>

                <motion.div
                    initial={false}
                    animate={{ marginLeft: sidebarWidth }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="flex min-h-screen flex-1 flex-col"
                >
                    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 shadow-[0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-xl lg:px-8">
                        <div className="flex items-center gap-4">
                            <ContextSwitcher variant="light" />
                        </div>

                        <div className="hidden flex-1 justify-center px-4 md:flex md:px-8">
                            <button
                                onClick={() => setCommandPaletteOpen(true)}
                                className="group flex w-full max-w-md items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100"
                            >
                                <Search className="h-4 w-4 text-slate-400 group-hover:text-slate-500" />
                                <span className="flex-1 text-left">Search Kontrol...</span>
                                <kbd className="hidden rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-400 ring-1 ring-slate-200 ring-inset sm:block">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </button>
                        </div>

                        <div className="flex items-center gap-x-2 sm:gap-x-4 lg:gap-x-6">
                            <SystemHealthMonitor hideWhenHealthy />

                            {/* Mobile Search Trigger */}
                            <button
                                onClick={() => setCommandPaletteOpen(true)}
                                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:ring-2 focus:ring-[#0A3D91] focus:ring-offset-2 focus:outline-none md:hidden"
                            >
                                <span className="sr-only">Search Kontrol</span>
                                <Search className="h-5 w-5" />
                            </button>

                            {/* Notifications */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationOpen(!notificationOpen)}
                                    className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600 focus:ring-2 focus:ring-[#0A3D91] focus:ring-offset-2 focus:outline-none"
                                >
                                    <span className="sr-only">View notifications</span>
                                    <BellIcon className="h-5 w-5" />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
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
                                                    {Object.keys(notifications).length > 0 ? (
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

                            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200" aria-hidden="true" />

                            {/* User Profile */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-2 rounded-full p-1 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:ring-2 focus:ring-[#0A3D91] focus:ring-offset-2 focus:outline-none"
                                >
                                    <span className="sr-only">Open user menu</span>
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A3D91] text-xs font-semibold text-white ring-2 ring-white">
                                        {auth.user?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="hidden max-w-[120px] truncate lg:block">{auth.user?.name}</span>
                                    <ChevronDownIcon
                                        className={`hidden h-4 w-4 shrink-0 text-slate-400 transition-transform lg:block ${userMenuOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>
                                <AnimatePresence>
                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl border border-slate-200/60 bg-white p-1.5 shadow-xl"
                                            >
                                                <Link
                                                    href={ProfileController.edit.url()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#0A3D91]"
                                                >
                                                    <UserCircleIcon className="h-4 w-4 text-slate-400" />
                                                    Profile
                                                </Link>
                                                <Link
                                                    href={TrustedDeviceController.index.url()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#0A3D91]"
                                                >
                                                    <ShieldCheckIcon className="h-4 w-4 text-slate-400" />
                                                    Trusted devices
                                                </Link>
                                                {isAdmin && hasActivityLogs && (
                                                    <Link
                                                        href={ActivityLogController.index.url()}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#0A3D91]"
                                                    >
                                                        <ClipboardDocumentListIcon className="h-4 w-4 text-slate-400" />
                                                        Activity Log
                                                    </Link>
                                                )}

                                                {(auth.user?.available_contexts?.length || 0) > 1 && (
                                                    <Link
                                                        href={ContextController.index.url()}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-[#F0F5FF] hover:text-[#0A3D91]"
                                                    >
                                                        <BuildingOfficeIcon className="h-4 w-4 text-slate-400" />
                                                        Switch Workspace
                                                    </Link>
                                                )}

                                                <button
                                                    onClick={() => setShowLogoutConfirmation(true)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <ArrowLeftStartOnRectangleIcon className="h-4 w-4 text-slate-400" />
                                                    Sign out
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 px-6 py-8 lg:px-8">
                        <PendingInvoiceNotification invoice={pendingInvoice} />
                        {children}
                    </main>
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
                                <Link
                                    href={ProfileController.edit.url()}
                                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 transition-colors hover:bg-white/10"
                                >
                                    <UserCircleIcon className="h-5 w-5" /> Profile
                                </Link>

                                {isAdmin && hasActivityLogs && (
                                    <Link
                                        href={ActivityLogController.index.url()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 transition-colors hover:bg-white/10"
                                    >
                                        <ClipboardDocumentListIcon className="h-5 w-5" /> Activity Log
                                    </Link>
                                )}

                                {(auth.user?.available_contexts?.length || 0) > 1 && (
                                    <Link
                                        href={ContextController.index.url()}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-white/70 transition-colors hover:bg-white/10"
                                    >
                                        <BuildingOfficeIcon className="h-5 w-5" /> Switch Workspace
                                    </Link>
                                )}

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
