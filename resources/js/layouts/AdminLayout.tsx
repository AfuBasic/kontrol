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
import AnimatedLayout from '@/layouts/AnimatedLayout';

interface Props {
    children: ReactNode;
}

interface Permission {
    name: string;
}

interface PageProps {
    auth: {
        user: {
            name: string;
            email: string;
            permissions?: Permission[];
            roles?: string[];
        };
    };
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
};

const primaryNav: NavItem[] = [
    { name: 'Estate Board', href: '/admin/estate', icon: BuildingOffice2Icon },
    { name: 'Residents', href: '/admin/residents', icon: UsersIcon, permission: 'residents.view' },
    { name: 'Security', href: '/admin/security', icon: ShieldCheckIcon, permission: 'security.view' },
];

const secondaryNav: NavItem[] = [{ name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon, permission: 'settings.view' }];

export default function AdminLayout({ children }: Props) {
    const { auth } = usePage<PageProps>().props;
    const { url } = usePage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const userPermissions = auth?.user?.permissions?.map((p) => p.name) ?? [];
    const userRoles = auth?.user?.roles ?? [];
    const isAdmin = userRoles.includes('admin');

    function handleLogout() {
        router.post('/logout');
    }

    function isCurrentPath(href: string) {
        return url.startsWith(href);
    }

    function canAccess(permission?: string): boolean {
        if (!permission) return true;
        if (isAdmin) return true; // Admins have access to everything
        return userPermissions.includes(permission);
    }

    function filterNav(items: NavItem[]): NavItem[] {
        return items.filter((item) => canAccess(item.permission));
    }

    const visiblePrimaryNav = filterNav(primaryNav);
    const visibleSecondaryNav = filterNav(secondaryNav);

    return (
        <AnimatedLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="sticky top-0 z-40 border-b border-gray-200 bg-white"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            {/* Logo & Primary Nav */}
                            <div className="flex items-center gap-8">
                                <Link href="/admin/dashboard" className="shrink-0">
                                    <div className="h-10 w-44 overflow-hidden">
                                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-10" />
                                    </div>
                                </Link>

                                {/* Desktop Navigation */}
                                <nav className="hidden items-center gap-1 md:flex">
                                    {visiblePrimaryNav.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                isCurrentPath(item.href)
                                                    ? 'bg-gray-900 text-white'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.name}
                                        </Link>
                                    ))}

                                    {visibleSecondaryNav.length > 0 && (
                                        <>
                                            <div className="mx-2 h-5 w-px bg-gray-200" />
                                            {visibleSecondaryNav.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                                        isCurrentPath(item.href)
                                                            ? 'bg-gray-900 text-white'
                                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                                    }`}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    {item.name}
                                                </Link>
                                            ))}
                                        </>
                                    )}
                                </nav>
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center gap-3">
                                {/* User dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                                            <UserCircleIcon className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <span className="hidden sm:block">{auth?.user?.name}</span>
                                        <ChevronDownIcon
                                            className={`h-4 w-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {userMenuOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: -8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                                            >
                                                <div className="border-b border-gray-100 px-4 py-3">
                                                    <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                                                    <p className="truncate text-xs text-gray-500">{auth?.user?.email}</p>
                                                </div>
                                                <Link
                                                    href="/admin/profile"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <UserCircleIcon className="h-4 w-4" />
                                                    Profile
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <ArrowLeftStartOnRectangleIcon className="h-4 w-4" />
                                                    Sign out
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </div>

                                {/* Mobile menu button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
                                >
                                    {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <motion.nav
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="border-t border-gray-200 px-4 py-3 md:hidden"
                        >
                            <div className="space-y-1">
                                {visiblePrimaryNav.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                            isCurrentPath(item.href) ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.name}
                                    </Link>
                                ))}
                            </div>
                            {visibleSecondaryNav.length > 0 && (
                                <>
                                    <div className="my-3 border-t border-gray-200" />
                                    <div className="space-y-1">
                                        {visibleSecondaryNav.map((item) => (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                                    isCurrentPath(item.href) ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
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

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
            </div>
        </AnimatedLayout>
    );
}
