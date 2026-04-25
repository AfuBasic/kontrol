import {
    ArrowLeftStartOnRectangleIcon,
    ChevronDoubleLeftIcon,
    ChevronDoubleRightIcon,
    Cog6ToothIcon,
    LinkIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';
import Toast from '@/Components/Toast';
import { useSidebarState } from '@/Hooks/useSidebarState';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import usePathFromUrl from '@/Hooks/usePathFromUrl';

interface Props {
    children: ReactNode;
}

type NavItem = {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/affiliate/dashboard', icon: Squares2X2Icon },
    { name: 'Settings', href: '/affiliate/settings', icon: Cog6ToothIcon },
];

function Squares2X2Icon(props: { className?: string }) {
    return (
        <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H3v6h6V3zM15 3h-6v6h6V3zM9 15H3v6h6v-6zM15 15h-6v6h6v-6z" />
        </svg>
    );
}

export default function AffiliateLayout({ children }: Props) {
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
        router.post('/logout');
    }

    function isActive(href: string): boolean {
        return currentPath === href || currentPath.startsWith(href + '/');
    }

    return (
        <AnimatedLayout>
            <div className="flex min-h-screen bg-gray-50">
                {/* Sidebar */}
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
                        isCollapsed ? 'w-20' : 'w-64'
                    } lg:relative`}
                >
                    {/* Sidebar Header */}
                    <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
                        {!isCollapsed && (
                            <Link href="/affiliate/dashboard" className="flex-1">
                                <div className="h-8 w-full overflow-hidden">
                                    <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-8" />
                                </div>
                            </Link>
                        )}
                        <button
                            onClick={toggle}
                            className="rounded-lg p-1.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:inline-flex"
                            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {isCollapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
                        {navItems.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                                        active ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5 shrink-0" />
                                    {!isCollapsed && <span>{item.name}</span>}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer - Logout */}
                    <div className="border-t border-gray-200 p-4">
                        <button
                            onClick={handleLogout}
                            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-red-50 hover:text-red-700"
                        >
                            <ArrowLeftStartOnRectangleIcon className="h-5 w-5 shrink-0" />
                            {!isCollapsed && <span>Logout</span>}
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
                    className="fixed top-4 left-4 z-50 inline-flex rounded-lg bg-white p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
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
                {showToast && <Toast message={toastMessage} type={toastType} onClose={() => setShowToast(false)} />}
            </div>
        </AnimatedLayout>
    );
}
