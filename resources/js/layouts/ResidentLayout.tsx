import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useState } from 'react';
import { Home, Users, Activity, User, LogOut, Shield } from 'lucide-react';
import InstallPWABanner from '@/components/InstallPWABanner';
import HomeController from '@/actions/App/Http/Controllers/Resident/HomeController';
import AccessCodeController from '@/actions/App/Http/Controllers/Resident/AccessCodeController';
import ActivityController from '@/actions/App/Http/Controllers/Resident/ActivityController';
import EstateBoardController from '@/actions/App/Http/Controllers/Resident/EstateBoardController';

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
    [key: string]: unknown;
}

const navItems = [
    {
        name: 'Home',
        href: HomeController.url(),
        icon: (active: boolean) => <Home className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`} strokeWidth={1.5} />,
    },
    {
        name: 'Visitors',
        href: AccessCodeController.index.url(),
        icon: (active: boolean) => <Users className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`} strokeWidth={1.5} />,
    },
    {
        name: 'Activity',
        href: ActivityController.url(),
        icon: (active: boolean) => <Activity className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`} strokeWidth={1.5} />,
    },
    {
        name: 'Feed',
        href: EstateBoardController.index.url(),
        icon: (active: boolean) => (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-gray-400'}`}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z"
                />
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
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9 object-contain" />
                        <span className="text-lg font-semibold text-gray-900">Kontrol</span>
                    </Link>

                    {/* Profile Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-600 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
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
                                                <User className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                                                Profile
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                                            >
                                                <LogOut className="h-5 w-5" strokeWidth={1.5} />
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
            <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-6 pb-28">{children}</main>

            {/* Bottom Navigation - Mobile First */}
            {!hideNav && (
                <motion.nav
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur-lg"
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
