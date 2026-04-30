import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useState } from 'react';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';

function smoothScrollTo(selector: string) {
    const element = document.querySelector(selector);
    if (!element) return;

    const target = element.getBoundingClientRect().top + window.scrollY;
    const start = window.scrollY;
    const distance = target - start - 80; // Account for header height
    const duration = 1000;
    let startTime: number | null = null;

    function easeInOutCubic(t: number): number {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function scroll(currentTime: number) {
        if (startTime === null) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = easeInOutCubic(progress);

        window.scrollTo(0, start + distance * ease);

        if (progress < 1) {
            requestAnimationFrame(scroll);
        }
    }

    requestAnimationFrame(scroll);
}

interface Props {
    children: ReactNode;
    onApplyClick?: () => void;
}

export default function PublicLayout({ children, onApplyClick }: Props) {
    const currentYear = new Date().getFullYear();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleNavClick = () => {
        setMobileMenuOpen(false);
    };

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
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9" />
                        <span className="text-xl font-bold text-slate-900">Kontrol</span>
                    </Link>

                    {/* Center Navigation - Desktop */}
                    <div className="hidden items-center gap-0.5 md:flex">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                smoothScrollTo('#features');
                            }}
                            className="px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                        >
                            Features
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                smoothScrollTo('#pricing');
                            }}
                            className="px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                        >
                            Pricing
                        </button>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                smoothScrollTo('#security');
                            }}
                            className="px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                        >
                            Security
                        </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <a
                            href={LoginController.show.url()}
                            className="hidden px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-block"
                        >
                            Sign In
                        </a>
                        {onApplyClick && (
                            <button
                                onClick={onApplyClick}
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/10 transition-all hover:bg-slate-800 hover:shadow-slate-900/20"
                            >
                                Apply Now
                            </button>
                        )}
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg p-2 transition-colors hover:bg-slate-100 md:hidden"
                        >
                            <svg className="h-6 w-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </nav>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 bg-white md:hidden"
                    >
                        <div className="mx-auto max-w-7xl space-y-2 px-6 py-4">
                            <button
                                onClick={() => {
                                    smoothScrollTo('#features');
                                    handleNavClick();
                                }}
                                className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                                Features
                            </button>
                            <button
                                onClick={() => {
                                    smoothScrollTo('#pricing');
                                    handleNavClick();
                                }}
                                className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                                Pricing
                            </button>
                            <button
                                onClick={() => {
                                    smoothScrollTo('#security');
                                    handleNavClick();
                                }}
                                className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                            >
                                Security
                            </button>
                            <a
                                href={LoginController.show.url()}
                                onClick={handleNavClick}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:hidden"
                            >
                                Sign In
                            </a>
                        </div>
                    </motion.div>
                )}
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
