import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Bell, ChevronDown, CreditCard, Home, KeyRound, LogOut, Megaphone, User } from 'lucide-react';
import React, { type ReactNode, useEffect, useState } from 'react';
import PullToRefresh from '@/Components/PullToRefresh';

interface Props {
    children: ReactNode;
    title?: string;
    contentClassName?: string;
    onRefresh?: () => void;
    hideBottomNav?: boolean;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    exact?: boolean;
}

export default function OrganizationLayout({
    children,
    title: _title,
    contentClassName = 'max-w-7xl',
    onRefresh,
    hideBottomNav = false,
}: Props) {
    const page = usePage();
    const { url } = page;
    const props = page.props as any;

    const organization = props.organization || {};
    const auth = props.auth || {};
    const user = auth.user || {};

    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    // Force light theme and ensure status bar icons are dark in Organization area
    useEffect(() => {
        const html = document.documentElement;
        html.classList.remove('dark');
        html.classList.add('light');
        html.style.colorScheme = 'light';

        if (Capacitor.isNativePlatform()) {
            StatusBar.setStyle({ style: Style.Light }).catch(() => {});
            if (Capacitor.getPlatform() === 'android') {
                StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
            }
        }
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
            <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/70 bg-white/[0.94] px-3 pt-[var(--safe-area-inset-top-stable,env(safe-area-inset-top,0px))] shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6 lg:px-10">
                <div className="mx-auto flex h-16 w-full max-w-[96rem] items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                        <Link href="/org" className="group flex shrink-0 items-center gap-2.5">
                            <img src="/assets/images/icon.png" alt="Kontrol" className="h-8 w-auto object-contain" />
                            <span className="text-lg font-black tracking-tight text-[#0b4aa2]">Kontrol</span>
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
                            href="/org/notifications"
                            className="relative rounded-2xl p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                            title="Notifications"
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

            <main className={`w-full flex-1 pt-[calc(4rem+var(--safe-area-inset-top-stable,env(safe-area-inset-top,0px))+1.25rem)] ${
                hideBottomNav
                    ? 'pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]'
                    : 'pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))]'
            } sm:pt-[calc(4rem+var(--safe-area-inset-top-stable,env(safe-area-inset-top,0px))+1.75rem)] lg:pb-12`}>
                <PullToRefresh onRefresh={onRefresh}>
                    <div className={`mx-auto w-full space-y-5 px-3 sm:px-6 lg:px-10 ${contentClassName}`}>
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
                </PullToRefresh>
            </main>

            {!hideBottomNav && (
                <div
                    data-mobile-bottom-nav
                    className="fixed inset-x-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-40 rounded-[2rem] bg-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-slate-900/5 backdrop-blur-xl lg:hidden"
                >
                    <nav className="flex h-16 w-full items-center justify-between px-2">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors active:opacity-70 ${
                                        active ? 'text-[#0b4aa2]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                                    <span
                                        className={`text-[10px] tracking-tight ${
                                            active ? 'font-bold' : 'font-medium'
                                        }`}
                                    >
                                        {item.name === 'Announcements' ? 'News' : item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            )}
        </div>
    );
}
