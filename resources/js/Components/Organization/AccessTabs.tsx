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
            mobileLabel: 'Here',
            href: '/org/arrivals',
            icon: Clock,
            badge: pendingCount > 0 ? `${pendingCount}` : activeCount > 0 ? `${activeCount}` : undefined,
            badgeLabel: pendingCount > 0 ? `${pendingCount} need attention` : activeCount > 0 ? `${activeCount} here` : undefined,
            badgeVariant: pendingCount > 0 ? 'warning' : 'neutral',
        },
        {
            id: 'history',
            label: 'History',
            mobileLabel: 'Log',
            href: '/org/arrivals/history',
            icon: History,
        },
        ...(hasPublicWindows
            ? [
                  {
                      id: 'public_windows' as const,
                      label: 'Public times',
                      mobileLabel: 'Times',
                      href: '/org/public-windows',
                      icon: Calendar,
                  },
              ]
            : []),
    ];

    return (
        <nav
            aria-label="Access workspace"
            className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
            <div className="grid min-w-full auto-cols-fr grid-flow-col items-center gap-1 rounded-[1.45rem] bg-white/75 p-1 text-xs shadow-[0_10px_30px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/80 backdrop-blur sm:inline-flex sm:min-w-0 sm:text-sm">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.id}
                            href={tab.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[1.1rem] px-1.5 py-2.5 font-black whitespace-nowrap transition-all sm:flex-none sm:gap-2 sm:px-4 ${
                                isActive
                                    ? 'bg-[#0f172a] text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="sm:hidden">{tab.mobileLabel}</span>
                            <span className="hidden sm:inline">{tab.label}</span>
                            {tab.badge && (
                                <span
                                    aria-label={tab.badgeLabel}
                                    className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black ${
                                        tab.badgeVariant === 'warning'
                                            ? isActive
                                                ? 'bg-amber-300 text-amber-950'
                                                : 'bg-amber-100 text-amber-900'
                                            : isActive
                                              ? 'bg-white/20 text-white'
                                              : 'bg-slate-100 text-slate-600'
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
