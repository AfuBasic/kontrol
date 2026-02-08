import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Bell, User } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import '@/echo';
import EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import HomeController from '@/actions/App/Http/Controllers/Security/HomeController';
import NotificationController from '@/actions/App/Http/Controllers/Security/NotificationController';
import ProfileController from '@/actions/App/Http/Controllers/Security/ProfileController';
import InstallPWABanner from '@/components/InstallPWABanner';
import PullToRefresh from '@/components/PullToRefresh';

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
    [key: string]: unknown;
}

const navItems = [
    {
        name: 'Home',
        href: HomeController.url(),
        icon: Home,
        matchPaths: ['/security', '/security/validate'],
    },
    {
        name: 'Feed',
        href: EstateBoardController.index.url(),
        icon: Newspaper,
        matchPaths: ['/security/feed'],
    },
    {
        name: 'Alerts',
        href: NotificationController.index.url(),
        icon: Bell,
        matchPaths: ['/security/notifications'],
    },
    {
        name: 'Profile',
        href: ProfileController.edit.url(),
        icon: User,
        matchPaths: ['/security/profile'],
    },
];

export default function SecurityLayout({ children, hideNav = false }: Props) {
    const page = usePage<PageProps>();
    const { auth, estateName, unreadCount: initialUnreadCount = 0, flash } = page.props;
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

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

    const isActive = (item: (typeof navItems)[0]) => {
        // Check for exact match first
        if (item.matchPaths.some((path) => currentPath === path)) {
            return true;
        }

        // For startsWith matching, ensure no other nav item has a more specific match
        const hasStartsWithMatch = item.matchPaths.some((path) => currentPath.startsWith(path + '/'));
        if (!hasStartsWithMatch) {
            return false;
        }

        // Check if another item has a more specific match (longer path)
        const otherItemsMatch = navItems
            .filter((other) => other !== item)
            .some((other) => other.matchPaths.some((otherPath) => currentPath === otherPath || currentPath.startsWith(otherPath + '/')));

        return !otherItemsMatch;
    };

    return (
        <PullToRefresh>
            <div className="flex min-h-screen flex-col bg-slate-50">
                {/* Safe area spacer - fills status bar area with background */}
                <div className="pt-safe fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-xl" aria-hidden="true" />

                {/* Minimal Header */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="mt-safe sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl"
                >
                    <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                        <Link href={HomeController.url()} className="flex items-center gap-2.5">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9 object-contain" />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-slate-900">Security</span>
                                {estateName && <span className="text-[10px] leading-tight text-slate-500">{estateName}</span>}
                            </div>
                        </Link>

                        {/* User Avatar */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-primary-100 to-primary-200 text-xs font-semibold text-primary-700">
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

                {/* Main Content */}
                <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-24">{children}</main>

                {/* Bottom Navigation */}
                {!hideNav && (
                    <motion.nav
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 backdrop-blur-xl"
                    >
                        <div className="mx-auto max-w-lg">
                            <div className="grid grid-cols-4 items-center justify-between px-2 py-2">
                                {navItems.map((item) => {
                                    const active = isActive(item);
                                    const Icon = item.icon;
                                    const hasNotifications = item.name === 'Alerts' && unreadCount > 0;

                                    return (
                                        <Link key={item.name} href={item.href} className="group relative flex flex-col items-center gap-1 py-2">
                                            <div
                                                className={`relative rounded-2xl p-2.5 transition-all duration-200 ${
                                                    active
                                                        ? 'bg-linear-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-500/25'
                                                        : 'group-hover:bg-slate-100 group-active:scale-95'
                                                }`}
                                            >
                                                <Icon
                                                    className={`h-5 w-5 transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`}
                                                    strokeWidth={active ? 2.5 : 1.5}
                                                />
                                                {/* Notification Badge */}
                                                {hasNotifications && (
                                                    <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span
                                                className={`text-[10px] leading-tight font-medium transition-colors ${
                                                    active ? 'text-primary-600' : 'text-slate-500'
                                                }`}
                                            >
                                                {item.name}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
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
                            className="fixed right-4 bottom-28 left-4 z-50 mx-auto max-w-md"
                        >
                            <div
                                className={`rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-lg ${
                                    toastType === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                }`}
                            >
                                {toastMessage}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* PWA Install Banner */}
                <InstallPWABanner />
            </div>
        </PullToRefresh>
    );
}
