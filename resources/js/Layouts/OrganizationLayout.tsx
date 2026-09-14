import { Link, usePage } from '@inertiajs/react';
import {
    Home,
    KeyRound,
    CreditCard,
    Megaphone,
    User,
    LogOut,
    Menu,
    X,
    Building2,
} from 'lucide-react';
import React, { type ReactNode, useEffect, useState } from 'react';

interface Props {
    children: ReactNode;
    title?: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
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

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Force light theme to match Kontrol resident design language
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

    return (
        <div className="min-h-screen bg-stone-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white pb-16 lg:pb-0">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 h-16 border-b border-stone-200/80 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-slate-900 hover:bg-stone-100 focus:outline-none transition-colors"
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <Link href="/org" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-xs text-sm">
                            {organization.name ? organization.name.charAt(0).toUpperCase() : 'O'}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                {organization.name || 'Organization'}
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                                    {organization.type || 'Facility'}
                                </span>
                            </span>
                            <span className="text-xs text-stone-500 leading-none mt-0.5">
                                {organization.estate_name || 'Estate Community'}
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                        <span className="text-[11px] text-stone-500 capitalize">{membership.role || 'Member'}</span>
                    </div>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="p-2 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-64 flex-col border-r border-stone-200/80 bg-white p-4 space-y-1 shrink-0">
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                        Menu
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                                        active
                                            ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200/60 shadow-xs'
                                            : 'text-stone-600 hover:text-slate-900 hover:bg-stone-50'
                                    }`}
                                >
                                    <Icon
                                        className={`w-4 h-4 ${
                                            active ? 'text-indigo-600' : 'text-stone-400'
                                        }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-stone-100">
                        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="truncate">{organization.estate_name || 'Estate Portal'}</span>
                            </div>
                            <p className="text-[11px] text-stone-500">
                                Organization Participant
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-50 lg:hidden flex"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="relative flex flex-col w-full max-w-xs bg-white border-r border-stone-200 p-5 space-y-4 shadow-xl">
                            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                                <span className="font-semibold text-sm text-slate-900">Navigation</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1 rounded-lg text-stone-400 hover:text-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="space-y-1.5">
                                {navItems.map((item) => {
                                    const active = isActive(item);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-indigo-50 text-indigo-700 font-semibold ring-1 ring-indigo-200/60'
                                                    : 'text-stone-600 hover:text-slate-900 hover:bg-stone-50'
                                            }`}
                                        >
                                            <Icon
                                                className={`w-5 h-5 ${
                                                    active ? 'text-indigo-600' : 'text-stone-400'
                                                }`}
                                            />
                                            {item.name}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                )}

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto bg-stone-50 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-5xl mx-auto space-y-6">
                        {props.flash?.success && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
                                <span>{props.flash.success}</span>
                            </div>
                        )}
                        {props.flash?.error && (
                            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
                                <span>{props.flash.error}</span>
                            </div>
                        )}

                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/80 lg:hidden flex items-center justify-around px-2 py-1.5 shadow-lg">
                {navItems.map((item) => {
                    const active = isActive(item);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[11px] font-medium transition-colors ${
                                active
                                    ? 'text-indigo-600 font-semibold'
                                    : 'text-stone-500 hover:text-slate-800'
                            }`}
                        >
                            <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-stone-400'}`} />
                            <span className="mt-1">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
