import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Home,
    KeyRound,
    CreditCard,
    Megaphone,
    User,
    LogOut,
    Bell,
    ChevronDown,
} from 'lucide-react';
import React, { type ReactNode, useEffect, useState } from 'react';

interface Props {
    children: ReactNode;
    title?: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    exact?: boolean;
}

export default function OrganizationLayout({ children, title }: Props) {
    const page = usePage();
    const { url } = page;
    const props = page.props as any;

    const organization = props.organization || {};
    const membership = props.membership || { role: 'member', is_admin: false };
    const auth = props.auth || {};
    const user = auth.user || {};

    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    // Force light theme in Organization area to match Kontrol resident design language
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('dark');
        html.classList.add('light');
        html.style.colorScheme = 'light';
    }, []);

    const navItems: NavItem[] = [
        {
            name: 'Home',
            href: '/org',
            icon: Home,
            exact: true,
        },
        {
            name: 'Access',
            href: '/org/access-list',
            icon: KeyRound,
        },
        {
            name: 'Payments',
            href: '/org/payments',
            icon: CreditCard,
        },
        {
            name: 'Announcements',
            href: '/org/announcements',
            icon: Megaphone,
        },
        {
            name: 'Profile',
            href: '/org/settings',
            icon: User,
        },
    ];

    const isActive = (item: NavItem) => {
        if (item.exact) {
            return url === item.href;
        }
        if (item.name === 'Access') {
            return (
                url.startsWith('/org/access-list') ||
                url.startsWith('/org/arrivals') ||
                url.startsWith('/org/credentials') ||
                url.startsWith('/org/public-windows')
            );
        }
        return url.startsWith(item.href);
    };

    const userFirstName = user.name ? user.name.split(' ')[0] : 'Account';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
            {/* Horizontal Product Header */}
            <header className="sticky top-0 z-40 h-16 border-b border-slate-100 bg-white/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
                <div className="flex items-center gap-6 sm:gap-8">
                    {/* Brand & Organization Context */}
                    <div className="flex items-center gap-3">
                        <Link href="/org" className="flex items-center gap-2 group">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-7 w-auto object-contain" />
                            <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                                Kontrol
                            </span>
                        </Link>

                        <div className="h-4 w-px bg-slate-200" />

                        <div className="flex items-baseline gap-1.5 min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[120px] sm:max-w-[180px]">
                                {organization.name || 'Organization'}
                            </span>
                            {organization.estate_name && (
                                <span className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-[100px] sm:max-w-[150px] hidden xs:inline">
                                    · {organization.estate_name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Desktop Horizontal Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        active
                                            ? 'bg-slate-900 text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                                    }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right controls: Notifications & User / Account Dropdown */}
                <div className="flex items-center gap-3">
                    <Link
                        href="/org/announcements"
                        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100/70 transition-colors"
                        title="Announcements & Bulletins"
                    >
                        <Bell className="h-5 w-5 text-slate-500" />
                    </Link>

                    {/* Desktop User Dropdown */}
                    <div className="relative hidden sm:block">
                        <button
                            type="button"
                            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                            className="flex items-center gap-2 rounded-full py-1 pl-2 pr-3 hover:bg-slate-100/70 transition-colors"
                        >
                            <div className="h-7 w-7 rounded-full bg-indigo-50 font-bold text-indigo-600 ring-1 ring-indigo-100 flex items-center justify-center text-xs">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                                {userFirstName}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        </button>

                        {userDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setUserDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5 z-50 text-xs">
                                    <div className="px-3 py-2 border-b border-slate-100">
                                        <p className="font-bold text-slate-900 truncate">{user.name}</p>
                                        <p className="text-slate-400 truncate">{user.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <Link
                                            href="/org/settings"
                                            onClick={() => setUserDropdownOpen(false)}
                                            className="block px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                        >
                                            Profile & Team
                                        </Link>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full text-left px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-medium flex items-center justify-between"
                                        >
                                            <span>Sign out</span>
                                            <LogOut className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 pb-28 md:pb-12">
                <div className="max-w-4xl mx-auto space-y-6">
                    {props.flash?.success && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
                            <span>{props.flash.success}</span>
                        </div>
                    )}
                    {props.flash?.error && (
                        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
                            <span>{props.flash.error}</span>
                        </div>
                    )}

                    {children}
                </div>
            </main>

            {/* Mobile Floating Bottom Navigation (matches Resident shell) */}
            <div
                data-mobile-bottom-nav
                className="pointer-events-none fixed inset-x-0 bottom-6 z-40 px-4 transition-opacity duration-150 md:hidden"
            >
                <motion.nav
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto mx-auto max-w-sm rounded-[32px] bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] ring-1 ring-black/5 backdrop-blur-2xl px-2 py-1.5"
                >
                    <div className="flex items-center justify-around">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="group relative flex flex-1 flex-col items-center gap-0.5 py-1"
                                >
                                    <div
                                        className={`rounded-xl p-1.5 transition-all ${
                                            active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                                    </div>
                                    <span
                                        className={`text-[10px] tracking-tight transition-colors ${
                                            active ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
                                        }`}
                                    >
                                        {item.name === 'Announcements' ? 'News' : item.name}
                                    </span>
                                    {active && (
                                        <motion.div
                                            layoutId="orgNavIndicator"
                                            className="absolute bottom-0 h-1 w-1 rounded-full bg-indigo-600"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            </div>
        </div>
    );
}
