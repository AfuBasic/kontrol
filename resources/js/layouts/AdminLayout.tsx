import {
    ArrowLeftStartOnRectangleIcon,
    Bars3Icon,
    BuildingOffice2Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    ChevronDownIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    UserCircleIcon,
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
};

const primaryNav: NavItem[] = [
    { name: 'Dashboard', href: DashboardController.url(), icon: Squares2X2Icon },
    { name: 'Estate Board', href: EstateBoardController.url(), icon: BuildingOffice2Icon },
    { name: 'Residents', href: ResidentController.index.url(), icon: UsersIcon, permission: 'residents.view' },
    { name: 'Security', href: SecurityPersonnelController.index.url(), icon: ShieldCheckIcon, permission: 'security.view' },
];

const secondaryNav: NavItem[] = [{ name: 'Settings', href: SettingsController.url(), icon: Cog6ToothIcon, permission: 'settings.view' }];

export default function AdminLayout({ children }: Props) {
    const { auth } = usePage<SharedData>().props;
    const { url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
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
        <AnimatedLayout>
            <div className="min-h-screen bg-[#F8FAFC]">
                {/* Mobile Top Bar */}
                <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
                    <button onClick={() => setMobileMenuOpen(true)} className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100">
                        <Bars3Icon className="h-5 w-5" />
                    </button>
                    <Link href={DashboardController.url()} className="shrink-0">
                        <div className="h-8 w-32 overflow-hidden">
                            <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-8" />
                        </div>
                    </Link>
                    <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#1F6FDB] to-[#0A3D91]"
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
                            className="fixed inset-0 z-50 bg-black/50 md:hidden"
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
                            className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-white shadow-xl md:hidden"
                        >
                            {/* Mobile Drawer Header */}
                            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
                                <Link href={DashboardController.url()} className="shrink-0">
                                    <div className="h-8 w-32 overflow-hidden">
                                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-8" />
                                    </div>
                                </Link>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Mobile Nav */}
                            <nav className="flex-1 overflow-y-auto p-3">
                                <div className="space-y-1">
                                    {visiblePrimaryNav.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                                isCurrentPath(item.href)
                                                    ? 'border-l-4 border-[#1F6FDB] bg-blue-50 text-[#1F6FDB]'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <item.icon className={`h-5 w-5 ${isCurrentPath(item.href) ? 'text-[#1F6FDB]' : 'text-slate-400'}`} />
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                                {visibleSecondaryNav.length > 0 && (
                                    <>
                                        <div className="my-4 border-t border-slate-200" />
                                        <div className="space-y-1">
                                            {visibleSecondaryNav.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    onClick={() => setMobileMenuOpen(false)}
                                                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                                        isCurrentPath(item.href)
                                                            ? 'border-l-4 border-[#1F6FDB] bg-blue-50 text-[#1F6FDB]'
                                                            : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    <item.icon
                                                        className={`h-5 w-5 ${isCurrentPath(item.href) ? 'text-[#1F6FDB]' : 'text-slate-400'}`}
                                                    />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </nav>

                            {/* Mobile User Section */}
                            <div className="border-t border-slate-200 p-3">
                                <Link
                                    href={ProfileController.edit.url()}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                                >
                                    <UserCircleIcon className="h-5 w-5 text-slate-400" />
                                    Profile
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                                >
                                    <ArrowLeftStartOnRectangleIcon className="h-5 w-5 text-slate-400" />
                                    Sign out
                                </button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>

                {/* Desktop Layout */}
                <div className="hidden md:flex">
                    {/* Desktop Sidebar */}
                    <motion.aside
                        initial={false}
                        animate={{ width: sidebarWidth }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 bg-white"
                    >
                        {/* Sidebar Header */}
                        <div className="flex h-14 items-center border-b border-slate-200 px-4">
                            <Link href={DashboardController.url()} className="shrink-0 overflow-hidden">
                                <AnimatePresence mode="wait">
                                    {isCollapsed ? (
                                        <motion.div
                                            key="collapsed"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1F6FDB]"
                                        >
                                            <span className="text-lg font-bold text-white">K</span>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="expanded"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="h-8 w-32 overflow-hidden"
                                        >
                                            <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-8" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Link>
                        </div>

                        {/* Sidebar Nav */}
                        <nav className="flex-1 overflow-y-auto p-3">
                            <div className="space-y-1">
                                {visiblePrimaryNav.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        title={isCollapsed ? item.name : undefined}
                                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                            isCurrentPath(item.href) ? 'bg-blue-50 text-[#1F6FDB]' : 'text-slate-600 hover:bg-slate-100'
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
                                            className={`h-5 w-5 shrink-0 ${
                                                isCurrentPath(item.href) ? 'text-[#1F6FDB]' : 'text-slate-400 group-hover:text-slate-600'
                                            }`}
                                        />
                                        <AnimatePresence>
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
                                            <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
                                                {item.name}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>

                            {visibleSecondaryNav.length > 0 && (
                                <>
                                    <div className="my-4 border-t border-slate-200" />
                                    <div className="space-y-1">
                                        {visibleSecondaryNav.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                title={isCollapsed ? item.name : undefined}
                                                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                                    isCurrentPath(item.href) ? 'bg-blue-50 text-[#1F6FDB]' : 'text-slate-600 hover:bg-slate-100'
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
                                                        isCurrentPath(item.href) ? 'text-[#1F6FDB]' : 'text-slate-400 group-hover:text-slate-600'
                                                    }`}
                                                />
                                                <AnimatePresence>
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
                                                    <div className="pointer-events-none absolute left-full ml-2 hidden rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 md:block">
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
                        <div className="border-t border-slate-200 p-3">
                            {/* Collapse Toggle */}
                            <button
                                onClick={toggle}
                                className="mb-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            >
                                {isCollapsed ? (
                                    <ChevronDoubleRightIcon className="h-5 w-5 shrink-0" />
                                ) : (
                                    <>
                                        <ChevronDoubleLeftIcon className="h-5 w-5 shrink-0" />
                                        <span>Collapse</span>
                                    </>
                                )}
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-100"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#1F6FDB] to-[#0A3D91]">
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
                                                    <p className="truncate text-left text-sm font-medium text-slate-700">{auth.user?.name}</p>
                                                </div>
                                                <ChevronDownIcon
                                                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
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
                                                className="absolute bottom-full left-0 z-20 mb-2 w-56 origin-bottom-left rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
                                            >
                                                <div className="rounded-lg bg-slate-50 px-3 py-2">
                                                    <p className="text-sm font-medium text-slate-900">{auth.user?.name}</p>
                                                    <p className="truncate text-xs text-slate-500">{auth.user?.email}</p>
                                                </div>
                                                <div className="mt-1.5 space-y-0.5">
                                                    <Link
                                                        href={ProfileController.edit.url()}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#1F6FDB]"
                                                    >
                                                        <UserCircleIcon className="h-4 w-4 text-slate-400" />
                                                        Profile
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#1F6FDB]"
                                                    >
                                                        <ArrowLeftStartOnRectangleIcon className="h-4 w-4 text-slate-400" />
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
                        className="min-h-screen flex-1 p-6 lg:p-8"
                    >
                        <div className="mx-auto max-w-5xl">{children}</div>
                    </motion.main>
                </div>

                {/* Mobile Content */}
                <main className="p-4 md:hidden">
                    <div className="mx-auto max-w-5xl">{children}</div>
                </main>
            </div>
        </AnimatedLayout>
    );
}
