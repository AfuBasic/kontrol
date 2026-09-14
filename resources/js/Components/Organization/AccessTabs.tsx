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
                      label: 'Public Times',
                      href: '/org/public-windows',
                      icon: Calendar,
                  },
              ]
            : []),
    ];

    return (
        <div className="flex items-center gap-1.5 p-1 bg-stone-100/80 rounded-2xl border border-stone-200/60 overflow-x-auto">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                            isActive
                                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-stone-200/80 font-semibold'
                                : 'text-stone-600 hover:text-slate-900 hover:bg-white/50'
                        }`}
                    >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-stone-400'}`} />
                        <span>{tab.label}</span>
                        {tab.badge && (
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                    tab.badgeVariant === 'warning'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-stone-200 text-stone-700'
                                }`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
