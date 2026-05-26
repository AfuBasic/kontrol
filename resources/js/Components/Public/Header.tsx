import { Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';

interface HeaderProps {
    hideCta?: boolean;
    activePage?: 'home' | 'residents' | 'estates';
}

export default function Header({ hideCta = false, activePage }: HeaderProps) {
    const { app_subdomain_url } = usePage().props as unknown as { app_subdomain_url?: string };
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <header className="fixed top-0 right-0 left-0 z-50 border-b border-slate-900 bg-[#020617]/70 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
                    {/* Brand */}
                    <Link href="/" className="flex cursor-pointer items-center gap-2.5">
                        <img src="/assets/images/kontrol-white-logo-new.png" alt="Kontrol" className="h-8 w-auto" />
                    </Link>

                    {/* Nav Items - Desktop */}
                    <nav className="hidden items-center gap-8 md:flex">
                        <a
                            href="/#features"
                            onClick={(e) => handleNavClick('features', e)}
                            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                        >
                            Features
                        </a>
                        <a
                            href="/#pricing"
                            onClick={(e) => handleNavClick('pricing', e)}
                            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                        >
                            Pricing
                        </a>
                        <a
                            href="/#download"
                            onClick={(e) => handleNavClick('download', e)}
                            className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
                        >
                            Download App
                        </a>

                        <Link
                            href="/product/residents"
                            prefetch
                            className={`text-sm font-medium transition-colors ${activePage === 'residents' ? 'text-[#FF7E67]' : 'text-slate-400 hover:text-white'}`}
                        >
                            For Residents
                        </Link>
                        <Link
                            href="/product/estates"
                            prefetch
                            className={`text-sm font-medium transition-colors ${activePage === 'estates' ? 'text-[#FF7E67]' : 'text-slate-400 hover:text-white'}`}
                        >
                            For Estates
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="hidden items-center gap-4 md:flex">
                        <a
                            href={app_subdomain_url ? `${app_subdomain_url}/login` : '/login'}
                            className="rounded-lg border border-slate-800 bg-[#0f172a] px-5 py-2 text-xs font-semibold text-white transition-all hover:bg-[#1e293b]"
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

                    {/* Mobile menu trigger */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 text-slate-400 hover:text-white md:hidden"
                        aria-label="Toggle Menu"
                    >
                        {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Nav overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-x-0 top-20 z-40 flex flex-col gap-6 border-b border-slate-900 bg-[#020617] p-6 md:hidden"
                    >
                        <a
                            href="/#features"
                            onClick={(e) => handleNavClick('features', e)}
                            className="text-left text-base font-semibold text-slate-300"
                        >
                            Features
                        </a>
                        <a
                            href="/#pricing"
                            onClick={(e) => handleNavClick('pricing', e)}
                            className="text-left text-base font-semibold text-slate-300"
                        >
                            Pricing
                        </a>
                        <a
                            href="/#download"
                            onClick={(e) => handleNavClick('download', e)}
                            className="text-left text-base font-semibold text-slate-300"
                        >
                            Download App
                        </a>
                        <hr className="border-slate-950" />
                        <Link
                            href="/product/residents"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`text-base font-semibold ${activePage === 'residents' ? 'text-[#FF7E67]' : 'text-slate-300'}`}
                        >
                            For Residents
                        </Link>
                        <Link
                            href="/product/estates"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`text-base font-semibold ${activePage === 'estates' ? 'text-[#FF7E67]' : 'text-slate-300'}`}
                        >
                            For Estates
                        </Link>
                        <hr className="border-slate-950" />
                        <div className="flex gap-4">
                            <a
                                href={app_subdomain_url ? `${app_subdomain_url}/login` : '/login'}
                                className="flex-1 rounded-xl border border-slate-800 bg-[#0f172a] py-3 text-center text-sm font-semibold hover:bg-[#1e293b]"
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
