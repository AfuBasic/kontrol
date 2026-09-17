import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    ChevronRight,
    Clock,
    History,
    MapPin,
    ShieldCheck,
    UserCircle,
    UserPlus,
    Users,
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

export default function Dashboard({
    organization,
    total_access_members = 0,
    metrics,
    recent_arrivals = [],
    pending_arrivals = [],
    recent_activity = [],
}: Props) {
    const page = usePage();
    const auth = (page.props as any).auth || {};
    const user = auth.user || {};

    const currentlyHere = metrics.currently_inside ?? 0;
    const pendingTotal = pending_arrivals.length;
    const overdueTotal = metrics.overdue_confirmation ?? 0;
    const waitingCount = pendingTotal;
    const attentionCount = overdueTotal;

    const needsAttention = attentionCount > 0 || waitingCount > 0;
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
              textColor: 'text-rose-700',
              bgColor: 'bg-rose-50',
          }
        : needsAttention
          ? {
                label: 'Needs attention',
                dot: 'bg-amber-500',
                textColor: 'text-amber-700',
                bgColor: 'bg-amber-50',
            }
          : {
                label: 'All systems normal',
                dot: 'bg-emerald-500',
                textColor: 'text-emerald-700',
                bgColor: 'bg-emerald-50/60',
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
            'bg-[#eef4ff] text-[#1a5dbf]',
            'bg-[#fdf4ff] text-[#9b1faa]',
            'bg-[#f0fdf4] text-[#0d7a44]',
            'bg-[#fff1f2] text-[#b01d38]',
            'bg-[#fffbeb] text-[#9a6010]',
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
                badge: 'bg-slate-100 text-slate-600 border-slate-200',
            };
        }
        if (item.type === 'confirmed') {
            return {
                label: 'Confirmed',
                dot: 'bg-emerald-500',
                badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            };
        }
        if (item.is_active && organization.arrival_confirmation_required) {
            const isWaiting = pending_arrivals.some((pa) => pa.visitor_name === item.name);
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

            <div className="flex flex-col gap-3.5 px-4 pt-1 pb-24 max-w-[480px] mx-auto">

                {/* ORGANIZATION IDENTITY */}
                <header className="flex flex-col pt-1">
                    <p className="text-[12px] font-medium text-slate-500">
                        {getGreeting()}, {userFirstName}
                    </p>
                    <div className="flex items-center justify-between mt-0.5">
                        <h1 className="text-[26px] font-extrabold tracking-tight text-[#071f4b] leading-tight">
                            {organization.name}
                        </h1>
                        <Link
                            href="/org/access-list?action=add_person"
                            className="flex items-center gap-1.5 rounded-full border border-[#dce9ff] bg-[#eef4ff] px-3 py-1.5 text-[12px] font-semibold text-[#1a5dbf] shadow-[0_2px_8px_rgba(26,93,191,0.10)] transition active:scale-95"
                        >
                            <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Add person
                        </Link>
                    </div>
                    {organization.estate_name && (
                        <p className="mt-0.5 flex items-center gap-1 text-[12px] font-medium text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                            {organization.estate_name}
                            <ChevronRight className="h-3 w-3 ml-0.5 text-slate-400" />
                        </p>
                    )}
                </header>

                {/* ACCESS OVERVIEW CARD */}
                <Link
                    href="/org/access-list"
                    className="brand-card flex items-center justify-between p-4 active:scale-[0.98] transition-transform"
                >
                    <div className="relative z-10 flex items-center gap-3.5">
                        <div className="brand-card-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]">
                            <ShieldCheck className="h-5 w-5 text-white" strokeWidth={2.1} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <h2 className="text-[13px] font-semibold text-white/90 flex items-center gap-1.5">
                                Access Overview
                            </h2>
                            <p className="text-[11px] text-blue-200/70">Total people with access</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-[32px] font-extrabold text-white leading-none tracking-tight">
                                    {total_access_members}
                                </span>
                            </div>
                        </div>
                    </div>
                    <ChevronRight className="relative z-10 h-5 w-5 text-white/50" strokeWidth={2.5} />
                </Link>

                {/* QUICK ACTIONS */}
                <div className="flex gap-2 justify-between">
                    <Link
                        href="/org/access-list?action=add_person"
                        className="soft-card flex flex-col flex-1 items-start p-2.5 transition active:scale-95"
                    >
                        <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] icon-tile-blue">
                            <UserPlus className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-[#071f4b] leading-tight">Add</span>
                        <span className="mt-1 text-[9px] font-medium text-slate-400 leading-snug">Staff, parents &amp; more</span>
                    </Link>

                    <Link
                        href="/org/visitors"
                        className="soft-card flex flex-col flex-1 items-start p-2.5 transition active:scale-95"
                    >
                        <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] icon-tile-mint">
                            <UserCircle className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-[#071f4b] leading-tight">Invite</span>
                        <span className="mt-1 text-[9px] font-medium text-slate-400 leading-snug">Visitor<br/>pass</span>
                    </Link>

                    <Link
                        href="/org/arrivals"
                        className="soft-card flex flex-col flex-1 items-start p-2.5 transition active:scale-95"
                    >
                        <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] icon-tile-lavender">
                            <Clock className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-[#071f4b] leading-tight">Arrivals</span>
                        <span className="mt-1 text-[9px] font-medium text-slate-400 leading-snug">Who's<br/>on site</span>
                    </Link>

                    <Link
                        href="/org/arrivals/history"
                        className="soft-card flex flex-col flex-1 items-start p-2.5 transition active:scale-95"
                    >
                        <div className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] icon-tile-amber">
                            <History className="h-4 w-4" strokeWidth={2.2} />
                        </div>
                        <span className="text-[11px] font-bold text-[#071f4b] leading-tight">History</span>
                        <span className="mt-1 text-[9px] font-medium text-slate-400 leading-snug">Past<br/>activity</span>
                    </Link>
                </div>

                {/* TODAY MODULE */}
                <div className="soft-card flex flex-col p-3.5">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[14px] font-bold text-[#071f4b]">Today</h2>
                        <div
                            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stateConfig.bgColor} ${stateConfig.textColor}`}
                        >
                            <span className={`h-1.5 w-1.5 rounded-full ${stateConfig.dot}`} />
                            {stateConfig.label}
                        </div>
                    </div>

                    {/* Metrics row */}
                    <div className="flex items-stretch justify-between">
                        {/* Inside */}
                        <Link
                            href="/org/arrivals"
                            className="flex flex-1 flex-col items-start px-1.5 py-1 hover:bg-slate-50/80 rounded-xl transition group"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg icon-tile-mint mb-1.5">
                                <Users className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </div>
                            <span className="text-[20px] font-extrabold text-[#071f4b] leading-none mb-0.5">
                                {currentlyHere}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5">
                                Inside
                                <ChevronRight className="h-2.5 w-2.5 text-slate-300 group-hover:text-slate-400 transition" />
                            </span>
                        </Link>

                        <div className="w-px bg-slate-100 self-stretch mx-0.5" />

                        {/* Waiting */}
                        <Link
                            href="/org/arrivals"
                            className="flex flex-1 flex-col items-start px-1.5 py-1 hover:bg-slate-50/80 rounded-xl transition group"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg icon-tile-lavender mb-1.5">
                                <Clock className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </div>
                            <span className="text-[20px] font-extrabold text-[#071f4b] leading-none mb-0.5">
                                {waitingCount}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5">
                                Waiting
                                <ChevronRight className="h-2.5 w-2.5 text-slate-300 group-hover:text-slate-400 transition" />
                            </span>
                        </Link>

                        <div className="w-px bg-slate-100 self-stretch mx-0.5" />

                        {/* Needs attention */}
                        <Link
                            href="/org/arrivals"
                            className="flex flex-1 flex-col items-start px-1.5 py-1 hover:bg-slate-50/80 rounded-xl transition group"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg icon-tile-amber mb-1.5">
                                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </div>
                            <span className="text-[20px] font-extrabold text-[#071f4b] leading-none mb-0.5">
                                {attentionCount}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5 whitespace-nowrap">
                                Needs attention
                                <ChevronRight className="h-2.5 w-2.5 text-slate-300 group-hover:text-slate-400 transition" />
                            </span>
                        </Link>

                        <div className="w-px bg-slate-100 self-stretch mx-0.5" />

                        {/* Arrivals today */}
                        <Link
                            href="/org/arrivals/history"
                            className="flex flex-1 flex-col items-start px-1.5 py-1 hover:bg-slate-50/80 rounded-xl transition group"
                        >
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg icon-tile-sky mb-1.5">
                                <Calendar className="h-3.5 w-3.5" strokeWidth={2.2} />
                            </div>
                            <span className="text-[20px] font-extrabold text-[#071f4b] leading-none mb-0.5">
                                {metrics.today_entries}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5 whitespace-nowrap">
                                Arrivals today
                                <ChevronRight className="h-2.5 w-2.5 text-slate-300 group-hover:text-slate-400 transition" />
                            </span>
                        </Link>
                    </div>
                </div>

                {/* RECENT ACTIVITY */}
                <div className="flex flex-col">
                    <div className="flex items-center justify-between mb-2.5 px-0.5">
                        <h2 className="text-[14px] font-bold text-[#071f4b]">Recent Activity</h2>
                        <Link
                            href="/org/arrivals/history"
                            className="text-[11px] font-semibold text-slate-500 hover:text-[#1a5dbf] flex items-center transition"
                        >
                            View all <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Link>
                    </div>

                    {recent_activity.length === 0 ? (
                        <div className="flex flex-col items-center py-5">
                            <p className="text-[12px] font-medium text-slate-400">No movement yet today</p>
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
                                        className="soft-card flex items-center justify-between px-3.5 py-3 transition active:scale-[0.98]"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div
                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] ${getAvatarColor(item.name)} text-[12px] font-bold`}
                                            >
                                                {initialsFor(item.name)}
                                            </div>
                                            <div className="flex min-w-0 flex-col">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="truncate text-[13px] font-bold text-[#071f4b]">
                                                        {item.name}
                                                    </span>
                                                    <div
                                                        className={`flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide ${statusConfig.badge}`}
                                                    >
                                                        <span className={`h-1 w-1 rounded-full ${statusConfig.dot}`} />
                                                        {statusConfig.label}
                                                    </div>
                                                </div>
                                                <span className="truncate text-[11px] font-medium text-slate-400 mt-0.5">
                                                    {isOngoing ? 'Visitor · Ongoing' : 'Visitor · Completed'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-col items-end ml-2 gap-0.5">
                                            <span className="text-[11px] font-medium text-slate-400">
                                                {item.time_human}
                                            </span>
                                            <span className="text-[10px] font-medium text-slate-300 flex items-center">
                                                Gate <ChevronRight className="h-2.5 w-2.5 ml-0.5" />
                                            </span>
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
