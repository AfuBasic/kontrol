import { Link } from '@inertiajs/react';
import { Calendar, Clock, History, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
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
            icon: User,
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
        <div className="-mx-3 w-full border-b border-slate-200/60 bg-white px-3 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
            <nav
                aria-label="Access workspace tabs"
                className="flex items-center overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const Icon = tab.icon;

                    const content = (
                        <div className="flex flex-col items-center justify-center gap-1">
                            <Icon className="h-4 w-4 shrink-0" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </div>
                    );

                    const tabClassName = `relative flex-1 flex min-h-[52px] min-w-[72px] shrink-0 items-center justify-center px-1 py-2 text-[11px] sm:text-xs transition-colors ${
                        isActive ? 'text-[#0b4aa2] font-bold' : 'text-slate-500 font-medium hover:text-slate-900'
                    }`;

                    const innerContent = (
                        <>
                            {content}
                            {isActive && (
                                <motion.div
                                    layoutId="access-tabs-active-underline"
                                    className="absolute bottom-0 left-1/2 h-0.5 w-[60%] -translate-x-1/2 rounded-t-full bg-[#0b4aa2]"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            {tab.badge && (
                                <div className="absolute top-1 right-2">
                                    <span
                                        aria-label={tab.badgeLabel}
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
                                onClick={() => onTabChange(tab.id)}
                                aria-current={isActive ? 'page' : undefined}
                                className={tabClassName}
                            >
                                {innerContent}
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
                            {innerContent}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
