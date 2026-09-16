import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, DoorOpen, MapPin, Radio, ShieldCheck, Users, Search, Plus, KeyRound, Bell } from 'lucide-react';
import React from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface MetricProps {
    currently_inside: number;
    today_entries: number;
    pending_confirmation: number;
    overdue_confirmation: number;
    confirmed: number;
    confirmation_required: boolean;
}

interface Arrival {
    id: number;
    tag: string | null;
    visitor_name: string;
    admission_basis: string;
    vehicle_plate_number: string | null;
    entry_point: string | null;
    verified_at_human: string | null;
    confirmation_state: 'NOT_REQUIRED' | 'CONFIRMED' | 'PENDING' | 'OVERDUE';
    is_overdue: boolean;
}

interface ActivityItem {
    id: number;
    name: string;
    description: string;
    time_human: string;
    type: 'arrival' | 'confirmed' | 'checkout';
    is_active: boolean;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        access_policy: string;
        arrival_confirmation_required: boolean;
        confirmation_window_minutes: number;
        estate_name: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    metrics: MetricProps;
    recent_arrivals: Arrival[];
    pending_arrivals: Arrival[];
    recent_activity: ActivityItem[];
}

export default function Dashboard({ organization, metrics, recent_arrivals = [], pending_arrivals = [], recent_activity = [] }: Props) {
    const page = usePage();
    const auth = (page.props as any).auth || {};
    const user = auth.user || {};

    const currentlyHere = metrics.currently_inside ?? 0;
    const pendingTotal = pending_arrivals.length;
    const overdueTotal = metrics.overdue_confirmation ?? 0;
    
    // Total people that require attention (pending or overdue)
    const waitingCount = pendingTotal + overdueTotal;

    const isQuiet = currentlyHere === 0 && waitingCount === 0;
    const needsAttention = waitingCount > 0;
    const isCritical = overdueTotal >= 3;

    const userFirstName = user.name ? user.name.split(' ')[0] : 'User';

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const stateConfig = isCritical
        ? {
              label: 'Critical attention',
              dot: 'bg-rose-500',
              text: 'text-rose-700',
              bg: 'bg-rose-50'
          }
        : needsAttention
          ? {
                label: `${waitingCount} waiting confirmation`,
                dot: 'bg-amber-500',
                text: 'text-amber-700',
                bg: 'bg-amber-50'
            }
          : {
                label: 'Everything looks good',
                dot: 'bg-emerald-500',
                text: 'text-emerald-700',
                bg: 'bg-emerald-50/50'
            };

    const activityIcon = (item: ActivityItem) => {
        if (item.type === 'confirmed') return <CheckCircle2 className="h-3.5 w-3.5" />;
        if (item.type === 'checkout') return <DoorOpen className="h-3.5 w-3.5" />;
        return <Radio className="h-3.5 w-3.5" />;
    };
    
    const latestActivity = recent_activity[0];

    return (
        <OrganizationLayout title="Home" contentClassName="w-full">
            <Head title={`${organization.name} - Home`} />

            <div className="flex flex-col gap-6 pb-6 pt-2">
                
                {/* 1. TIGHT HEADER & CONTEXT */}
                <header className="px-4 sm:px-6 lg:px-8 flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                            {getGreeting()}, {userFirstName}
                        </p>
                        <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-[#082f6e] leading-none">
                            {organization.name}
                        </h1>
                        {organization.estate_name && (
                            <p className="mt-1 text-sm font-medium text-slate-500">{organization.estate_name}</p>
                        )}
                    </div>
                </header>

                {/* 2. TODAY OPERATIONAL PULSE */}
                <section className="px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col rounded-[1.25rem] border border-slate-200/80 bg-white shadow-sm overflow-hidden">
                        <div className="px-4 pt-4 pb-1">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">Today</h2>
                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${stateConfig.dot}`} />
                                <span className={`text-sm font-semibold ${stateConfig.text}`}>{stateConfig.label}</span>
                            </div>
                        </div>
                        
                        <div className="px-4 py-3 flex items-center gap-4">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-bold text-slate-900">{currentlyHere}</span>
                                <span className="text-sm font-medium text-slate-500">inside</span>
                            </div>
                            <span className="text-slate-300 font-bold">·</span>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-bold text-slate-900">{waitingCount}</span>
                                <span className="text-sm font-medium text-slate-500">waiting</span>
                            </div>
                        </div>

                        {latestActivity ? (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Last Activity</p>
                                    <p className="text-xs font-medium text-slate-700">{latestActivity.time_human}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Last Activity</p>
                                    <p className="text-xs font-medium text-slate-500">No movement yet today.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* 3. QUICK ACTIONS IN FIRST VIEWPORT */}
                <section className="px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-4 gap-2">
                        <Link href="/org/access-list/create" className="flex flex-col items-center gap-1.5">
                            <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1rem] bg-[#f0f6ff] text-[#0b4aa2] transition-transform active:scale-95">
                                <Plus className="h-5 w-5" strokeWidth={2.5} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">Add</span>
                        </Link>
                        <Link href="/org/access-list" className="flex flex-col items-center gap-1.5">
                            <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1rem] bg-slate-100 text-slate-600 transition-transform active:scale-95">
                                <KeyRound className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">Access</span>
                        </Link>
                        <Link href="/org/arrivals" className="flex flex-col items-center gap-1.5">
                            <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1rem] bg-slate-100 text-slate-600 transition-transform active:scale-95">
                                <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">Arrivals</span>
                        </Link>
                        <Link href="/org/arrivals/history" className="flex flex-col items-center gap-1.5">
                            <div className="flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-[1rem] bg-slate-100 text-slate-600 transition-transform active:scale-95">
                                <Clock className="h-5 w-5" strokeWidth={2} />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">History</span>
                        </Link>
                    </div>
                </section>

                {/* 4. ATTENTION MODULE (Only if needs attention) */}
                {needsAttention && (
                    <section className="px-4 sm:px-6 lg:px-8 mt-2">
                        <div className={`rounded-xl border p-4 shadow-sm ${isCritical ? 'bg-rose-50 border-rose-200' : 'bg-amber-50/70 border-amber-200/80'}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <AlertCircle className={`h-4 w-4 ${isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
                                <h3 className={`text-xs font-bold uppercase tracking-wider ${isCritical ? 'text-rose-900' : 'text-amber-900'}`}>
                                    Action Required
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {pending_arrivals.slice(0, 3).map((arrival) => (
                                    <Link
                                        key={arrival.id}
                                        href="/org/arrivals"
                                        className={`flex items-center justify-between gap-3 rounded-lg border p-3 transition active:scale-[0.98] ${
                                            isCritical 
                                            ? 'bg-white border-rose-200 hover:bg-rose-50' 
                                            : 'bg-white border-amber-200/60 hover:bg-amber-50/50'
                                        }`}
                                    >
                                        <div className="min-w-0">
                                            <p className={`truncate text-sm font-semibold ${isCritical ? 'text-rose-950' : 'text-amber-950'}`}>
                                                {arrival.visitor_name}
                                            </p>
                                            <p className={`mt-0.5 truncate text-xs font-medium ${isCritical ? 'text-rose-800/80' : 'text-amber-800/80'}`}>
                                                {arrival.entry_point || 'Gate'} • {arrival.verified_at_human || 'recently'}
                                            </p>
                                        </div>
                                        <ArrowRight className={`h-4 w-4 shrink-0 ${isCritical ? 'text-rose-500' : 'text-amber-500'}`} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 5. ON SITE DIRECTORY (Elastic) */}
                <section className="px-4 sm:px-6 lg:px-8 mt-3 space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">On Site</h3>
                    {recent_arrivals.length === 0 ? (
                        <p className="text-[13px] text-slate-600 font-medium">No one currently inside.</p>
                    ) : (
                        <div className="space-y-1">
                            {recent_arrivals.slice(0, 4).map((arrival) => (
                                <div key={arrival.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                                    <div className="min-w-0 flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f6ff] text-[10px] font-bold text-[#0b4aa2]">
                                            {arrival.visitor_name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="truncate text-sm font-semibold text-[#082f6e]">{arrival.visitor_name}</p>
                                            <p className="truncate text-[11px] font-medium text-slate-500">
                                                {arrival.entry_point || 'Gate'} • {arrival.verified_at_human || 'recently'}
                                            </p>
                                        </div>
                                    </div>
                                    <Link href={`/org/arrivals/${arrival.id}`} className="shrink-0 p-2 text-slate-300 transition active:scale-95">
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            ))}
                            {recent_arrivals.length > 4 && (
                                <Link href="/org/arrivals" className="block py-2 text-xs font-bold text-[#0b4aa2]">
                                    View all {recent_arrivals.length} <ArrowRight className="inline h-3 w-3 ml-0.5 relative -top-[0.5px]" />
                                </Link>
                            )}
                        </div>
                    )}
                </section>

                {/* 6. RECENT ACTIVITY (Elastic) */}
                <section className="px-4 sm:px-6 lg:px-8 mt-5 space-y-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Recent Activity</h3>
                    {recent_activity.length === 0 ? (
                        <p className="text-[13px] text-slate-600 font-medium">No movement yet today.</p>
                    ) : (
                        <div className="space-y-2">
                            {recent_activity.slice(0, 5).map((item) => (
                                <div key={item.id} className="flex flex-col py-2.5 border-b border-slate-100 last:border-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{item.time_human}</p>
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="text-[13px] font-medium text-slate-800 leading-snug">{item.description}</p>
                                        <Link href="/org/arrivals/history" className="shrink-0 p-1 text-slate-300 transition active:scale-95">
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                            {recent_activity.length > 5 && (
                                <Link href="/org/arrivals/history" className="block py-2 text-xs font-bold text-[#0b4aa2]">
                                    View activity history <ArrowRight className="inline h-3 w-3 ml-0.5 relative -top-[0.5px]" />
                                </Link>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </OrganizationLayout>
    );
}
