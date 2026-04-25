import { Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Home, Users, LayoutGrid, User, Plus } from 'lucide-react';
import { ReactNode, useState } from 'react';
import type { SharedData } from '@/Types';
import PullToRefresh from '@/Components/PullToRefresh';
import { useForceLogout } from '@/Hooks/useForceLogout';
import usePathFromUrl from '@/Hooks/usePathFromUrl';
import CreateCodeBottomSheet from '@/Components/Resident/CreateCodeBottomSheet';

interface Props {
    children: ReactNode;
    hideHeader?: boolean;
    hideNav?: boolean;
    className?: string;
}

export default function ResidentLayout({ children, hideHeader = false, hideNav = false, className }: Props) {
    const { auth } = usePage<SharedData>().props;
    const currentPath = usePage().url;

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Force logout if account is disabled
    useForceLogout(auth?.user?.id);

    const navItems = [
        { name: 'Dashboard', href: '/resident/home', icon: (active: boolean) => <Home className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
        { name: 'Visitors', href: '/resident/visitors', icon: (active: boolean) => <Users className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
        { name: 'CREATE_CODE', href: '#', icon: () => null },
        { name: 'Hub', href: '/resident/household', icon: (active: boolean) => <LayoutGrid className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
        { name: 'Profile', href: '/resident/profile', icon: (active: boolean) => <User className={`h-6 w-6 ${active ? 'fill-current' : ''}`} /> },
    ];

    return (
        <PullToRefresh>
            <div className={`flex min-h-screen flex-col bg-slate-50 ${className || ''}`}>
                {/* Header - Conditional Light Premium Header */}
                {!hideHeader && (
                    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-md">
                        <div className="mx-auto max-w-lg px-6">
                            <div className="flex h-16 items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                                    <span className="text-xl font-black tracking-tight text-slate-900">Kontrol</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Link 
                                        href="/resident/activity"
                                        className="relative rounded-2xl bg-slate-100 p-2 text-slate-500 transition-all hover:bg-slate-200"
                                    >
                                        <Bell className="h-5 w-5" />
                                        {(auth?.user?.unread_notifications_count ?? 0) > 0 && (
                                            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-2 ring-white">
                                                {auth?.user?.unread_notifications_count}
                                            </span>
                                        )}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </header>
                )}

                {/* Main Content */}
                <main className="relative mx-auto w-full max-w-lg flex-1 px-6 py-8">{children}</main>

                {/* Bottom Navigation - Refined Glass Design */}
                {!hideNav && (
                    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 px-6">
                        <motion.nav
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto mx-auto max-w-sm overflow-visible rounded-[32px] bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-1 ring-black/[0.05] backdrop-blur-2xl"
                        >
                            <div className="flex items-center justify-between px-3 py-2">
                                {navItems.map((item, index) => {
                                    if (item.name === 'CREATE_CODE') {
                                        return (
                                            <div key="fab" className="relative flex flex-1 justify-center">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setCreateModalOpen(true)}
                                                    className="absolute -top-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl ring-4 shadow-slate-900/20 ring-white"
                                                >
                                                    <Plus className="h-7 w-7" strokeWidth={3} />
                                                </motion.button>
                                            </div>
                                        );
                                    }

                                    const isActive =
                                        currentPath === usePathFromUrl(item.href) || currentPath.startsWith(usePathFromUrl(item.href) + '/');

                                    return (
                                        <Link key={item.name} href={item.href} className="group relative flex flex-1 flex-col items-center gap-1">
                                            <div
                                                className={`rounded-xl p-2.5 transition-all ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}
                                            >
                                                {item.icon(isActive)}
                                            </div>
                                            {isActive && (
                                                <motion.div
                                                    layoutId="navIndicator"
                                                    className="absolute bottom-0 h-1 w-1 rounded-full bg-indigo-600"
                                                />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.nav>
                    </div>
                )}

                {/* Code Creation Sheet */}
                <CreateCodeBottomSheet isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />

                {/* Toast Notification */}
                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: 100 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 100 }}
                            className="fixed bottom-32 left-1/2 z-50 w-full max-w-xs -translate-x-1/2 px-4"
                        >
                            <div className="flex items-center gap-3 rounded-2xl bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-100 backdrop-blur-xl">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <p className="text-sm font-bold">{toastMessage}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PullToRefresh>
    );
}
