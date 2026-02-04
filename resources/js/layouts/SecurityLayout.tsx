import { Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Newspaper, Bell, User } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import InstallPWABanner from '@/components/InstallPWABanner';
import PullToRefresh from '@/components/PullToRefresh';
import HomeController from '@/actions/App/Http/Controllers/Security/HomeController';
import EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import NotificationController from '@/actions/App/Http/Controllers/Security/NotificationController';
import ProfileController from '@/actions/App/Http/Controllers/Security/ProfileController';

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
    const { auth, estateName, unreadCount = 0, flash } = page.props;
    const currentPath = new URL(page.url, 'http://localhost').pathname;
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

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
        return item.matchPaths.some((path) => currentPath === path || currentPath.startsWith(path + '/'));
    };

    return (
        <PullToRefresh>
            <div className="flex min-h-screen flex-col bg-slate-50">
                {/* Minimal Header */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-xl"
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
                            <div className="grid grid-cols-4 items-center justify-between py-2 px-2">
                                {navItems.map((item) => {
                                    const active = isActive(item);
                                    const Icon = item.icon;
                                    const hasNotifications = item.name === 'Alerts' && unreadCount > 0;

                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className="group relative flex flex-col items-center gap-1 py-2"
                                        >
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
                                                className={`text-[10px] font-medium leading-tight transition-colors ${
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
                            className="fixed bottom-28 left-4 right-4 z-50 mx-auto max-w-md"
                        >
                            <div
                                className={`rounded-2xl px-4 py-3 text-center text-sm font-medium shadow-lg ${
                                    toastType === 'success'
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-red-500 text-white'
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
