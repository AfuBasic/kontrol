import {
    AdjustmentsHorizontalIcon,
    ArrowLeftStartOnRectangleIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    Cog6ToothIcon,
    CurrencyDollarIcon,
    Squares2X2Icon,
    SparklesIcon,
    UsersIcon,
    XMarkIcon,
    HandRaisedIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import Toast from '@/Components/Toast';
import usePathFromUrl from '@/Hooks/usePathFromUrl';
import { useSidebarState } from '@/Hooks/useSidebarState';
import AnimatedLayout from '@/Layouts/AnimatedLayout';

interface Props {
    children: ReactNode;
    backUrl?: string;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/zeus/dashboard', icon: Squares2X2Icon },
    { name: 'Plans', href: '/zeus/plans', icon: CurrencyDollarIcon },
    { name: 'Subscriptions', href: '/zeus/subscriptions', icon: UsersIcon },
    { name: 'Features', href: '/zeus/features', icon: SparklesIcon },
    { name: 'Referrers', href: '/zeus/referrers', icon: HandRaisedIcon },
    { name: 'Billing', href: '/zeus/billing', icon: Cog6ToothIcon },
    { name: 'Transactions', href: '/zeus/transactions', icon: CurrencyDollarIcon },
    { name: 'Estates', href: '/zeus/estates', icon: AdjustmentsHorizontalIcon },
];

export default function ZeusLayout({ children, backUrl }: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>().props;
    const { url: fullUrl } = usePage();
    const url = fullUrl.split('?')[0];
    const { isCollapsed, toggle } = useSidebarState();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error'>('success');

    const currentPath = usePathFromUrl(url);

    // Show toast on flash messages
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

    function handleLogout() {
        router.post('/zeus/logout');
    }

    function isActive(href: string): boolean {
        return currentPath === href || currentPath.startsWith(href + '/');
    }

    return (
        <AnimatedLayout>
            <div className="flex min-h-screen bg-white">
                {/* Sidebar */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} zeus-grain fixed inset-y-0 left-0 z-40 flex flex-col border-r border-white/5 bg-[#0a0e17] transition-all duration-300 lg:translate-x-0 ${
                        isCollapsed ? 'w-20' : 'w-64'
                    } lg:relative`}
                >
                    {/* Subtle gradient overlay for depth */}
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/2 to-transparent" />

                    {/* Sidebar Header */}
                    <div className="relative z-10 flex h-20 items-center justify-between border-b border-white/5 px-6">
                        {!isCollapsed && (
                            <Link href="/zeus/dashboard" className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 shadow-lg shadow-blue-900/20">
                                    <span className="text-lg font-bold text-white">Z</span>
                                </div>
                                <span className="text-sm font-bold tracking-tight text-white uppercase">Zeus Admin</span>
                            </Link>
                        )}
                        <button
                            onClick={toggle}
                            className="rounded-md p-1.5 text-slate-500 transition-all hover:bg-white/5 hover:text-white lg:inline-flex"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? <ChevronDoubleRightIcon className="h-4 w-4" /> : <ChevronDoubleLeftIcon className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="relative z-10 flex-1 space-y-0.5 overflow-y-auto px-3 py-6">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <div key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${
                                            active ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                        }`}
                                    >
                                        <item.icon
                                            className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                                                active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                                            }`}
                                        />
                                        {!isCollapsed && <span>{item.name}</span>}
                                        {active && <motion.div layoutId="activeNav" className="absolute left-0 h-4 w-0.5 rounded-full bg-blue-500" />}
                                    </Link>
                                </div>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer - Logout */}
                    <div className="relative z-10 border-t border-white/5 p-4">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
                        >
                            <ArrowLeftStartOnRectangleIcon className="h-4.5 w-4.5 shrink-0" />
                            {!isCollapsed && <span>Sign Out</span>}
                        </button>
                    </div>
                </motion.aside>

                {/* Mobile Menu Overlay */}
                {mobileMenuOpen && (
                    <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
                )}

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="fixed top-4 left-4 z-50 inline-flex rounded-lg bg-primary-950 p-2 text-white hover:bg-primary-900 lg:hidden"
                >
                    {mobileMenuOpen ? (
                        <XMarkIcon className="h-6 w-6" />
                    ) : (
                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    )}
                </button>

                {/* Main Content */}
                <main className="flex-1">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
                    >
                        {children}
                    </motion.div>
                </main>

                {/* Toast */}
                <Toast show={showToast} message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />
            </div>
        </AnimatedLayout>
    );
}
