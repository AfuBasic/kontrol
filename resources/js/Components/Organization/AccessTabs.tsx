import { Link } from '@inertiajs/react';
import { Calendar, Clock, History, Users } from 'lucide-react';
import React from 'react';

interface Props {
    activeTab: 'people' | 'visitors' | 'arrivals' | 'history' | 'public_windows';
    hasPublicWindows?: boolean;
    pendingCount?: number;
    activeCount?: number;
    onTabChange?: (tab: 'people' | 'visitors' | 'arrivals' | 'history' | 'public_windows') => void;
}

interface AccessTab {
    id: Props['activeTab'];
    label: string;
    mobileLabel: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string;
    badgeLabel?: string;
    badgeVariant?: 'warning' | 'neutral';
}

export default function AccessTabs({ activeTab, hasPublicWindows = false, pendingCount = 0, activeCount = 0, onTabChange }: Props) {
    const tabs: AccessTab[] = [
        {
            id: 'people',
            label: 'People',
            mobileLabel: 'People',
            href: '/org/access-list',
            icon: Users,
        },
        {
            id: 'visitors',
            label: 'Visitors',
            mobileLabel: 'Visitors',
            href: '/org/visitors',
            icon: Users, // Using the same icon for now, or something like UserPlus. Let's stick with Users.
        },
        {
            id: 'arrivals',
            label: 'Arrivals',
            mobileLabel: 'Arrivals',
            href: '/org/arrivals',
            icon: Clock,
            badge: pendingCount > 0 ? `${pendingCount}` : activeCount > 0 ? `${activeCount}` : undefined,
            badgeLabel: pendingCount > 0 ? `${pendingCount} need attention` : activeCount > 0 ? `${activeCount} here` : undefined,
            badgeVariant: pendingCount > 0 ? 'warning' : 'neutral',
        },
        {
            id: 'history',
            label: 'History',
            mobileLabel: 'History',
            href: '/org/arrivals/history',
            icon: History,
        },
        ...(hasPublicWindows
            ? [
                  {
                      id: 'public_windows' as const,
                      label: 'Public hours',
                      mobileLabel: 'Public hours',
                      href: '/org/public-windows',
                      icon: Calendar,
                  },
              ]
            : []),
    ];

    return (
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <nav
                aria-label="Access workspace tabs"
                className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
                <div className="inline-flex w-max items-center gap-1.5 rounded-2xl bg-slate-100/90 p-1">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        const content = (
                            <>
                                <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                                <span className="whitespace-nowrap">{tab.label}</span>
                                {tab.badge && (
                                    <span
                                        aria-label={tab.badgeLabel}
                                        className={`ml-0.5 min-w-4 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none ${
                                            tab.badgeVariant === 'warning'
                                                ? isActive
                                                    ? 'bg-amber-100 text-amber-900'
                                                    : 'bg-amber-100/80 text-amber-900'
                                                : isActive
                                                  ? 'bg-slate-100 text-slate-700'
                                                  : 'bg-slate-200/80 text-slate-700'
                                        }`}
                                    >
                                        {tab.badge}
                                    </span>
                                )}
                            </>
                        );

                        const tabClassName = `relative flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium tracking-tight whitespace-nowrap transition-all sm:min-h-10 sm:px-4 sm:text-sm ${
                            isActive
                                ? 'bg-white text-slate-950 font-semibold shadow-xs ring-1 ring-slate-900/5'
                                : 'text-slate-500 hover:text-slate-900'
                        }`;

                    if (onTabChange) {
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onTabChange(tab.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={tabClassName}
                            >
                                {content}
                            </button>
                        );
                    }

                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            prefetch
                            preserveScroll
                            aria-current={isActive ? 'page' : undefined}
                            className={tabClassName}
                        >
                            {content}
                        </Link>
                    );
                })}
            </div>
        </nav>
        </div>
    );
}
