import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, CreditCard, Home, KeyRound, LogOut, Megaphone, User } from 'lucide-react';
import React, { type ReactNode, useEffect, useState } from 'react';

interface Props {
    children: ReactNode;
    title?: string;
    contentClassName?: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    exact?: boolean;
}

export default function OrganizationLayout({ children, title: _title, contentClassName = 'max-w-7xl' }: Props) {
    const page = usePage();
    const { url } = page;
    const props = page.props as any;

    const organization = props.organization || {};
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
        <div className="flex min-h-screen flex-col bg-[#f6f8fb] font-sans text-slate-950 antialiased selection:bg-[#0b4aa2] selection:text-white">
            <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/[0.92] px-3 pt-[env(safe-area-inset-top,0px)] shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6 lg:px-10">
                <div className="mx-auto flex h-16 w-full max-w-[96rem] items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                        <Link href="/org" className="group flex shrink-0 items-center gap-2.5">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                            <span className="hidden text-lg font-black tracking-tight text-[#0b4aa2] min-[360px]:inline">Kontrol</span>
                        </Link>

                        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

                        <Link
                            href="/org/settings"
                            className="min-w-0 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2 transition-colors hover:bg-slate-100"
                        >
                            <span className="block max-w-[9.5rem] truncate text-sm leading-none font-bold text-slate-900 sm:max-w-[16rem]">
                                {organization.name || 'Organization'}
                            </span>
                            {organization.estate_name && (
                                <span className="mt-1 block max-w-[9.5rem] truncate text-[11px] leading-none font-normal text-slate-500 sm:max-w-[16rem]">
                                    {organization.estate_name}
                                </span>
                            )}
                        </Link>
                    </div>

                    <nav className="hidden items-center gap-1 rounded-full bg-slate-100/80 p-1 lg:flex">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                                        active
                                            ? 'bg-white text-[#0b4aa2] shadow-[0_6px_18px_rgba(15,23,42,0.08)]'
                                            : 'text-slate-500 hover:bg-white/60 hover:text-slate-900'
                                    }`}
                                >
                                    <Icon className="h-4 w-4" strokeWidth={active ? 2.4 : 1.9} />
                                    <span>{item.name === 'Announcements' ? 'News' : item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                        <Link
                            href="/org/announcements"
                            className="relative rounded-2xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            title="Announcements & Bulletins"
                        >
                            <Bell className="h-5 w-5 text-slate-500" />
                        </Link>

                        <div className="relative hidden sm:block">
                            <button
                                type="button"
                                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                className="flex items-center gap-2 rounded-2xl py-1.5 pr-3 pl-1.5 transition-colors hover:bg-slate-100"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#dbeafe] text-xs font-bold text-[#0b4aa2] ring-1 ring-[#bfdbfe]">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="max-w-[120px] truncate text-xs font-semibold text-slate-800">{userFirstName}</span>
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            </button>

                            {userDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)} />
                                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-3xl bg-white p-2 text-xs shadow-[0_24px_70px_rgba(15,23,42,0.18)] ring-1 ring-black/5">
                                        <div className="border-b border-slate-100 px-3 py-2.5">
                                            <p className="truncate font-semibold text-slate-900">{user.name}</p>
                                            <p className="truncate font-normal text-slate-400">{user.email}</p>
                                        </div>
                                        <div className="py-1">
                                            <Link
                                                href="/org/settings"
                                                onClick={() => setUserDropdownOpen(false)}
                                                className="block rounded-2xl px-3 py-2.5 font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            >
                                                Profile & Team
                                            </Link>
                                            <Link
                                                href="/logout"
                                                method="post"
                                                as="button"
                                                className="flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left font-medium text-rose-600 hover:bg-rose-50"
                                            >
                                                <span>Sign out</span>
                                                <LogOut className="h-3.5 w-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="w-full flex-1 px-3 py-5 pb-[calc(6.75rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:py-7 lg:px-10 lg:pb-12">
                <div className={`mx-auto w-full space-y-5 ${contentClassName}`}>
                    {props.flash?.success && (
                        <div className="flex items-center justify-between rounded-2xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 shadow-xs sm:text-sm">
                            <span>{props.flash.success}</span>
                        </div>
                    )}
                    {props.flash?.error && (
                        <div className="flex items-center justify-between rounded-2xl border border-rose-200/80 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-900 shadow-xs sm:text-sm">
                            <span>{props.flash.error}</span>
                        </div>
                    )}

                    {children}
                </div>
            </main>

            <div
                data-mobile-bottom-nav
                className="pointer-events-none fixed inset-x-0 bottom-[calc(0.8rem+env(safe-area-inset-bottom,0px))] z-40 px-3 transition-opacity duration-150 lg:hidden"
            >
                <motion.nav
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pointer-events-auto mx-auto w-full max-w-[26rem] rounded-[26px] border border-white/70 bg-white/[0.94] px-1.5 py-1.5 shadow-[0_16px_50px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/5 backdrop-blur-xl"
                >
                    <div className="grid grid-cols-5 items-center gap-1">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`group relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[20px] px-1 py-1.5 transition-all active:scale-95 ${
                                        active ? 'bg-[#eaf2ff] text-[#0b4aa2]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                    }`}
                                >
                                    <Icon className="h-5 w-5 transition-colors" strokeWidth={active ? 2.4 : 1.9} />
                                    <span
                                        className={`max-w-full truncate text-[10px] leading-tight tracking-tight transition-colors ${
                                            active ? 'font-bold text-[#082f6e]' : 'font-medium text-slate-500'
                                        }`}
                                    >
                                        {item.name === 'Announcements' ? 'News' : item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            </div>
        </div>
    );
}
