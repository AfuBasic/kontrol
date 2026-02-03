import { Link, router, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import AnimatedLayout from '@/layouts/AnimatedLayout';
import InstallPWABanner from '@/components/InstallPWABanner';

interface Props {
    children: ReactNode;
}

interface PageProps {
    auth: {
        user: {
            name: string;
            email: string;
        };
    };
}

export default function ResidentLayout({ children }: Props) {
    const { auth } = usePage<PageProps>().props;

    function handleLogout() {
        router.post('/logout');
    }

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
                            <div className="flex items-center gap-4">
                                <Link href="/resident/dashboard">
                                    <div className="h-10 w-44 overflow-hidden">
                                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-10" />
                                    </div>
                                </Link>
                                <span className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600">Resident</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden text-right sm:block">
                                    <p className="text-sm font-medium text-gray-900">{auth?.user?.name}</p>
                                    <p className="text-xs text-gray-500">{auth?.user?.email}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>

                {/* PWA Install Banner */}
                <InstallPWABanner />
            </div>
        </AnimatedLayout>
    );
}
