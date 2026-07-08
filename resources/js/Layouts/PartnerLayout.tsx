import {
    ArrowLeftStartOnRectangleIcon,
    BanknotesIcon,
    BuildingOffice2Icon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    LifebuoyIcon,
    MoonIcon,
    PlusIcon,
    Squares2X2Icon,
    SunIcon,
    UserCircleIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import MobileBottomNav from '@/Components/Partner/MobileBottomNav';
import NotificationDropdown from '@/Components/Partner/NotificationDropdown';
import Toast from '@/Components/Toast';
import { usePartnerTheme } from '@/Hooks/usePartnerTheme';
import usePathFromUrl from '@/Hooks/usePathFromUrl';
import { useSidebarState } from '@/Hooks/useSidebarState';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import { formatCommission } from '@/Utils/money';

interface Props {
    children: ReactNode;
    /** Wider max for boards; still centered. */
    fullWidth?: boolean;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    badge?: number;
};

const primaryNav: NavItem[] = [
    { name: 'Workspace', href: '/partner/dashboard', icon: Squares2X2Icon, exact: true },
    { name: 'Pipeline', href: '/partner/partner-requests', icon: BuildingOffice2Icon },
    { name: 'Earnings', href: '/partner/earnings', icon: BanknotesIcon },
];

const secondaryNav: NavItem[] = [
    { name: 'Account', href: '/partner/profile', icon: UserCircleIcon },
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
    partnerUnreadCount?: number;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export default function PartnerLayout({ children, fullWidth = false }: Props) {
    const page = usePage<PartnerPageProps>();
    const { flash, auth, partnerContext, partnerUnreadCount } = page.props;
    const { url: fullUrl } = page;
    const url = fullUrl.split('?')[0];
    const { isCollapsed, toggle } = useSidebarState('partner-sidebar-collapsed');
    const { theme, toggleTheme } = usePartnerTheme();
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
    const unread = partnerUnreadCount ?? user?.unread_notifications_count ?? 0;

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
        if (exact) return currentPath === href;
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
                className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150 ${
                    active
                        ? 'bg-white/[0.09] text-white shadow-sm ring-1 ring-white/10'
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
                }`}
            >
                {active && (
                    <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-r bg-primary-400" aria-hidden />
                )}
                <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-primary-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {showLabel && <span className="truncate">{item.name}</span>}
            </Link>
        );
    }

    const contentMax = fullWidth ? 'max-w-[1400px]' : 'max-w-6xl';

    return (
        <AnimatedLayout>
            <div className="flex min-h-screen bg-[#f7f6f3] transition-colors duration-300 dark:bg-slate-950">
                {/* Sidebar — narrower, lightweight */}
                <motion.aside
                    initial={false}
                    animate={{ width: isCollapsed ? 64 : 220 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    className="fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-800/80 bg-[#0f1419] lg:flex"
                    aria-label="Partner sidebar"
                    style={{ width: isCollapsed ? 64 : 220 }}
                >
                    <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-3">
                        {!isCollapsed && (
                            <Link href="/partner/dashboard" className="min-w-0 flex-1" aria-label="Kontrol Partner">
                                <div className="h-6 w-full overflow-hidden">
                                    <img
                                        src="/assets/images/kontrol.png"
                                        alt="Kontrol"
                                        className="h-auto w-[88px] -translate-y-[22px] brightness-0 invert opacity-90"
                                    />
                                </div>
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={toggle}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="inline-flex rounded-md p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-slate-200"
                        >
                            {isCollapsed ? (
                                <ChevronDoubleRightIcon className="h-4 w-4" />
                            ) : (
                                <ChevronDoubleLeftIcon className="h-4 w-4" />
                            )}
                        </button>
                    </div>

                    {!isCollapsed && (
                        <div className="border-b border-white/[0.06] px-3 py-3">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/15 text-[11px] font-bold text-primary-300 ring-1 ring-primary-500/25"
                                    aria-hidden
                                >
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[12px] font-semibold text-white">{partnerName}</p>
                                    <div className="mt-0.5 flex items-center gap-1">
                                        {partnerContext?.status === 'active' ? (
                                            <span className="rounded bg-emerald-500/15 px-1 py-px text-[9px] font-semibold text-emerald-300">
                                                Verified
                                            </span>
                                        ) : (
                                            <span className="rounded bg-amber-500/15 px-1 py-px text-[9px] font-semibold text-amber-300 capitalize">
                                                {partnerContext?.status ?? 'Partner'}
                                            </span>
                                        )}
                                        {partnerContext?.commission_rate && (
                                            <span className="truncate text-[10px] text-slate-500">
                                                {formatCommission(partnerContext.commission_rate, partnerContext.commission_type)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" aria-label="Primary">
                        {primaryNav.map((item) => renderNavLink(item, { showLabel: !isCollapsed }))}
                        <div className="my-2 border-t border-white/[0.06]" />
                        {secondaryNav.map((item) => renderNavLink(item, { showLabel: !isCollapsed }))}
                    </nav>

                    <div className="space-y-1 border-t border-white/[0.06] p-2">
                        <Link
                            href="/partner/partner-requests/create"
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-2.5 py-2 text-[12px] font-semibold text-white transition hover:bg-primary-500 active:scale-[0.98]"
                            aria-label="Submit new estate"
                        >
                            <PlusIcon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span>Submit estate</span>}
                        </Link>
                        <button
                            type="button"
                            onClick={handleLogout}
                            aria-label="Log out"
                            className="group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
                        >
                            <ArrowLeftStartOnRectangleIcon className="h-4 w-4 shrink-0" />
                            {!isCollapsed && <span>Log out</span>}
                        </button>
                    </div>
                </motion.aside>

                {/* Mobile drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-40 bg-stone-900/40 backdrop-blur-sm lg:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                                aria-hidden
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                                className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#0f1419] shadow-2xl lg:hidden"
                                aria-label="Partner menu"
                            >
                                <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-3">
                                    <span className="text-[13px] font-semibold text-white">Menu</span>
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        aria-label="Close menu"
                                        className="rounded-md p-1.5 text-slate-400 hover:bg-white/5"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="border-b border-white/[0.06] px-3 py-3">
                                    <p className="text-[13px] font-semibold text-white">{partnerName}</p>
                                    <p className="text-[11px] text-slate-500">{user?.email}</p>
                                </div>
                                <nav className="flex-1 space-y-0.5 px-2 py-3">
                                    {[...primaryNav, ...secondaryNav].map((item) => renderNavLink(item, { showLabel: true }))}
                                </nav>
                                <div className="border-t border-white/[0.06] p-2">
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                        <ArrowLeftStartOnRectangleIcon className="h-4 w-4" />
                                        Log out
                                    </button>
                                </div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main */}
                <div
                    className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${isCollapsed ? 'lg:ml-16' : 'lg:ml-[220px]'}`}
                >
                    <header className="sticky top-0 z-30 border-b border-stone-200/70 bg-[#f7f6f3]/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
                        <div className={`mx-auto flex h-12 items-center justify-between gap-3 px-4 sm:px-5 ${contentMax}`}>
                            <div className="flex min-w-0 items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setMobileMenuOpen(true)}
                                    className="inline-flex rounded-md p-1.5 text-stone-600 hover:bg-stone-200/60 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
                                    aria-label="Open menu"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                        <path d="M3 12h18M3 6h18M3 18h18" />
                                    </svg>
                                </button>
                                <div className="min-w-0">
                                    <p className="truncate text-[11px] font-medium text-stone-500 dark:text-slate-500">
                                        {getGreeting()}
                                    </p>
                                    <p className="truncate text-[13px] font-semibold text-stone-900 dark:text-white">{partnerName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-0.5 sm:gap-1">
                                <Link
                                    href="/partner/partner-requests/create"
                                    className="mr-1 hidden items-center gap-1 rounded-lg bg-primary-600 px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-primary-500 active:scale-[0.98] sm:inline-flex"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                    Submit
                                </Link>
                                <button
                                    type="button"
                                    onClick={toggleTheme}
                                    aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                    className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-200/70 hover:text-stone-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                    {theme === 'dark' ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
                                </button>
                                <NotificationDropdown unreadCount={unread} />
                                <Link
                                    href="/partner/profile"
                                    className="ml-0.5 flex items-center rounded-lg p-1 transition hover:bg-stone-200/70 dark:hover:bg-slate-800"
                                    aria-label="Open account"
                                >
                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">
                                        {initials}
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 pb-20 lg:pb-6">
                        <motion.div
                            key={currentPath}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`mx-auto px-4 py-4 sm:px-5 sm:py-5 ${contentMax}`}
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
