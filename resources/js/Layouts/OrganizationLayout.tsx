import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    KeyRound,
    Clock,
    Calendar,
    Settings,
    LogOut,
    Building2,
    Shield,
    ChevronDown,
    Menu,
    X,
} from 'lucide-react';
import React, { type ReactNode, useState } from 'react';

interface Props {
    children: ReactNode;
    title?: string;
}

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    exact?: boolean;
    adminOnly?: boolean;
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

    const navItems: NavItem[] = [
        {
            name: 'Overview',
            href: '/org',
            icon: LayoutDashboard,
            exact: true,
        },
        {
            name: 'Active Arrivals',
            href: '/org/arrivals',
            icon: Clock,
            exact: true,
        },
        {
            name: 'Arrival History',
            href: '/org/arrivals/history',
            icon: Building2,
        },
        {
            name: 'Access List',
            href: '/org/access-list',
            icon: Users,
        },
        {
            name: 'Credentials',
            href: '/org/credentials',
            icon: KeyRound,
        },
        ...(organization.access_policy === 'public_window'
            ? [
                  {
                      name: 'Public Windows',
                      href: '/org/public-windows',
                      icon: Calendar,
                  },
              ]
            : []),
        {
            name: 'Settings & Policy',
            href: '/org/settings',
            icon: Settings,
            adminOnly: true,
        },
    ];

    const isActive = (item: NavItem) => {
        if (item.exact) {
            return url === item.href;
        }
        return url.startsWith(item.href);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 h-16 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 focus:outline-none"
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 text-sm">
                            {organization.name ? organization.name.charAt(0).toUpperCase() : 'O'}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-sm leading-tight text-zinc-100 flex items-center gap-1.5">
                                {organization.name || 'Organization Portal'}
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                                    {membership.role || 'Member'}
                                </span>
                            </span>
                            <span className="text-xs text-zinc-500 leading-none">
                                {organization.estate_name || 'Secure Estate Portal'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex flex-col text-right">
                        <span className="text-xs font-medium text-zinc-200">{user.name}</span>
                        <span className="text-[11px] text-zinc-500">{user.email}</span>
                    </div>

                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </Link>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:flex w-64 flex-col border-r border-zinc-800/80 bg-zinc-950 p-4 space-y-1 shrink-0">
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                        Management
                    </div>
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            if (item.adminOnly && !membership.is_admin) {
                                return null;
                            }
                            const active = isActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                                        active
                                            ? 'bg-indigo-600/15 text-indigo-400 font-semibold border border-indigo-500/20'
                                            : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                                    }`}
                                >
                                    <Icon
                                        className={`w-4 h-4 ${
                                            active ? 'text-indigo-400' : 'text-zinc-500'
                                        }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-zinc-900">
                        <div className="p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Policy: {organization.access_policy || 'Managed'}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500">
                                {organization.arrival_confirmation_required
                                    ? `Confirmation required (${organization.confirmation_window_minutes || 15}m)`
                                    : 'No arrival confirmation required'}
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
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div className="relative flex flex-col w-full max-w-xs bg-zinc-950 border-r border-zinc-800 p-4 space-y-4">
                            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                                <span className="font-semibold text-sm text-zinc-200">Menu</span>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1 rounded-lg text-zinc-400 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="space-y-1">
                                {navItems.map((item) => {
                                    if (item.adminOnly && !membership.is_admin) {
                                        return null;
                                    }
                                    const active = isActive(item);
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                                                active
                                                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                                                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                                            }`}
                                        >
                                            <Icon
                                                className={`w-4 h-4 ${
                                                    active ? 'text-indigo-400' : 'text-zinc-500'
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
                <main className="flex-1 overflow-y-auto bg-zinc-950 p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {props.flash?.success && (
                            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                                <span>{props.flash.success}</span>
                            </div>
                        )}
                        {props.flash?.error && (
                            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                                <span>{props.flash.error}</span>
                            </div>
                        )}

                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
