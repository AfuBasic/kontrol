import { Link } from '@inertiajs/react';
import { Users, Clock, History, Calendar } from 'lucide-react';
import React from 'react';

interface Props {
    activeTab: 'people' | 'arrivals' | 'history' | 'public_windows';
    hasPublicWindows?: boolean;
    pendingCount?: number;
    activeCount?: number;
}

export default function AccessTabs({
    activeTab,
    hasPublicWindows = false,
    pendingCount = 0,
    activeCount = 0,
}: Props) {
    const tabs = [
        {
            id: 'people',
            label: 'People',
            href: '/org/access-list',
            icon: Users,
        },
        {
            id: 'arrivals',
            label: 'Arrivals',
            href: '/org/arrivals',
            icon: Clock,
            badge: pendingCount > 0 ? `${pendingCount} need attention` : activeCount > 0 ? `${activeCount} here` : undefined,
            badgeVariant: pendingCount > 0 ? 'warning' : 'neutral',
        },
        {
            id: 'history',
            label: 'History',
            href: '/org/arrivals/history',
            icon: History,
        },
        ...(hasPublicWindows
            ? [
                  {
                      id: 'public_windows',
                      label: 'Public access times',
                      href: '/org/public-windows',
                      icon: Calendar,
                  },
              ]
            : []),
    ];

    return (
        <div className="flex items-center gap-6 border-b border-slate-200/80 pb-px overflow-x-auto text-sm">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`relative pb-3 font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                            isActive
                                ? 'text-slate-900'
                                : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    tab.badgeVariant === 'warning'
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                {tab.badge}
                            </span>
                        )}
                        {isActive && (
                            <span className="absolute inset-x-0 bottom-0 h-0.5 bg-slate-900 rounded-full" />
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
