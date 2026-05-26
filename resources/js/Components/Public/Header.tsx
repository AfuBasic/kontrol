import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface HeaderProps {
    hideCta?: boolean;
    activePage?: 'home' | 'residents' | 'estates';
}

export default function Header({ hideCta = false, activePage }: HeaderProps) {
    const { app_subdomain_url } = usePage().props as unknown as { app_subdomain_url?: string };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        const currentTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
        setTheme(currentTheme);
    }, []);

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

    const handleNavClick = (sectionId: string, e: React.MouseEvent) => {
        if (window.location.pathname === '/') {
            e.preventDefault();
            const element = document.getElementById(sectionId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
            setMobileMenuOpen(false);
        }
    };

    return (
        <>
            <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-200 bg-white/70 backdrop-blur-xl dark:border-slate-900 dark:bg-[#020617]/70">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    {/* Brand */}
                    <Link href="/" className="flex cursor-pointer items-center gap-2.5">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="hidden h-8 w-auto dark:block" />
                        <img src="/assets/images/kontrol-logo-horizontal.png" alt="Kontrol" className="block h-8 w-auto dark:hidden" />
                    </Link>

                    {/* Nav Items - Desktop */}
                    <nav className="hidden items-center gap-8 md:flex">
                        <a
                            href="/#features"
                            onClick={(e) => handleNavClick('features', e)}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            Features
                        </a>
                        <a
                            href="/#pricing"
                            onClick={(e) => handleNavClick('pricing', e)}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            Pricing
                        </a>
                        <a
                            href="/#download"
                            onClick={(e) => handleNavClick('download', e)}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                        >
                            Download App
                        </a>

                        <Link
                            href="/product/residents"
                            prefetch
                            className={`text-sm font-medium transition-colors ${activePage === 'residents' ? 'text-[#FF7E67]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            For Residents
                        </Link>
                        <Link
                            href="/product/estates"
                            prefetch
                            className={`text-sm font-medium transition-colors ${activePage === 'estates' ? 'text-[#FF7E67]' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
                        >
                            For Estates
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden items-center gap-4 md:flex">
                        <button
                            onClick={toggleTheme}
                            className="cursor-pointer rounded-lg p-2 text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </button>
                        <a
                            href={app_subdomain_url ? `${app_subdomain_url}/login` : '/login'}
                            className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-100 dark:border-slate-800 dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#1e293b]"
                        >
                            Sign In
                        </a>
                        {!hideCta && (
                            <Link
                                href="/apply"
                                className="rounded-lg bg-[#FF7E67] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-orange-500/10 transition-all hover:bg-[#ff8f7a]"
                            >
                                Get Started
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu trigger & Theme Toggle */}
                    <div className="flex items-center gap-1 md:hidden">
                        <button
                            onClick={toggleTheme}
                            className="cursor-pointer rounded-lg p-2 text-slate-600 transition-all hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'dark' ? <Sun className="h-5.5 w-5.5" /> : <Moon className="h-5.5 w-5.5" />}
                        </button>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            aria-label="Toggle Menu"
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Nav overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-x-0 top-20 z-40 flex flex-col gap-6 border-b border-slate-200 bg-white p-6 md:hidden dark:border-slate-900 dark:bg-[#020617]"
                    >
                        <a
                            href="/#features"
                            onClick={(e) => handleNavClick('features', e)}
                            className="text-left text-base font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Features
                        </a>
                        <a
                            href="/#pricing"
                            onClick={(e) => handleNavClick('pricing', e)}
                            className="text-left text-base font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Pricing
                        </a>
                        <a
                            href="/#download"
                            onClick={(e) => handleNavClick('download', e)}
                            className="text-left text-base font-semibold text-slate-700 dark:text-slate-300"
                        >
                            Download App
                        </a>
                        <hr className="border-slate-100 dark:border-slate-950" />
                        <Link
                            href="/product/residents"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`text-base font-semibold ${activePage === 'residents' ? 'text-[#FF7E67]' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            For Residents
                        </Link>
                        <Link
                            href="/product/estates"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`text-base font-semibold ${activePage === 'estates' ? 'text-[#FF7E67]' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                            For Estates
                        </Link>
                        <hr className="border-slate-100 dark:border-slate-950" />
                        <div className="flex gap-4">
                            <a
                                href={app_subdomain_url ? `${app_subdomain_url}/login` : '/login'}
                                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#0f172a] dark:text-white dark:hover:bg-[#1e293b]"
                            >
                                Sign In
                            </a>
                            {!hideCta && (
                                <Link
                                    href="/apply"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex-1 rounded-xl bg-[#FF7E67] py-3 text-center text-sm font-semibold text-white hover:bg-[#ff8f7a]"
                                >
                                    Get Started
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
