import { Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, ChevronRight, Github, Twitter, Linkedin, Facebook } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { login } from '@/routes';
import landing from '@/routes/landing';

interface Props {
    children: ReactNode;
    isDark?: boolean;
}

export default function LandingLayout({ children, isDark = false }: Props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Features', href: landing.features().url },
        { name: 'Billing', href: landing.billing().url },
        { name: 'Security', href: landing.safety().url },
        { name: 'Pricing', href: landing.pricing().url },
    ];

    const isHeaderTransparent = !isScrolled && isDark;

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* --- NAVIGATION --- */}
            <header
                className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
                    isScrolled
                        ? 'bg-white/80 py-4 shadow-sm backdrop-blur-md'
                        : isHeaderTransparent
                          ? 'bg-transparent py-6'
                          : 'bg-white/80 py-6 backdrop-blur-md'
                }`}
            >
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link href={landing.home().url} className="group flex items-center">
                            <img
                                src={isHeaderTransparent ? '/assets/images/kontrol-white-logo.png' : '/assets/images/kontrol-logo-horizontal.png'}
                                alt="Kontrol Logo"
                                className="h-12 w-auto transition-transform group-hover:scale-105"
                            />
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden items-center gap-8 md:flex">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className={`text-sm font-bold transition-colors ${
                                        isHeaderTransparent ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-primary-600'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <Link
                                href={login().url}
                                className="rounded-xl bg-primary-700 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-700/20 transition-all hover:scale-105 hover:bg-primary-800 active:scale-95"
                            >
                                Sign In
                            </Link>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:hidden ${
                                isHeaderTransparent ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-600'
                            }`}
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* --- MOBILE DRAWER --- */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm md:hidden"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 z-[70] h-full w-[280px] bg-white p-6 shadow-2xl md:hidden"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary-900 uppercase">Menu</span>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600"
                                >
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="mt-12 flex flex-col gap-6">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="group flex items-center justify-between text-lg font-bold text-slate-900"
                                    >
                                        {link.name}
                                        <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                ))}
                                <Link
                                    href={login().url}
                                    className="mt-6 flex h-14 items-center justify-center rounded-2xl bg-primary-700 text-lg font-bold text-white shadow-xl shadow-primary-700/20 active:scale-95"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* --- MAIN CONTENT --- */}
            <main className="relative z-10">{children}</main>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-50 pt-24 pb-12">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-4">
                        {/* Brand */}
                        <div className="lg:col-span-1">
                            <Link href={landing.home().url} className="flex items-center">
                                <img src="/assets/images/kontrol-logo-horizontal.png" alt="Kontrol Logo" className="h-10 w-auto" />
                            </Link>
                            <p className="mt-4 text-sm leading-relaxed font-medium text-slate-500">
                                The all-in-one residential ecosystem for modern estate operations, security, and financial transparency.
                            </p>
                            <div className="mt-6 flex gap-4">
                                <a href="#" className="text-slate-400 transition-colors hover:text-primary-600">
                                    <Twitter className="h-5 w-5" />
                                </a>
                                <a href="#" className="text-slate-400 transition-colors hover:text-primary-600">
                                    <Linkedin className="h-5 w-5" />
                                </a>
                                <a href="#" className="text-slate-400 transition-colors hover:text-primary-600">
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a href="#" className="text-slate-400 transition-colors hover:text-primary-600">
                                    <Github className="h-5 w-5" />
                                </a>
                            </div>
                        </div>

                        {/* Links Grid */}
                        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-3">
                            <div>
                                <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Product</h4>
                                <ul className="mt-4 space-y-3">
                                    <li>
                                        <Link
                                            href={landing.features().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Features
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={landing.safety().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Security
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={landing.billing().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Collections
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={landing.mobile().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Mobile App
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Platform</h4>
                                <ul className="mt-4 space-y-3">
                                    <li>
                                        <Link
                                            href={landing.forEstates().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            For Estates
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={landing.pricing().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Pricing
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={login().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Admin Login
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase">Legal</h4>
                                <ul className="mt-4 space-y-3">
                                    <li>
                                        <Link
                                            href={landing.privacy().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Privacy Policy
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            href={landing.terms().url}
                                            className="text-sm font-bold text-slate-600 transition-colors hover:text-primary-600"
                                        >
                                            Terms of Service
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs font-bold text-slate-400 uppercase">
                            © {new Date().getFullYear()} Kontrol Technologies Ltd. All rights reserved.
                        </p>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">System Operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
