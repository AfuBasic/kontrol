import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export default function PublicLayout({ children }: Props) {
    const currentYear = new Date().getFullYear();

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 right-0 left-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl"
            >
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9" />
                        <span className="text-xl font-bold text-slate-900">Kontrol</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href={LoginController.show.url()}
                            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-slate-900/20"
                        >
                            Open App
                        </Link>
                    </div>
                </nav>
            </motion.header>

            {/* Main Content */}
            <main className="pt-16">{children}</main>

            {/* Footer */}
            <footer className="border-t border-slate-100 bg-slate-50">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-8" />
                            <span className="text-lg font-bold text-slate-900">Kontrol</span>
                        </div>

                        <div className="flex items-center gap-8">
                            <Link href="/privacy" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-sm text-slate-500 transition-colors hover:text-slate-900">
                                Terms of Service
                            </Link>
                        </div>

                        <p className="text-sm text-slate-400">&copy; {currentYear} Kontrol. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
