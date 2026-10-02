import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, MapPin, ShieldCheck, UserPlus } from 'lucide-react';
import React, { type ReactNode } from 'react';
import AccessTabs from './AccessTabs';

interface Props {
    primaryAction?: ReactNode;
    activeTab: 'people' | 'visitors' | 'bulk_invites' | 'on_site' | 'history' | 'public_windows' | 'credentials';
    pendingCount?: number;
    activeCount?: number;
    totalAccessMembers?: number;
    showOnSiteTab?: boolean;
    onTabChange?: (tab: 'people' | 'visitors' | 'bulk_invites' | 'on_site' | 'history' | 'public_windows' | 'credentials') => void;
}

export default function AccessHeader({
    primaryAction,
    activeTab,
    pendingCount,
    activeCount,
    totalAccessMembers = 0,
    showOnSiteTab,
    onTabChange,
}: Props) {
    const page = usePage();
    const props = page.props as any;
    const organization = props.organization || {};
    const auth = props.auth || {};
    const user = auth.user || {};

    const userFirstName = user.name ? user.name.split(' ')[0] : 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="flex w-full flex-col gap-3.5">
            {/* ATMOSPHERIC BACKGROUND */}
            <div className="app-atmosphere" />

            {/* ORGANIZATION IDENTITY */}
            <header className="flex flex-col pt-1">
                <p className="text-[12px] font-medium text-slate-500">
                    {getGreeting()}, {userFirstName}
                </p>
                <div className="mt-0.5 flex items-center justify-between">
                    <h1 className="text-[26px] leading-tight font-extrabold tracking-tight text-[#071f4b]">{organization.name || 'Access'}</h1>
                    {primaryAction && <div className="shrink-0">{primaryAction}</div>}
                </div>
                {organization.estate_name && (
                    <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                        <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                        {organization.estate_name}
                        <ChevronRight className="ml-0.5 h-3 w-3 text-slate-400" />
                    </p>
                )}
            </header>

            {/* ACCESS OVERVIEW CARD */}
            <Link href="/org/access-list" className="brand-card flex items-center justify-between p-4 transition-transform active:scale-[0.98]">
                <div className="relative z-10 flex items-center gap-3.5">
                    <div className="brand-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]">
                        <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.1} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <h2 className="text-[13px] font-semibold text-white/90">Access Overview</h2>
                        <p className="text-[11px] text-blue-200/70">Total people with access</p>
                        <span className="mt-0.5 text-[32px] leading-none font-extrabold tracking-tight text-white">{totalAccessMembers}</span>
                    </div>
                </div>
                <ChevronRight className="relative z-10 h-5 w-5 text-white/50" strokeWidth={2.5} />
            </Link>

            {/* PRIMARY ACCESS TABS */}
            <div className="soft-card overflow-hidden p-0">
                <AccessTabs
                    activeTab={activeTab}
                    pendingCount={pendingCount}
                    activeCount={activeCount}
                    showOnSiteTab={showOnSiteTab ?? !!(organization.visitor_checkout_enabled ?? props.org_on_site_enabled)}
                    onTabChange={onTabChange}
                />
            </div>
        </div>
    );
}
