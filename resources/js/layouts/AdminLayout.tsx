import {
    ArrowLeftStartOnRectangleIcon,
    Bars3Icon,
    BellIcon,
    BuildingOffice2Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    UserCircleIcon,
    UserGroupIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';

import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import ProfileController from '@/actions/App/Http/Controllers/Admin/ProfileController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import NotificationController from '@/actions/App/Http/Controllers/Admin/NotificationController';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
import { useSidebarState } from '@/hooks/useSidebarState';
import AnimatedLayout from '@/layouts/AnimatedLayout';
import type { SharedData } from '@/types';

interface Props {
    children: ReactNode;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
    comingSoon?: boolean;
};

const primaryNav: NavItem[] = [
    { name: 'Dashboard', href: DashboardController.url(), icon: Squares2X2Icon },
    { name: 'Estate Board', href: EstateBoardController.url(), icon: BuildingOffice2Icon },
    { name: 'Residents', href: ResidentController.index.url(), icon: UsersIcon, permission: 'residents.view' },
    { name: 'Security', href: SecurityPersonnelController.index.url(), icon: ShieldCheckIcon, permission: 'security.view' },
    { name: 'Roles', href: '#', icon: UserGroupIcon, comingSoon: true },
];

const secondaryNav: NavItem[] = [{ name: 'Settings', href: SettingsController.url(), icon: Cog6ToothIcon, permission: 'settings.view' }];

export default function AdminLayout({ children }: Props) {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const { isCollapsed, toggle } = useSidebarState();

    const userPermissions = auth.user?.permissions?.map((p) => p.name) ?? [];
    const userRoles = auth.user?.roles ?? [];
    const isAdmin = userRoles.includes('admin');

    function handleLogout() {
        router.post(LoginController.destroy.url());
    }

    function isCurrentPath(href: string) {
        if (href === DashboardController.url()) {
            return url === href || url === href + '/';
        }
        return url.startsWith(href);
    }

    function canAccess(permission?: string): boolean {
        if (!permission) return true;
        if (isAdmin) return true;
        return userPermissions.includes(permission);
    }

    function filterNav(items: NavItem[]): NavItem[] {
        return items.filter((item) => canAccess(item.permission));
    }

    const visiblePrimaryNav = filterNav(primaryNav);
    const visibleSecondaryNav = filterNav(secondaryNav);

    const sidebarWidth = isCollapsed ? 72 : 240;

    return (
        <div className="min-h-screen bg-[#F0F5FF]">
            {/* Mobile Top Bar */}
            <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-[#1F6FDB] px-4 md:hidden">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                    <Bars3Icon className="h-5 w-5" />
                </button>
                <Link href={DashboardController.url()} className="shrink-0">
                    <span className="text-lg font-bold text-white">Kontrol</span>
                </Link>
                <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/30"
                >
                    <span className="text-xs font-semibold text-white">{auth.user?.name?.charAt(0).toUpperCase()}</span>
                </button>
            </header>

            {/* Mobile Drawer Backdrop */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 bg-black/60 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-linear-to-b from-[#0A3D91] to-[#041E4A] shadow-xl md:hidden"
                    >
                        {/* Mobile Drawer Header */}
                        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
                            <Link href={DashboardController.url()} className="shrink-0">
                                <span className="text-lg font-bold text-white">Kontrol</span>
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Mobile Nav */}
                        <nav className="flex-1 overflow-y-auto p-3">
                            <div className="space-y-1">
                                {visiblePrimaryNav.map((item) =>
                                    item.comingSoon ? (
                                        <div
                                            key={item.name}
                                            className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/40"
                                        >
                                            <item.icon className="h-5 w-5 text-white/30" />
                                            <span>{item.name}</span>
                                            <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
                                                Soon
                                            </span>
                                        </div>
                                    ) : (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                                isCurrentPath(item.href)
                                                    ? 'bg-white/20 text-white shadow-sm'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            <item.icon className={`h-5 w-5 ${isCurrentPath(item.href) ? 'text-white' : 'text-white/60'}`} />
                                            {item.name}
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
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                                    isCurrentPath(item.href)
                                                        ? 'bg-white/20 text-white shadow-sm'
                                                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                                                }`}
                                            >
                                                <item.icon className={`h-5 w-5 ${isCurrentPath(item.href) ? 'text-white' : 'text-white/60'}`} />
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </nav>

                        {/* Mobile User Section */}
                        <div className="border-t border-white/10 p-3">
                            <Link
                                href={ProfileController.edit.url()}
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                            >
                                <UserCircleIcon className="h-5 w-5 text-white/60" />
                                Profile
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white"
                            >
                                <ArrowLeftStartOnRectangleIcon className="h-5 w-5 text-white/60" />
                                Sign out
                            </button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Desktop Layout */}
            <div className="hidden md:flex">
                {/* Desktop Sidebar — Navy gradient with light text */}
                <motion.aside
                    initial={false}
                    animate={{ width: sidebarWidth }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="fixed inset-y-0 left-0 z-40 flex flex-col bg-linear-to-b from-[#0A3D91] to-[#041E4A]"
                >
                    {/* Sidebar Header */}
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

                    {/* Sidebar Nav */}
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
                                        <AnimatePresence initial={false}>
                                            {!isCollapsed && (
                                                <motion.div
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className="flex flex-1 items-center justify-between overflow-hidden whitespace-nowrap"
                                                >
                                                    <span>{item.name}</span>
                                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/50">
                                                        Soon
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed && (
                                            <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-[#0A3D91] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
                                                {item.name} (Soon)
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        title={isCollapsed ? item.name : undefined}
                                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
                                            isCurrentPath(item.href)
                                                ? 'bg-white/20 text-white shadow-sm'
                                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                                        }`}
                                    >
                                        {/* Active indicator */}
                                        {isCurrentPath(item.href) && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#1F6FDB]"
                                            />
                                        )}
                                        <item.icon
                                            className={`h-5 w-5 shrink-0 ${isCurrentPath(item.href) ? 'text-white' : 'text-white/60 group-hover:text-white'}`}
                                        />
                                        <AnimatePresence initial={false}>
                                            {!isCollapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, width: 0 }}
                                                    animate={{ opacity: 1, width: 'auto' }}
                                                    exit={{ opacity: 0, width: 0 }}
                                                    className="overflow-hidden whitespace-nowrap"
                                                >
                                                    {item.name}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                        {/* Tooltip for collapsed state */}
                                        {isCollapsed && (
                                            <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-[#0A3D91] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
                                                {item.name}
                                            </div>
                                        )}
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
                                            title={isCollapsed ? item.name : undefined}
                                            className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium transition-all ${
                                                isCurrentPath(item.href)
                                                    ? 'bg-white/20 text-white shadow-sm'
                                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                            }`}
                                        >
                                            {isCurrentPath(item.href) && (
                                                <motion.div
                                                    layoutId="activeIndicatorSecondary"
                                                    className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#1F6FDB]"
                                                />
                                            )}
                                            <item.icon
                                                className={`h-5 w-5 shrink-0 ${
                                                    isCurrentPath(item.href) ? 'text-white' : 'text-white/60 group-hover:text-white'
                                                }`}
                                            />
                                            <AnimatePresence initial={false}>
                                                {!isCollapsed && (
                                                    <motion.span
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        className="overflow-hidden whitespace-nowrap"
                                                    >
                                                        {item.name}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                            {isCollapsed && (
                                                <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-[#0A3D91] px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">
                                                    {item.name}
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="border-t border-white/10 p-3">
                        {/* Collapse Toggle */}
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

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-white/10"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1F6FDB] ring-2 ring-white/30">
                                    <span className="text-xs font-semibold text-white">{auth.user?.name?.charAt(0).toUpperCase()}</span>
                                </div>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="flex flex-1 items-center justify-between overflow-hidden"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-left text-sm font-medium text-white">{auth.user?.name}</p>
                                            </div>
                                            <ChevronDownIcon
                                                className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>

                            {/* User Dropdown */}
                            <AnimatePresence>
                                {userMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute bottom-full left-0 z-20 mb-2 w-56 origin-bottom-left rounded-xl border border-[#1F6FDB]/20 bg-white p-1.5 shadow-lg"
                                        >
                                            <div className="rounded-lg bg-[#F0F5FF] px-3 py-2">
                                                <p className="text-sm font-medium text-[#0A3D91]">{auth.user?.name}</p>
                                                <p className="truncate text-xs text-[#1F6FDB]">{auth.user?.email}</p>
                                            </div>
                                            <div className="mt-1.5 space-y-0.5">
                                                <Link
                                                    href={ProfileController.edit.url()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-[#F0F5FF] hover:text-[#1F6FDB]"
                                                >
                                                    <UserCircleIcon className="h-4 w-4 text-[#1F6FDB]" />
                                                    Profile
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-[#F0F5FF] hover:text-[#1F6FDB]"
                                                >
                                                    <ArrowLeftStartOnRectangleIcon className="h-4 w-4 text-[#1F6FDB]" />
                                                    Sign out
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.aside>

                {/* Main Content Area */}
                <motion.main
                    initial={false}
                    animate={{ marginLeft: sidebarWidth }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="min-h-screen flex-1"
                >
                    {/* Content Header Bar */}
                    <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-md lg:px-8">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-[#1F6FDB]" />
                            <span className="text-sm font-medium text-slate-500">Admin Panel</span>
                        </div>
                        {/* Notification Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setNotificationOpen(!notificationOpen)}
                                className={`relative rounded-full p-1.5 transition-colors ${
                                    notificationOpen ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-500'
                                }`}
                            >
                                <span className="sr-only">View notifications</span>
                                <BellIcon className="h-6 w-6" aria-hidden="true" />
                                {auth.user?.unread_notifications_count ? (
                                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white"></span>
                                    </span>
                                ) : null}
                            </button>

                            <AnimatePresence>
                                {notificationOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setNotificationOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className="absolute top-full right-0 z-20 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none sm:w-96"
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                                                <h3 className="text-base font-semibold text-slate-900">Notifications</h3>
                                                {auth.user?.unread_notifications_count ? (
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                                        {auth.user.unread_notifications_count} new
                                                    </span>
                                                ) : null}
                                            </div>

                                            <div className="max-h-[28rem] overflow-y-auto">
                                                {auth.user?.notifications && auth.user.notifications.length > 0 ? (
                                                    <div className="divide-y divide-slate-100">
                                                        {auth.user.notifications.map((notification) => (
                                                            <div key={notification.id} className="group relative flex gap-4 p-4 hover:bg-slate-50">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-slate-900">
                                                                        {/* @ts-ignore - dynamic data content */}
                                                                        {notification.data.message || 'New notification'}
                                                                    </p>
                                                                    <p className="mt-1 text-xs text-slate-500">{notification.created_at_human}</p>
                                                                </div>
                                                                <div className="flex h-2 w-2 shrink-0 translate-y-1.5 rounded-full bg-blue-600"></div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-12 text-center">
                                                        <BellIcon className="mx-auto h-10 w-10 text-slate-300" />
                                                        <p className="mt-2 text-sm font-medium text-slate-900">No notifications</p>
                                                        <p className="mt-1 text-xs text-slate-500">You're all caught up!</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="border-t border-slate-100 p-2">
                                                <Link
                                                    href={NotificationController.index.url()}
                                                    onClick={() => setNotificationOpen(false)}
                                                    className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
                                                >
                                                    View all notifications
                                                </Link>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                    {/* Content Body */}
                    <div className="p-6 lg:p-8">
                        <AnimatedLayout>{children}</AnimatedLayout>
                    </div>
                </motion.main>
            </div>

            <main className="p-4 md:hidden">
                <AnimatedLayout>{children}</AnimatedLayout>
            </main>
        </div>
    );
}
