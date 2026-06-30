import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import LoginController from '@/actions/App/Http/Controllers/Auth/LoginController';
import ThemeToggleIcon from '@/Components/Public/ThemeToggleIcon';
import BrandPreloader from '@/Components/Public/BrandPreloader';

interface Props {
    children: ReactNode;
}

export default function PublicLayout({ children }: Props) {
    const currentYear = new Date().getFullYear();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    const [scrolled, setScrolled] = useState(false);
    const [activeSection, setActiveSection] = useState(() => {
        return typeof window !== 'undefined' && window.location.pathname === '/' ? 'home' : '';
    });
    const [isLoading, setIsLoading] = useState(true);
    const [skipPreloader, setSkipPreloader] = useState(false);

    useEffect(() => {
        // Run preloader on every fresh page load of the public website
        delete document.documentElement.dataset.kontrolPublicReady;
        const played = typeof window !== 'undefined' && sessionStorage.getItem('kontrol-preloader-played') === 'true';
        setSkipPreloader(played);
        setIsLoading(true);
    }, []);

    useEffect(() => {
        const storedTheme = localStorage.getItem('theme') || 'dark';
        setTheme(storedTheme as 'light' | 'dark');
        applyTheme(storedTheme);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);

            // Determine active section based on scroll offset
            const sections = ['features', 'pricing', 'download'];
            let current = window.location.pathname === '/' ? 'home' : '';
            for (const section of sections) {
                const el = document.getElementById(section);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    // If section top is above middle of the viewport
                    if (rect.top <= 160) {
                        current = section;
                    }
                }
            }
            setActiveSection(current);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
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
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
        if (nextTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    };

    const handleNavClick = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-50">
            <AnimatePresence
                onExitComplete={() => {
                    document.documentElement.dataset.kontrolPublicReady = 'true';
                    window.dispatchEvent(new Event('kontrol:public-ready'));
                }}
            >
                {isLoading && (
                    <BrandPreloader
                        key="preloader"
                        skipToKontrol={skipPreloader}
                        onComplete={() => {
                            setIsLoading(false);
                            sessionStorage.setItem('kontrol-preloader-played', 'true');
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Navigation */}
            <motion.header
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`fixed top-0 right-0 left-0 z-50 border-b transition-all duration-500 ${
                    scrolled
                        ? 'h-14 border-slate-100 bg-white/70 shadow-lg shadow-slate-950/5 backdrop-blur-xl dark:border-slate-800/40 dark:bg-slate-950/70'
                        : 'h-16 border-transparent bg-transparent'
                }`}
            >
                <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
                    <Link href="/" className="flex shrink-0 items-center gap-2">
                        <img src="/assets/images/icon.png" alt="Kontrol" className="h-9 w-9" />
                        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Kontrol</span>
                    </Link>

                    {/* Center Navigation - Desktop */}
                    <div className="relative hidden items-center gap-8 md:flex">
                        <Link
                            href="/"
                            className={`relative py-1 text-sm font-medium transition-colors ${
                                activeSection === 'home'
                                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            Home
                            {activeSection === 'home' && (
                                <motion.div
                                    layoutId="activeNavIndicator"
                                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                        <a
                            href="/#features"
                            onClick={(e) => {
                                if (window.location.pathname === '/') {
                                    e.preventDefault();
                                    document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className={`relative py-1 text-sm font-medium transition-colors ${
                                activeSection === 'features'
                                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            Features
                            {activeSection === 'features' && (
                                <motion.div
                                    layoutId="activeNavIndicator"
                                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </a>
                        <a
                            href="/#pricing"
                            onClick={(e) => {
                                if (window.location.pathname === '/') {
                                    e.preventDefault();
                                    document.querySelector('#pricing')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className={`relative py-1 text-sm font-medium transition-colors ${
                                activeSection === 'pricing'
                                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            Pricing
                            {activeSection === 'pricing' && (
                                <motion.div
                                    layoutId="activeNavIndicator"
                                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </a>
                        <a
                            href="/#download"
                            onClick={(e) => {
                                if (window.location.pathname === '/') {
                                    e.preventDefault();
                                    document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className={`relative py-1 text-sm font-medium transition-colors ${
                                activeSection === 'download'
                                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            Download App
                            {activeSection === 'download' && (
                                <motion.div
                                    layoutId="activeNavIndicator"
                                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </a>
                        <Link
                            href="/support"
                            className={`relative py-1 text-sm font-medium transition-colors ${
                                window.location.pathname === '/support'
                                    ? 'font-semibold text-blue-600 dark:text-blue-400'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                            }`}
                        >
                            Support
                            {window.location.pathname === '/support' && (
                                <motion.div
                                    layoutId="activeNavIndicator"
                                    className="absolute right-0 bottom-0 left-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </Link>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="rounded-full p-2 text-slate-500 transition-transform duration-200 hover:bg-slate-100 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800"
                            aria-label="Toggle theme"
                        >
                            <ThemeToggleIcon theme={theme} />
                        </button>
                        <a
                            href={LoginController.show.url()}
                            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-block dark:text-slate-300 dark:hover:text-white"
                        >
                            Sign In
                        </a>
                        <Link
                            href="/apply"
                            className="hidden rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 sm:inline-block"
                        >
                            Get Started
                        </Link>
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="rounded-lg p-2 transition-colors hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"
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
                        className="border-t border-slate-100 bg-white md:hidden dark:border-slate-800 dark:bg-slate-950"
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
                                href="/#features"
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
                                href="/#pricing"
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
                            <a
                                href="/#download"
                                onClick={(e) => {
                                    handleNavClick();
                                    if (window.location.pathname === '/') {
                                        e.preventDefault();
                                        document.querySelector('#download')?.scrollIntoView({ behavior: 'smooth' });
                                    }
                                }}
                                className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                Download App
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
                                Get Started
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
                            <Link
                                href="/support"
                                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Support
                            </Link>
                            <Link
                                href="/privacy"
                                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Privacy
                            </Link>
                            <Link
                                href="/terms"
                                className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                Terms
                            </Link>
                        </div>

                        <p className="text-sm text-slate-400 dark:text-slate-500">&copy; {currentYear} Afutunde Solutions. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
