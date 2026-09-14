import { Link } from '@inertiajs/react';
import { Calendar, Clock, History, Users } from 'lucide-react';
import React from 'react';

interface Props {
    activeTab: 'people' | 'arrivals' | 'history' | 'public_windows';
    hasPublicWindows?: boolean;
    pendingCount?: number;
    activeCount?: number;
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

export default function AccessTabs({ activeTab, hasPublicWindows = false, pendingCount = 0, activeCount = 0 }: Props) {
    const tabs: AccessTab[] = [
        {
            id: 'people',
            label: 'People',
            mobileLabel: 'People',
            href: '/org/access-list',
            icon: Users,
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
                      label: 'Public times',
                      mobileLabel: 'Public times',
                      href: '/org/public-windows',
                      icon: Calendar,
                  },
              ]
            : []),
    ];

    return (
        <nav
            aria-label="Access workspace"
            className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
            <div className="flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1 text-xs sm:text-sm">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex min-h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-all sm:flex-none sm:text-sm ${
                                isActive
                                    ? 'bg-white text-slate-950 font-semibold shadow-xs ring-1 ring-slate-900/5'
                                    : 'text-slate-600 hover:text-slate-950'
                            }`}
                        >
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                            <span>{tab.label}</span>
                            {tab.badge && (
                                <span
                                    aria-label={tab.badgeLabel}
                                    className={`min-w-4 rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none ${
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
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
