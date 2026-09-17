import React, { ReactNode } from 'react';
import AccessTabs from './AccessTabs';
import { usePage } from '@inertiajs/react';

interface Props {
    primaryAction?: ReactNode;
    activeTab: 'people' | 'visitors' | 'arrivals' | 'history';
    pendingCount?: number;
    activeCount?: number;
    onTabChange?: (tab: 'people' | 'visitors' | 'arrivals' | 'history') => void;
}

export default function AccessHeader({
    primaryAction,
    activeTab,
    pendingCount,
    activeCount,
    onTabChange,
}: Props) {
    const { organization } = usePage().props as any;
    const estateContext = organization?.estate ? ` · ${organization.estate}` : '';

    return (
        <div className="w-full">
            {/* Access Intro */}
            <div className="flex items-center justify-between px-1 pb-3 pt-1 sm:px-4">
                <div>
                    <h1 className="text-[26px] font-bold tracking-tight text-[#0b1f40]">Access</h1>
                    <p className="mt-0.5 text-[13px] font-medium text-slate-500">
                        {organization?.name || 'Kontrol'}{estateContext}
                    </p>
                </div>
                {primaryAction && <div className="shrink-0">{primaryAction}</div>}
            </div>

            {/* Tabs */}
            <AccessTabs
                activeTab={activeTab}
                pendingCount={pendingCount}
                activeCount={activeCount}
                onTabChange={onTabChange}
            />
        </div>
    );
}
