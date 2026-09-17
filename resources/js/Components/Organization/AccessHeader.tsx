import React, { ReactNode } from 'react';
import AccessTabs from './AccessTabs';

interface Props {
    title?: string;
    subtitle?: string;
    primaryAction?: ReactNode;
    activeTab: 'people' | 'visitors' | 'arrivals' | 'history' | 'public_windows';
    hasPublicWindows?: boolean;
    pendingCount?: number;
    activeCount?: number;
    onTabChange?: (tab: 'people' | 'visitors' | 'arrivals' | 'history' | 'public_windows') => void;
}

export default function AccessHeader({
    title = 'Access',
    subtitle = 'Manage people, visitors, arrivals and history for your estate.',
    primaryAction,
    activeTab,
    hasPublicWindows,
    pendingCount,
    activeCount,
    onTabChange,
}: Props) {
    return (
        <div className="w-full">
            {/* Access Intro Band */}
            <div className="relative -mx-3 overflow-hidden bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/40 px-3 py-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
                <div className="relative z-10 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold tracking-tight text-[#0b4aa2] sm:text-2xl">{title}</h1>
                        {subtitle && <p className="mt-1 max-w-sm text-[13px] leading-snug text-slate-500">{subtitle}</p>}
                    </div>
                    {primaryAction && <div className="mt-0.5 shrink-0">{primaryAction}</div>}
                </div>
            </div>

            {/* Tabs */}
            <AccessTabs
                activeTab={activeTab}
                hasPublicWindows={hasPublicWindows}
                pendingCount={pendingCount}
                activeCount={activeCount}
                onTabChange={onTabChange}
            />
        </div>
    );
}
