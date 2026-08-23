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
    fullWidth?: boolean;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
};

const workspaceNav: NavItem[] = [
    { name: 'Workspace', href: '/partner/dashboard', icon: Squares2X2Icon, exact: true },
    { name: 'My Estates', href: '/partner/partner-requests', icon: BuildingOffice2Icon },
    { name: 'Earnings', href: '/partner/earnings', icon: BanknotesIcon },
];

const accountNav: NavItem[] = [
    { name: 'Account', href: '/partner/profile', icon: UserCircleIcon },
    { name: 'Support', href: '/partner/support', icon: LifebuoyIcon },
];

interface PartnerPageProps {
    [key: string]: unknown;
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
    if (hour < 12) {
        return 'Good morning';
    }
    if (hour < 17) {
        return 'Good afternoon';
    }

    return 'Good evening';
}

/** e.g. "1:30 PM" - compact clock time for toast chrome */
function formatToastTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function performanceTier(status?: string): { label: string; tone: string } {
    if (status === 'active') {
        return { label: 'Growth', tone: 'bg-violet-500/15 text-violet-200 ring-violet-400/25' };
    }

    return { label: 'Starter', tone: 'bg-white/[0.06] text-slate-300 ring-white/10' };
}

const SIDEBAR_W = 256;
const SIDEBAR_COLLAPSED = 76;

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
    const [toastTitle, setToastTitle] = useState<string | undefined>(undefined);
    const [toastTime, setToastTime] = useState<string | undefined>(undefined);
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
    const tier = performanceTier(partnerContext?.status);
    const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_W;
    const isVerified = partnerContext?.status === 'active';

    useEffect(() => {
        if (flash?.success) {
            setToastTitle(undefined);
            setToastTime(formatToastTime(new Date()));
            setToastMessage(flash.success);
            setToastType('success');
            setShowToast(true);
        } else if (flash?.error) {
            setToastTitle(undefined);
            setToastTime(formatToastTime(new Date()));
            setToastMessage(flash.error);
            setToastType('error');
            setShowToast(true);
        }
    }, [flash]);

    useEffect(() => {
        if (!user?.id || !window.Echo) {
            return;
        }

        // Laravel notification broadcasts land on PrivateChannel App.Models.User.{id}
        // (Notifiable default - matches routes/channels.php authorization).
        const channelName = `App.Models.User.${user.id}`;
        const channel = window.Echo.private(channelName);

        channel.notification((notification: { title?: string; body?: string; message?: string; type?: string; severity?: string; url?: string }) => {
            const message = notification.body || notification.message || notification.title || 'You have a new update.';
            const severity = notification.severity || notification.type;
            const typeName = typeof notification.type === 'string' ? notification.type : '';
            const isRejection = typeName.includes('EstateRequestRejected');
            const isAcceptance = typeName.includes('EstateRequestAccepted');
            const isDanger = severity === 'danger' || severity === 'error' || isRejection;

            setToastTitle(notification.title || (isRejection ? 'Estate request rejected' : isAcceptance ? 'Estate request accepted' : undefined));
            setToastTime(formatToastTime(new Date()));
            setToastMessage(message);
            setToastType(isDanger ? 'error' : 'success');
            setShowToast(true);

            // Refresh unread badge + dropdown listing without a full navigation.
            // Also refresh My Estates list when a pipeline status change is broadcast.
            const only = ['partnerUnreadCount', 'partnerNotifications', 'auth'];
            if (window.location.pathname.startsWith('/partner/partner-requests')) {
                only.push('partnerRequests', 'columns', 'commission', 'filters');
            }

            router.reload({
                only,
                preserveScroll: true,
                preserveState: true,
            });
        });

        return () => {
            window.Echo.leave(channelName);
        };
    }, [user?.id]);

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
                className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] font-medium transition-colors duration-200 ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-100'
                } ${!showLabel ? 'justify-center px-0' : ''}`}
            >
                {active && (
                    <motion.span
                        layoutId="partnerSidebarActive"
                        className="absolute inset-0 rounded-xl bg-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        aria-hidden
                    />
                )}
                {!active && (
                    <span
                        className="absolute inset-0 rounded-xl bg-white/[0.0] transition-colors duration-200 group-hover:bg-white/[0.045]"
                        aria-hidden
                    />
                )}
                {active && (
                    <motion.span
                        layoutId="partnerSidebarRail"
                        className="absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-linear-to-b from-sky-300 to-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.55)]"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                        aria-hidden
                    />
                )}
                <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                        active ? 'bg-white/[0.08] text-sky-300' : 'text-slate-500 group-hover:bg-white/[0.04] group-hover:text-slate-300'
                    }`}
                >
                    <item.icon className="h-[17px] w-[17px]" />
                </span>
                {showLabel && <span className="relative z-10 truncate tracking-tight">{item.name}</span>}
            </Link>
        );
    }

    function NavSection({ label, items, showLabel }: { label: string; items: NavItem[]; showLabel: boolean }) {
        return (
            <div className="space-y-0.5">
                {showLabel && <p className="px-2.5 pt-0.5 pb-1.5 text-[10px] font-semibold tracking-[0.16em] text-slate-500/90 uppercase">{label}</p>}
                {items.map((item) => renderNavLink(item, { showLabel }))}
            </div>
        );
    }

    const contentMax = fullWidth ? 'max-w-[1400px]' : 'max-w-6xl';

    const profileCard = !isCollapsed ? (
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.045] p-3 ring-1 ring-white/[0.07]">
            <div className="pointer-events-none absolute -top-8 -right-6 h-20 w-20 rounded-full bg-blue-500/15 blur-2xl" aria-hidden />
            <div className="relative flex items-start gap-2.5">
                <div className="relative shrink-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[0.8rem] bg-linear-to-br from-blue-500 via-blue-600 to-indigo-600 text-[11px] font-bold tracking-wide text-white shadow-lg ring-1 shadow-blue-900/40 ring-white/15">
                        {initials}
                    </div>
                    <span
                        className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)] ring-2 ring-[#0b0f15]"
                        title="Online"
                    />
                </div>
                <div className="min-w-0 flex-1 pt-px">
                    <p className="truncate text-[13px] font-semibold tracking-tight text-white">{partnerName}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                        {isVerified ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                                Verified
                            </span>
                        ) : (
                            <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300 capitalize ring-1 ring-amber-400/20">
                                {partnerContext?.status ?? 'Partner'}
                            </span>
                        )}
                        <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1 ${tier.tone}`}>{tier.label}</span>
                    </div>
                    {partnerContext?.commission_rate && (
                        <p className="mt-2 text-[11px] leading-none text-slate-400">
                            Commission{' '}
                            <span className="font-semibold text-slate-100 tabular-nums">
                                {formatCommission(partnerContext.commission_rate, partnerContext.commission_type)}
                            </span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    ) : (
        <div className="flex justify-center">
            <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white shadow-md shadow-blue-900/40">
                    {initials}
                </div>
                <span className="absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0b0f15]" />
            </div>
        </div>
    );

    const bottomActions = (collapsed: boolean) => (
        <div className={`space-y-2 ${collapsed ? 'px-2 py-2.5' : 'px-3 py-3'}`}>
            <Link
                href="/partner/partner-requests/create"
                className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-linear-to-r from-blue-600 via-blue-600 to-indigo-600 font-semibold text-white shadow-[0_8px_24px_-6px_rgba(37,99,235,0.55)] transition duration-200 hover:from-blue-500 hover:via-blue-500 hover:to-indigo-500 hover:shadow-[0_12px_28px_-6px_rgba(37,99,235,0.65)] active:scale-[0.98] ${
                    collapsed ? 'h-10 w-full' : 'px-3 py-2.5 text-[13px]'
                }`}
                aria-label="Submit new estate"
            >
                <span className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/20 to-transparent opacity-60" aria-hidden />
                <span
                    className="pointer-events-none absolute -inset-x-4 -top-8 h-12 bg-white/20 opacity-0 blur-xl transition duration-500 group-hover:opacity-100"
                    aria-hidden
                />
                <PlusIcon className="relative h-4 w-4 shrink-0" />
                {!collapsed && <span className="relative tracking-tight">Submit estate</span>}
            </Link>
            <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className={`group flex w-full items-center justify-center gap-2 rounded-xl text-[12px] font-medium text-slate-500 transition duration-200 hover:bg-rose-500/[0.08] hover:text-rose-300 ${
                    collapsed ? 'h-9' : 'px-3 py-2'
                }`}
            >
                <ArrowLeftStartOnRectangleIcon className="h-4 w-4 shrink-0 transition group-hover:-translate-x-0.5" />
                {!collapsed && <span>Log out</span>}
            </button>
        </div>
    );

    return (
        <AnimatedLayout>
            <div className="flex min-h-screen bg-[#f3f2ee] transition-colors duration-300 dark:bg-[#06080c]">
                {/* Sidebar */}
                <motion.aside
                    initial={false}
                    animate={{ width: sidebarWidth }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                    className="fixed inset-y-0 left-0 z-40 hidden flex-col bg-[#0b0f15] lg:flex"
                    aria-label="Partner sidebar"
                >
                    <div
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_-10%,rgba(59,130,246,0.14),transparent_55%)]"
                        aria-hidden
                    />
                    <div
                        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-linear-to-b from-white/12 via-white/[0.05] to-transparent"
                        aria-hidden
                    />

                    {/* Brand */}
                    <div className="relative z-10 flex h-14 items-center justify-between gap-2 px-3.5">
                        {!isCollapsed ? (
                            <Link href="/partner/dashboard" className="flex min-w-0 flex-1 items-center" aria-label="Kontrol Partner">
                                <img
                                    src="/assets/images/kontrol-white-logo-new.png"
                                    alt="Kontrol"
                                    className="h-8 w-auto max-w-[148px] object-contain object-left drop-shadow-[0_1px_8px_rgba(255,255,255,0.12)]"
                                />
                            </Link>
                        ) : (
                            <Link href="/partner/dashboard" className="flex flex-1 justify-center" aria-label="Kontrol Partner">
                                <img
                                    src="/assets/images/kontrol-icon-white.png"
                                    alt="Kontrol"
                                    className="h-9 w-9 object-contain drop-shadow-[0_2px_8px_rgba(59,130,246,0.35)]"
                                />
                            </Link>
                        )}
                        <button
                            type="button"
                            onClick={toggle}
                            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
                        >
                            {isCollapsed ? <ChevronDoubleRightIcon className="h-3.5 w-3.5" /> : <ChevronDoubleLeftIcon className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* Profile card */}
                    <div className={`relative z-10 ${isCollapsed ? 'px-2 pb-2' : 'px-3 pb-2.5'}`}>{profileCard}</div>

                    {/* Navigation */}
                    <nav
                        className={`relative z-10 flex-1 overflow-y-auto pb-2 ${isCollapsed ? 'space-y-3 px-2' : 'space-y-3.5 px-2.5'}`}
                        aria-label="Primary"
                    >
                        <NavSection label="Grow" items={workspaceNav} showLabel={!isCollapsed} />
                        <div className={`${isCollapsed ? 'mx-2' : 'mx-2.5'} h-px bg-linear-to-r from-transparent via-white/[0.08] to-transparent`} />
                        <NavSection label="Account" items={accountNav} showLabel={!isCollapsed} />
                    </nav>

                    {/* Bottom CTA + logout */}
                    <div className="relative z-10 mt-auto border-t border-white/[0.06]">{bottomActions(isCollapsed)}</div>
                </motion.aside>

                {/* Mobile drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[60] bg-stone-950/60 backdrop-blur-sm lg:hidden"
                                onClick={() => setMobileMenuOpen(false)}
                                aria-hidden
                            />
                            <motion.aside
                                initial={{ x: '-100%' }}
                                animate={{ x: 0 }}
                                exit={{ x: '-100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 340 }}
                                className="pt-safe pb-safe fixed inset-y-0 left-0 z-[70] flex w-[280px] flex-col bg-[#0b0f15] shadow-2xl lg:hidden"
                                aria-label="Partner menu"
                            >
                                <div className="flex h-[52px] items-center justify-between px-4">
                                    <span className="text-[13px] font-semibold tracking-tight text-white">Menu</span>
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(false)}
                                        aria-label="Close menu"
                                        className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
                                    >
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="px-3 pb-3">{profileCard}</div>
                                <nav className="flex-1 space-y-3.5 overflow-y-auto px-2.5">
                                    <NavSection label="Grow" items={workspaceNav} showLabel />
                                    <div className="mx-2.5 h-px bg-linear-to-r from-transparent via-white/[0.08] to-transparent" />
                                    <NavSection label="Account" items={accountNav} showLabel />
                                </nav>
                                <div className="border-t border-white/[0.06]">{bottomActions(false)}</div>
                            </motion.aside>
                        </>
                    )}
                </AnimatePresence>

                {/* Main column - marginLeft only on lg+ via class + media query */}
                <div
                    className="partner-shell-main flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out"
                    style={{ marginLeft: sidebarWidth }}
                >
                    <header className="sticky top-0 z-30">
                        <div className="pt-safe relative border-b border-stone-900/[0.04] bg-white/60 backdrop-blur-2xl dark:border-white/[0.05] dark:bg-slate-950/55">
                            <div
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-stone-300/45 to-transparent dark:via-white/10"
                                aria-hidden
                            />
                            <div className={`mx-auto flex h-14 items-center justify-between gap-3 px-4 sm:h-[3.75rem] sm:px-6 ${contentMax}`}>
                                <div className="flex min-w-0 items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setMobileMenuOpen(true)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900/[0.04] text-stone-600 ring-1 ring-stone-900/[0.04] transition hover:bg-stone-900/[0.07] lg:hidden dark:bg-white/[0.06] dark:text-slate-300 dark:ring-white/10"
                                        aria-label="Open menu"
                                    >
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                                            <path d="M3 12h18M3 6h18M3 18h18" />
                                        </svg>
                                    </button>
                                    <div className="min-w-0">
                                        <p className="truncate text-[11px] font-medium tracking-wide text-stone-400 dark:text-slate-500">
                                            {getGreeting()}
                                        </p>
                                        <div className="flex min-w-0 items-center gap-2">
                                            <p className="truncate text-[15px] font-semibold tracking-tight text-stone-900 dark:text-white">
                                                {partnerName}
                                            </p>
                                            {isVerified && (
                                                <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/15 sm:inline-flex dark:text-emerald-300">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <Link
                                        href="/partner/partner-requests/create"
                                        className="group relative hidden items-center gap-1.5 overflow-hidden rounded-full bg-stone-900 px-4 py-2 text-[12px] font-semibold text-white shadow-lg shadow-stone-900/15 transition hover:bg-stone-800 sm:inline-flex dark:bg-white dark:text-stone-900 dark:shadow-white/10 dark:hover:bg-stone-100"
                                    >
                                        <PlusIcon className="relative h-3.5 w-3.5 transition duration-300 group-hover:rotate-90" />
                                        <span className="relative">Submit estate</span>
                                    </Link>
                                    <div className="flex items-center gap-0.5 rounded-full bg-stone-900/[0.03] p-1 ring-1 ring-stone-900/[0.05] dark:bg-white/[0.04] dark:ring-white/10">
                                        <button
                                            type="button"
                                            onClick={toggleTheme}
                                            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-500 transition hover:bg-white hover:text-stone-800 hover:shadow-sm dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                                        >
                                            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                                        </button>
                                        <NotificationDropdown unreadCount={unread} />
                                        <Link
                                            href="/partner/profile"
                                            className="group relative ml-0.5 flex items-center rounded-full py-0.5 pr-1 pl-0.5 transition hover:bg-white/80 dark:hover:bg-white/10"
                                            aria-label="Open account"
                                        >
                                            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-indigo-600 text-[11px] font-bold text-white shadow-md ring-2 shadow-blue-600/25 ring-white dark:ring-slate-900">
                                                {initials}
                                                {isVerified && (
                                                    <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
                                                )}
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 pb-[calc(7rem+var(--safe-area-inset-bottom))] lg:pb-8">
                        <motion.div
                            key={currentPath}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className={`mx-auto px-4 py-5 sm:px-6 sm:py-6 ${contentMax}`}
                        >
                            {children}
                        </motion.div>
                    </main>
                </div>

                <style>{`
                    @media (max-width: 1023px) {
                        .partner-shell-main {
                            margin-left: 0 !important;
                        }
                    }
                `}</style>

                <MobileBottomNav url={currentPath} />

                {showToast && (
                    <Toast
                        show={showToast}
                        title={toastTitle}
                        time={toastTime}
                        message={toastMessage}
                        type={toastType}
                        onClose={() => setShowToast(false)}
                    />
                )}
            </div>
        </AnimatedLayout>
    );
}
