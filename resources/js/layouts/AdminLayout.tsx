import {
    ArrowLeftStartOnRectangleIcon,
    Bars3Icon,
    BuildingOffice2Icon,
    ChevronDownIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
    UserCircleIcon,
    UsersIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';

import DashboardController from '@/actions/App/Http/Controllers/Admin/DashboardController';
import EstateBoardController from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import ProfileController from '@/actions/App/Http/Controllers/Admin/ProfileController';
import ResidentController from '@/actions/App/Http/Controllers/Admin/ResidentController';
import SecurityPersonnelController from '@/actions/App/Http/Controllers/Admin/SecurityPersonnelController';
import SettingsController from '@/actions/App/Http/Controllers/Admin/SettingsController';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
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

    const userPermissions = auth.user?.permissions?.map((p) => p.name) ?? [];
    const userRoles = auth.user?.roles ?? [];
    const isAdmin = userRoles.includes('admin');

    function handleLogout() {
        router.post(LoginController.destroy.url());
    }

    function isCurrentPath(href: string) {
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

    return (
        <AnimatedLayout>
            {/* Blue-tinted page background */}
            <div className="min-h-screen bg-[#F0F5FF]">
                {/* Header — White with soft blue glow */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="sticky top-0 z-40 bg-white/95 shadow-[0_1px_3px_rgba(31,111,219,0.08),0_4px_12px_rgba(31,111,219,0.04)] backdrop-blur-xl"
                >
                    <div className="mx-auto max-w-6xl px-6 lg:px-8">
                        <div className="flex h-14 items-center justify-between">
                            {/* Logo */}
                            <Link href={DashboardController.url()} className="shrink-0">
                                <div className="h-9 w-40 overflow-hidden">
                                    <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-9" />
                                </div>
                            </Link>

                            {/* Desktop Navigation — Primary blue active indicators */}
                            <nav className="hidden items-center gap-1 md:flex">
                                {visiblePrimaryNav.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group relative px-4 py-2 text-sm font-medium transition-colors ${
                                            isCurrentPath(item.href) ? 'text-[#1F6FDB]' : 'text-[#475569] hover:text-[#0A3D91]'
                                        }`}
                                    >
                                        {item.name}
                                        {/* Active indicator — Primary blue underline */}
                                        <span
                                            className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all ${
                                                isCurrentPath(item.href) ? 'bg-[#1F6FDB]' : 'bg-transparent group-hover:bg-[#1F6FDB]/20'
                                            }`}
                                        />
                                    </Link>
                                ))}

                                {visibleSecondaryNav.length > 0 && (
                                    <>
                                        <div className="mx-3 h-4 w-px bg-[#E2E8F0]" />
                                        {visibleSecondaryNav.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`group relative px-4 py-2 text-sm font-medium transition-colors ${
                                                    isCurrentPath(item.href) ? 'text-[#1F6FDB]' : 'text-[#475569] hover:text-[#0A3D91]'
                                                }`}
                                            >
                                                {item.name}
                                                <span
                                                    className={`absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all ${
                                                        isCurrentPath(item.href) ? 'bg-[#1F6FDB]' : 'bg-transparent group-hover:bg-[#1F6FDB]/20'
                                                    }`}
                                                />
                                            </Link>
                                        ))}
                                    </>
                                )}
                            </nav>

                            {/* User Menu — Blue gradient avatar */}
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 rounded-full p-1 text-sm transition-all hover:bg-[#1F6FDB]/5"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-[#1F6FDB] to-[#0A3D91] shadow-sm ring-2 ring-white">
                                            <span className="text-xs font-semibold text-white">{auth.user?.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <ChevronDownIcon
                                            className={`hidden h-4 w-4 text-[#64748B] transition-transform sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                transition={{ duration: 0.15, ease: 'easeOut' }}
                                                className="absolute right-0 z-20 mt-2 w-60 origin-top-right rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-lg shadow-[#1F6FDB]/5"
                                            >
                                                <div className="rounded-lg bg-[#F8FAFC] px-3 py-3">
                                                    <p className="text-sm font-medium text-[#1E293B]">{auth.user?.name}</p>
                                                    <p className="mt-0.5 truncate text-xs text-[#64748B]">{auth.user?.email}</p>
                                                </div>
                                                <div className="mt-1.5 space-y-0.5">
                                                    <Link
                                                        href={ProfileController.edit.url()}
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#1F6FDB]"
                                                    >
                                                        <UserCircleIcon className="h-4 w-4 text-[#94A3B8]" />
                                                        Profile
                                                    </Link>
                                                    <button
                                                        onClick={handleLogout}
                                                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#475569] transition-colors hover:bg-[#F8FAFC] hover:text-[#1F6FDB]"
                                                    >
                                                        <ArrowLeftStartOnRectangleIcon className="h-4 w-4 text-[#94A3B8]" />
                                                        Sign out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </div>

                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="rounded-lg p-2 text-[#64748B] transition-colors hover:bg-[#1F6FDB]/5 hover:text-[#0A3D91] md:hidden"
                                >
                                    {mobileMenuOpen ? <XMarkIcon className="h-5 w-5" /> : <Bars3Icon className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation — Blue accents */}
                    {mobileMenuOpen && (
                        <motion.nav
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="border-t border-[#E2E8F0] bg-white px-4 py-4 md:hidden"
                        >
                            <div className="space-y-1">
                                {visiblePrimaryNav.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                            isCurrentPath(item.href)
                                                ? 'bg-[#1F6FDB] text-white'
                                                : 'text-[#475569] hover:bg-[#F0F5FF] hover:text-[#1F6FDB]'
                                        }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            {visibleSecondaryNav.length > 0 && (
                                <>
                                    <div className="my-3 border-t border-[#E2E8F0]" />
                                    <div className="space-y-1">
                                        {visibleSecondaryNav.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                                    isCurrentPath(item.href)
                                                        ? 'bg-[#1F6FDB] text-white'
                                                        : 'text-[#475569] hover:bg-[#F0F5FF] hover:text-[#1F6FDB]'
                                                }`}
                                            >
                                                <item.icon className="h-5 w-5" />
                                                {item.name}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            )}
                        </motion.nav>
                    )}
                </motion.header>

                {/* Main Content — Free-flowing on blue-tinted background */}
                <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">{children}</main>
            </div>
        </AnimatedLayout>
    );
}
