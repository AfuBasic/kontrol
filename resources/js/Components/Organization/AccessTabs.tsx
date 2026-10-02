import { Link, usePage } from '@inertiajs/react';
import { Clock, History, User, Users, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface Props {
    activeTab?: 'people' | 'visitors' | 'bulk_invites' | 'on_site' | 'history' | 'public_windows' | 'credentials';
    pendingCount?: number;
    activeCount?: number;
    showOnSiteTab?: boolean;
    onTabChange?: (tab: 'people' | 'visitors' | 'bulk_invites' | 'on_site' | 'history' | 'public_windows' | 'credentials') => void;
}

interface AccessTab {
    id: Props['activeTab'];
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string;
    badgeVariant?: 'warning' | 'neutral';
}

export default function AccessTabs({ activeTab, pendingCount = 0, activeCount = 0, showOnSiteTab, onTabChange }: Props) {
    const shared = usePage().props as { org_on_site_enabled?: boolean };
    const onSiteEnabled = showOnSiteTab ?? !!shared.org_on_site_enabled;
    const baseTabs: AccessTab[] = [
        { id: 'people', label: 'People', href: '/org/access-list', icon: Users },
        { id: 'visitors', label: 'Visitors', href: '/org/visitors', icon: User },
        { id: 'bulk_invites', label: 'Groups', href: '/org/bulk-invites', icon: UsersRound },
        { id: 'history', label: 'History', href: '/org/on-site/history', icon: History },
    ];

    const onSiteTab: AccessTab = {
        id: 'on_site',
        label: 'On-site',
        href: '/org/on-site',
        icon: Clock,
        badge: activeCount > 0 ? `${activeCount}` : undefined,
        badgeVariant: 'neutral',
    };

    // Insert On-site tab before History only when checkout tracking is enabled
    const tabs = onSiteEnabled ? [...baseTabs.slice(0, 3), onSiteTab, ...baseTabs.slice(3)] : baseTabs;

    return (
        <nav aria-label="Access workspace tabs" className="flex w-full items-center">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;

                const tabClassName = `relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] py-3 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-[#0b4aa2] font-bold' : 'text-slate-400 hover:text-slate-600'
                }`;

                const content = (
                    <>
                        <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                        <span className="whitespace-nowrap">{tab.label}</span>
                        {isActive && (
                            <motion.div
                                layoutId="access-tabs-active-underline"
                                className="absolute bottom-0 left-1/2 h-0.5 w-[55%] -translate-x-1/2 rounded-t-full bg-[#0b4aa2]"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        {tab.badge && (
                            <div className="absolute top-2 right-3">
                                <span
                                    className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] leading-none font-bold ${
                                        tab.badgeVariant === 'warning' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                                    }`}
                                >
                                    {tab.badge}
                                </span>
                            </div>
                        )}
                    </>
                );

                if (onTabChange) {
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id!)}
                            aria-current={isActive ? 'page' : undefined}
                            className={tabClassName}
                        >
                            {content}
                        </button>
                    );
                }

                return (
                    <Link key={tab.id} href={tab.href} prefetch preserveScroll aria-current={isActive ? 'page' : undefined} className={tabClassName}>
                        {content}
                    </Link>
                );
            })}
        </nav>
    );
}
