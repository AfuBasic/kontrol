import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';

interface Props {
    children: ReactNode;
}

export default function PublicLayout({ children }: Props) {
    const currentYear = new Date().getFullYear();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme as 'light' | 'dark');
        applyTheme(storedTheme);
    }, []);

    const applyTheme = (newTheme: string) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    const handleNavClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
            {/* Navigation */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="fixed top-0 right-0 left-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/80"
            >
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9" />
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Kontrol</span>
                    </Link>

                    {/* Center Navigation - Desktop */}
                    <div className="hidden items-center gap-8 md:flex">
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        >
                            Home
                        </Link>
                        <a
                            href="#features"
                            onClick={(e) => {
                                if (window.location.pathname === '/') {
                                    e.preventDefault();
                                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        >
                            Features
                        </a>
                        <a
                            href="#pricing"
                            onClick={(e) => {
                                if (window.location.pathname === '/') {
                                    e.preventDefault();
                                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        >
                            Pricing
                        </a>
                        <Link
                            href="/support"
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        >
                            Support
                        </Link>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>
                        <a
                            href={LoginController.show.url()}
                            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:inline-block"
                        >
                            Sign In
                        </a>
                        <Link
                            href="/apply"
                            className="hidden rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 sm:inline-block"
                        >
                            Apply Now
                        </Link>
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg p-2 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="border-t border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden"
                    >
                        <div className="mx-auto flex max-w-7xl flex-col space-y-2 px-6 py-4">
                            <Link
                                href="/"
                                onClick={handleNavClick}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Home
                            </Link>
                            <a
                                href="#features"
                                onClick={(e) => {
                                    handleNavClick();
                                    if (window.location.pathname === '/') {
                                        e.preventDefault();
                                        document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Features
                            </a>
                            <a
                                href="#pricing"
                                onClick={(e) => {
                                    handleNavClick();
                                    if (window.location.pathname === '/') {
                                        e.preventDefault();
                                        document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Pricing
                            </a>
                            <Link
                                href="/support"
                                onClick={handleNavClick}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Support
                            </Link>
                            <a
                                href={LoginController.show.url()}
                                onClick={handleNavClick}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Sign In
                            </a>
                            <Link
                                href="/apply"
                                onClick={handleNavClick}
                                className="mt-4 block rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                            >
                                Apply Now
                            </Link>
                        </div>
                    </motion.div>
                )}
            </motion.header>

            {/* Main Content */}
            <main className="pt-16">{children}</main>

            {/* Footer */}
            <footer className="border-t border-slate-100 bg-slate-50 transition-colors duration-300 dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
                    <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                        <div className="flex items-center gap-2">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-8" />
                            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Kontrol</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
                            <a href="mailto:support@usekontrol.com" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                                support@usekontrol.com
                            </a>
                            <a 
                                href="https://wa.me/2347036481189" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-[#25D366] dark:text-slate-400"
                            >
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.031 0C5.385 0 .002 5.385.002 12.032c0 2.124.553 4.195 1.603 6.015L.053 24l6.141-1.611a12.035 12.035 0 005.837 1.503c6.645 0 12.029-5.385 12.029-12.033C24.06 5.385 18.675 0 12.031 0zm0 22.016c-1.8 0-3.56-.484-5.11-1.403l-.366-.217-3.799.996.996-3.799-.217-.366A9.988 9.988 0 012.017 12.03c0-5.526 4.498-10.025 10.024-10.025 5.527 0 10.025 4.499 10.025 10.025 0 5.527-4.498 10.025-10.025 10.025zm5.508-7.514c-.302-.151-1.787-.881-2.064-.982-.277-.101-.478-.151-.679.151-.201.302-.781.982-.958 1.183-.176.201-.353.226-.655.075-.302-.151-1.275-.471-2.428-1.503-.896-.803-1.501-1.796-1.678-2.098-.176-.302-.019-.465.132-.616.136-.136.302-.353.453-.529.151-.176.201-.302.302-.503.101-.201.05-.378-.025-.529-.075-.151-.679-1.637-.931-2.241-.245-.589-.494-.509-.679-.518-.176-.008-.378-.008-.579-.008-.201 0-.529.075-.805.378-.277.302-1.057 1.032-1.057 2.517 0 1.485 1.082 2.92 1.233 3.121.151.201 2.128 3.248 5.155 4.555.719.31 1.28.495 1.718.634.721.229 1.378.196 1.896.119.58-.087 1.787-.73 2.039-1.436.252-.705.252-1.309.176-1.436-.075-.127-.277-.202-.579-.353z" />
                                </svg>
                                WhatsApp
                            </a>
                            <Link href="/privacy" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                                Privacy
                            </Link>
                            <Link href="/terms" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200">
                                Terms
                            </Link>
                        </div>

                        <p className="text-sm text-slate-400 dark:text-slate-500">&copy; {currentYear} Kontrol. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
