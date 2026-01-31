import { Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import AnimatedLayout from '@/layouts/AnimatedLayout';

interface Props {
    children: ReactNode;
    title?: string;
    backUrl?: string; // If provided, shows "Back to Dashboard" button
}

export default function ZeusLayout({ children, title, backUrl }: Props) {
    function handleLogout() {
        router.post('/zeus/logout');
    }

    return (
        <AnimatedLayout>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <motion.header
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="border-b border-gray-200 bg-white"
                >
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="flex h-16 items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Logo with corrected cropping and no text */}
                                <Link href="/zeus/dashboard">
                                    <div className="h-10 w-52 overflow-hidden">
                                        <img src="/assets/images/kontrol.png" alt="Kontrol" className="w-full -translate-y-12" />
                                    </div>
                                </Link>
                            </div>

                            {/* Header Action: Back or Logout */}
                            {backUrl ? (
                                <Link
                                    href={backUrl}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Back to Dashboard
                                </Link>
                            ) : (
                                <button
                                    onClick={handleLogout}
                                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    </div>
                </motion.header>

                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
            </div>
        </AnimatedLayout>
    );
}
