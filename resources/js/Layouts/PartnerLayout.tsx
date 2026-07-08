import {
    ArrowLeftStartOnRectangleIcon,
    BanknotesIcon,
    BellIcon,
    BuildingOffice2Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    LifebuoyIcon,
    PlusIcon,
    Squares2X2Icon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import MobileBottomNav from '@/Components/Partner/MobileBottomNav';
import Toast from '@/Components/Toast';
import usePathFromUrl from '@/Hooks/usePathFromUrl';
import { useSidebarState } from '@/Hooks/useSidebarState';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import { formatCommission } from '@/Utils/money';

interface Props {
    children: ReactNode;
    /** When true, content uses full width (e.g. Kanban boards). */
    fullWidth?: boolean;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
};

const primaryNav: NavItem[] = [
    { name: 'Workspace', href: '/partner/dashboard', icon: Squares2X2Icon, exact: true },
    { name: 'Estate Pipeline', href: '/partner/partner-requests', icon: BuildingOffice2Icon },
    { name: 'Earnings', href: '/partner/earnings', icon: BanknotesIcon },
];

const secondaryNav: NavItem[] = [
    { name: 'Profile', href: '/partner/profile', icon: UserCircleIcon },
    { name: 'Support', href: '/partner/support', icon: LifebuoyIcon },
];

interface PartnerPageProps {
    flash: { success?: string; error?: string };
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            unread_notifications_count?: number;
        } | null;
    };
    partnerContext?: {
        name: string;
        status: string;
        commission_rate: string | null;
        commission_type: string | null;
    } | null;
}

function getGreeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
        return 'Good morning';
    }

    if (hour < 17) {
        return 'Good afternoon';
    }

    return 'Good evening';
}

export default function PartnerLayout({ children, fullWidth = false }: Props) {
    const page = usePage<PartnerPageProps>();
    const { flash, auth, partnerContext } = page.props;
    const { url: fullUrl } = page;
    const url = fullUrl.split('?')[0];
    const { isCollapsed, toggle } = useSidebarState('partner-sidebar-collapsed');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const currentPath = usePathFromUrl(url);
    const user = auth?.user;
    const partnerName = partnerContext?.name ?? user?.name ?? 'Partner';
    const initials = partnerName
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

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

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [url]);

    function handleLogout() {
        router.post('/logout');
    }

    function isActive(href: string, exact = false): boolean {
        if (exact) {
            return currentPath === href;
        }

        return currentPath === href || currentPath.startsWith(href + '/');
    }

    function renderNavLink(item: NavItem, { showLabel = true }: { showLabel?: boolean } = {}) {
        const active = isActive(item.href, item.exact);

        return (
            <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-current={active ? 'page' : undefined}
                title={item.name}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
            >
                <item.icon className={`h-5 w-5 shrink-0 ${active ? 'text-primary-300' : 'text-slate-400 group-hover:text-slate-200'}`} />
                {showLabel && <span className="truncate">{item.name}</span>}
            </Link>
        );
    }

    return (
        <AnimatedLayout>
            <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
                {/* Desktop / tablet sidebar */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 lg:flex ${
                        isCollapsed ? 'w-20' : 'w-64'
                    }`}
                    aria-label="Partner sidebar"
                >
                    <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
                        {!isCollapsed && (
                            <Link href="/partner/dashboard" className="flex-1" aria-label="Kontrol Partner Workspace">
                                <div className="h-8 w-full overflow-hidden">
                                    <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-8 brightness-0 invert" />
                                </div>
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={toggle}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="inline-flex rounded-lg p-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                        >
                            {isCollapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Partner context card */}
                    {!isCollapsed && (
                        <div className="border-b border-slate-800 px-4 py-4">
                            <div className="flex items-center gap-3">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/20 text-sm font-bold text-primary-300 ring-1 ring-primary-500/30"
                                    aria-hidden
                                >
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">{partnerName}</p>
                                    <div className="mt-0.5 flex items-center gap-1.5">
                                        {partnerContext?.status === 'active' ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/20">
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 ring-1 ring-amber-500/20">
                                                {partnerContext?.status ?? 'Partner'}
                                            </span>
                                        )}
                                        {partnerContext?.commission_rate && (
                                            <span className="truncate text-[10px] text-slate-400">
                                                {formatCommission(partnerContext.commission_rate, partnerContext.commission_type)} plan
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Primary">
                        {primaryNav.map((item) => renderNavLink(item, { showLabel: !isCollapsed }))}

                        <div className="my-3 border-t border-slate-800" />

                        {secondaryNav.map((item) => renderNavLink(item, { showLabel: !isCollapsed }))}
                    </nav>

                    <div className="space-y-1 border-t border-slate-800 p-3">
                        <Link
                            href="/partner/partner-requests/create"
                            className={`flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/30 transition hover:bg-primary-500 ${
                                isCollapsed ? 'px-2' : ''
                            }`}
                            aria-label="Submit new estate"
                        >
                            <PlusIcon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span>Submit Estate</span>}
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Log out"
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-red-500/10 hover:text-red-300"
                        >
                            <ArrowLeftStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span>Logout</span>}
                        </button>
                    </div>
                </motion.aside>

                {/* Mobile slide-out menu (secondary / overflow) */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                                aria-hidden
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-900 shadow-2xl lg:hidden"
                                aria-label="Partner menu"
                            >
                                <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
                                    <span className="text-sm font-semibold text-white">Menu</span>
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        aria-label="Close menu"
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="border-b border-slate-800 px-4 py-4">
                                    <p className="text-sm font-semibold text-white">{partnerName}</p>
                                    <p className="text-xs text-slate-400">{user?.email}</p>
                                </div>
                                <nav className="flex-1 space-y-1 px-2 py-4">
                                    {[...primaryNav, ...secondaryNav].map((item) => renderNavLink(item, { showLabel: true }))}
                                </nav>
                                <div className="border-t border-slate-800 p-3">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <ArrowLeftStartOnRectangleIcon className="h-5 w-5" />
                                        Logout
                                    </button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main column */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Top header bar */}
                    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
                        <div
                            className={`flex h-14 items-center justify-between gap-3 px-4 sm:px-6 ${
                                fullWidth ? '' : 'mx-auto max-w-7xl lg:px-8'
                            } lg:h-16`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="inline-flex rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
                                    aria-label="Open menu"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <path d="M3 12h18M3 6h18M3 18h18" />
                                    </svg>
                                </button>
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{getGreeting()}</p>
                                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{partnerName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="hidden items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-500 sm:inline-flex"
                                >
                                    <PlusIcon className="h-4 w-4" />
                                    Submit Estate
                                </Link>
                                <button
                                    type="button"
                                    aria-label="Notifications"
                                    className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                                    title="Notifications coming soon"
                                >
                                    <BellIcon className="h-5 w-5" />
                                    {(user?.unread_notifications_count ?? 0) > 0 && (
                                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                                    )}
                                </button>
                                <Link
                                    href="/partner/profile"
                                    className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-800"
                                    aria-label="Open profile"
                                >
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                                        {initials}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 pb-24 lg:pb-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                            className={fullWidth ? 'px-4 py-6 sm:px-6 lg:px-8' : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8'}
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>

                <MobileBottomNav url={currentPath} />

                {showToast && (
                    <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
                )}
            </div>
        </AnimatedLayout>
    );
}
