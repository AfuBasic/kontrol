import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import InstallPWABanner from '@/components/InstallPWABanner';

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
}

const navItems = [
    {
        name: 'Home',
        href: '/resident/home',
        icon: (active: boolean) => (
            <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
            </svg>
        ),
    },
    {
        name: 'Visitors',
        href: '/resident/visitors',
        icon: (active: boolean) => (
            <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                />
            </svg>
        ),
    },
    {
        name: 'Activity',
        href: '/resident/activity',
        icon: (active: boolean) => (
            <svg className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        ),
    },
];

export default function ResidentLayout({ children, hideNav = false }: Props) {
    const { auth } = usePage<PageProps>().props;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    function handleLogout() {
        router.post('/logout');
    }

    // Get initials for avatar
    const initials =
        auth?.user?.name
            ?.split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || '?';

    return (
        <div className="flex min-h-screen flex-col bg-gray-50/50">
            {/* Top Header - Minimal */}
            <motion.header
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur-lg"
            >
                <div className="mx-auto flex h-16 max-w-lg items-center justify-between px-4">
                    <Link href="/resident/home" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-sm">
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                                />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-gray-900">Kontrol</span>
                    </Link>

                    {/* Profile Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                        >
                            {initials}
                        </button>

                        <AnimatePresence>
                            {showProfileMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-xl"
                                    >
                                        <div className="border-b border-gray-100 px-3 py-3">
                                            <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                                            <p className="text-xs text-gray-500">{auth?.user?.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/resident/profile"
                                                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                            >
                                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                                                    />
                                                </svg>
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                                                    />
                                                </svg>
                                                Sign out
                                            </button>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="mx-auto w-full max-w-lg flex-1 px-4 pb-28 pt-6">{children}</main>

            {/* Bottom Navigation - Mobile First */}
            {!hideNav && (
                <motion.nav
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 pb-safe backdrop-blur-lg"
                >
                    <div className="mx-auto max-w-lg">
                        <div className="flex items-center justify-around py-2">
                            {navItems.map((item) => {
                                const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                                return (
                                    <Link key={item.name} href={item.href} className="group flex flex-col items-center gap-1 px-6 py-2">
                                        <div className={`rounded-xl p-2 transition-all ${isActive ? 'bg-indigo-50' : 'group-hover:bg-gray-50'}`}>
                                            {item.icon(isActive)}
                                        </div>
                                        <span className={`text-xs font-medium ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </motion.nav>
            )}

            {/* PWA Install Banner */}
            <InstallPWABanner />
        </div>
    );
}
