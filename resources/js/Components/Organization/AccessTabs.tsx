import { Link } from '@inertiajs/react';
import { Clock, History, User, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import React from 'react';

interface Props {
    activeTab?: 'people' | 'visitors' | 'arrivals' | 'history' | 'public_windows' | 'credentials';
    pendingCount?: number;
    activeCount?: number;
    onTabChange?: (tab: 'people' | 'visitors' | 'arrivals' | 'history' | 'public_windows' | 'credentials') => void;
}

interface AccessTab {
    id: Props['activeTab'];
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    badge?: string;
    badgeVariant?: 'warning' | 'neutral';
}

export default function AccessTabs({ activeTab, pendingCount = 0, activeCount = 0, onTabChange }: Props) {
    const tabs: AccessTab[] = [
        { id: 'people', label: 'People', href: '/org/access-list', icon: Users },
        { id: 'visitors', label: 'Visitors', href: '/org/visitors', icon: User },
        {
            id: 'arrivals',
            label: 'Arrivals',
            href: '/org/arrivals',
            icon: Clock,
            badge: pendingCount > 0 ? `${pendingCount}` : activeCount > 0 ? `${activeCount}` : undefined,
            badgeVariant: pendingCount > 0 ? 'warning' : 'neutral',
        },
        { id: 'history', label: 'History', href: '/org/arrivals/history', icon: History },
    ];

    return (
        <nav
            aria-label="Access workspace tabs"
            className="flex items-center w-full"
        >
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
        </nav>
    );
}

