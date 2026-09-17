import { Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronRight,
    MapPin,
    ShieldCheck,
    UserPlus,
    UserCircle,
    Clock,
    History,
} from 'lucide-react';
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
    total_access_members?: number;
    metrics: MetricProps;
    recent_arrivals: Arrival[];
    pending_arrivals: Arrival[];
    recent_activity: ActivityItem[];
}

export default function Dashboard({ organization, total_access_members = 0, metrics, recent_arrivals = [], pending_arrivals = [], recent_activity = [] }: Props) {
    const page = usePage();
    const auth = (page.props as any).auth || {};
    const user = auth.user || {};

    const currentlyHere = metrics.currently_inside ?? 0;
    const pendingTotal = pending_arrivals.length;
    const overdueTotal = metrics.overdue_confirmation ?? 0;

    // Total people that require attention (pending or overdue)
    const waitingCount = pendingTotal + overdueTotal;

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
              bg: 'bg-rose-50',
          }
        : needsAttention
          ? {
                label: 'Needs attention',
                dot: 'bg-amber-500',
                text: 'text-amber-700',
                bg: 'bg-amber-50',
            }
          : {
                label: 'All systems normal',
                dot: 'bg-emerald-500',
                text: 'text-emerald-700',
                bg: 'bg-emerald-50/50',
            };

    const initialsFor = (name: string) => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-[#eef4ff] text-[#0b4aa2]', // Pale blue
            'bg-[#fdf4ff] text-[#a21caf]', // Pale fuchsia
            'bg-[#f0fdf4] text-[#15803d]', // Pale green
            'bg-[#fff1f2] text-[#be123c]', // Pale rose
            'bg-[#fffbeb] text-[#b45309]', // Pale amber
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const getStatusConfig = (item: ActivityItem) => {
        if (item.type === 'checkout') {
            return {
                label: 'Checked out',
                dot: 'bg-slate-400',
                badge: 'bg-slate-100 text-slate-700 border-slate-200',
            };
        }
        if (item.type === 'confirmed') {
            return {
                label: 'Confirmed',
                dot: 'bg-emerald-500',
                badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            };
        }
        // Arrival (either waiting or inside)
        if (item.is_active && organization.arrival_confirmation_required) {
            // Check if it's in pending_arrivals
            const isWaiting = pending_arrivals.some(pa => pa.visitor_name === item.name);
            if (isWaiting) {
                return {
                    label: 'Waiting',
                    dot: 'bg-amber-500',
                    badge: 'bg-amber-50 text-amber-700 border-amber-100',
                };
            }
        }
        return {
            label: 'Inside',
            dot: 'bg-emerald-500',
            badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        };
    };

    return (
        <OrganizationLayout title="Home" transparentHeader contentClassName="w-full relative min-h-screen">
            <Head title={`${organization.name} - Home`} />

            {/* ATMOSPHERIC BACKGROUND */}
            <div className="app-atmosphere" />

            <div className="flex flex-col gap-4 px-4 pt-2 pb-24 max-w-[480px] mx-auto">
                {/* ORGANIZATION CONTEXT */}
                <header className="flex flex-col">
                    <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5">
                        {getGreeting()}, {userFirstName}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#071f4b] leading-tight">{organization.name}</h1>
                        <Link href="/org/access-list?action=add_person" className="flex items-center gap-1.5 rounded-full bg-[#f0f6ff] px-3 py-1.5 text-xs font-semibold text-[#0b4aa2] shadow-[0_2px_10px_rgba(11,74,162,0.08)] transition active:scale-95 border border-[#e0edff]">
                            <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Add
                        </Link>
                    </div>
                    {organization.estate_name && (
                        <p className="mt-0.5 flex items-center gap-1 text-[13px] font-medium text-slate-500">
                            <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                            {organization.estate_name} <ChevronRight className="h-3.5 w-3.5 ml-0.5 text-slate-400" />
                        </p>
                    )}
                </header>

                {/* PRIMARY NAVY GRADIENT OVERVIEW CARD */}
                <Link href="/org/access-list" className="brand-card flex items-center justify-between p-4 active:scale-[0.98] transition-transform">
                    <div className="relative z-10 flex items-center gap-3.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm bg-white/10 backdrop-blur-sm">
                            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="flex items-center gap-1.5 text-[14px] font-semibold text-white">
                                Access Overview 
                            </h2>
                            <p className="text-[11px] font-medium text-blue-100/80 mb-1">Total people with access</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white leading-none tracking-tight">{total_access_members}</span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="relative z-10 h-5 w-5 text-white/70" strokeWidth={2.5} />
                </Link>

                {/* QUICK ACTIONS */}
                <div className="flex gap-2.5 justify-between">
                    <Link href="/org/access-list?action=add_person" className="soft-card flex flex-col flex-1 items-start p-3 transition active:scale-95">
                        <div className="mb-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg icon-tile-blue">
                            <UserPlus className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[12px] font-bold text-[#071f4b] flex items-center gap-0.5">Add</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 leading-snug">Staff</p>
                    </Link>

                    <Link href="/org/visitors" className="soft-card flex flex-col flex-1 items-start p-3 transition active:scale-95">
                        <div className="mb-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg icon-tile-mint">
                            <UserCircle className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[12px] font-bold text-[#071f4b] flex items-center gap-0.5">Invite</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 leading-snug">Visitor</p>
                    </Link>

                    <Link href="/org/arrivals" className="soft-card flex flex-col flex-1 items-start p-3 transition active:scale-95">
                        <div className="mb-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg icon-tile-lavender">
                            <Clock className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[12px] font-bold text-[#071f4b] flex items-center gap-0.5">Arrivals</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 leading-snug">On site</p>
                    </Link>

                    <Link href="/org/arrivals/history" className="soft-card flex flex-col flex-1 items-start p-3 transition active:scale-95">
                        <div className="mb-2.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg icon-tile-amber">
                            <History className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <h3 className="text-[12px] font-bold text-[#071f4b] flex items-center gap-0.5">History</h3>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-500 leading-snug">Logs</p>
                    </Link>
                </div>

                {/* TODAY MODULE */}
                <div className="soft-card flex flex-col p-3.5 pb-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-bold text-[#071f4b]">Today</h2>
                        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border ${stateConfig.bg} ${stateConfig.text} border-transparent`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${stateConfig.dot}`} />
                            {stateConfig.label}
                        </div>
                    </div>
                    
                    <div className="flex items-stretch justify-between">
                        <Link href="/org/arrivals" className="flex flex-1 flex-col items-center relative px-1 hover:bg-slate-50 rounded-lg py-1.5 transition group">
                            <span className="text-[18px] font-bold text-[#071f4b] leading-tight mb-0.5">{currentlyHere}</span>
                            <span className="text-[10px] font-medium text-slate-500">Inside</span>
                        </Link>
                        
                        <div className="w-[1px] h-10 bg-slate-100 self-center mx-1" />

                        <Link href="/org/arrivals" className="flex flex-1 flex-col items-center relative px-1 hover:bg-slate-50 rounded-lg py-1.5 transition group">
                            <span className="text-[18px] font-bold text-[#071f4b] leading-tight mb-0.5">{waitingCount}</span>
                            <span className="text-[10px] font-medium text-slate-500">Waiting</span>
                        </Link>

                        <div className="w-[1px] h-10 bg-slate-100 self-center mx-1" />

                        <Link href="/org/arrivals" className="flex flex-1 flex-col items-center relative px-1 hover:bg-slate-50 rounded-lg py-1.5 transition group">
                            <span className="text-[18px] font-bold text-[#071f4b] leading-tight mb-0.5">{waitingCount}</span>
                            <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">Attention</span>
                        </Link>

                        <div className="w-[1px] h-10 bg-slate-100 self-center mx-1" />

                        <Link href="/org/arrivals" className="flex flex-1 flex-col items-center relative px-1 hover:bg-slate-50 rounded-lg py-1.5 transition group">
                            <span className="text-[18px] font-bold text-[#071f4b] leading-tight mb-0.5">{metrics.today_entries}</span>
                            <span className="text-[10px] font-medium text-slate-500 whitespace-nowrap">Total</span>
                        </Link>
                    </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <h2 className="text-[14px] font-bold text-[#071f4b]">Recent Activity</h2>
                        <Link href="/org/arrivals/history" className="text-[11px] font-semibold text-slate-500 hover:text-[#0b4aa2] flex items-center transition">
                            View all <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Link>
                    </div>

                    {recent_activity.length === 0 ? (
                        <div className="soft-card p-4 text-center">
                            <p className="text-[12px] font-medium text-slate-500">No movement yet today.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {recent_activity.slice(0, 5).map((item) => {
                                const statusConfig = getStatusConfig(item);
                                const isOngoing = item.type !== 'checkout';
                                
                                return (
                                    <Link 
                                        key={item.id} 
                                        href={`/org/arrivals/${item.id}`} 
                                        className="soft-card flex items-center justify-between p-3 transition active:scale-[0.98]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getAvatarColor(item.name)} text-[13px] font-bold`}>
                                                {initialsFor(item.name)}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate text-[14px] font-bold text-[#071f4b]">{item.name}</span>
                                                    <div className={`flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wider border ${statusConfig.badge}`}>
                                                        <span className={`h-1 w-1 rounded-full ${statusConfig.dot}`} />
                                                        {statusConfig.label}
                                                    </div>
                                                </div>
                                                <span className="truncate text-[11px] font-medium text-slate-500 mt-0.5">
                                                    {isOngoing ? 'Visitor · Ongoing' : 'Visitor · Completed'}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end shrink-0 ml-2">
                                            <span className="text-[11px] font-medium text-slate-500 mb-0.5">{item.time_human}</span>
                                            <div className="flex items-center text-[11px] font-medium text-slate-400">
                                                Gate <ChevronRight className="h-3 w-3 ml-0.5" />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
