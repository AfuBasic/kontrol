import { Head, Link, usePage } from '@inertiajs/react';
import {
    Clock,
    AlertCircle,
    ArrowRight,
    Plus,
    CheckCircle2,
    ChevronRight,
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
    metrics: MetricProps;
    recent_arrivals: Arrival[];
    pending_arrivals: Arrival[];
    recent_activity: ActivityItem[];
}

export default function Dashboard({
    organization,
    membership,
    metrics,
    recent_arrivals = [],
    pending_arrivals = [],
    recent_activity = [],
}: Props) {
    const page = usePage();
    const auth = (page.props as any).auth || {};
    const user = auth.user || {};

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    // User first name greeting fallback
    const userFirstName = user.name ? user.name.split(' ')[0] : organization.name;

    const hasPendingConfirmations = pending_arrivals.length > 0;
    const currentlyHere = metrics.currently_inside ?? 0;
    const arrivalsToday = metrics.today_entries ?? 0;
    const isQuiet = currentlyHere === 0 && arrivalsToday === 0 && !hasPendingConfirmations;

    return (
        <OrganizationLayout title="Home">
            <Head title={`${organization.name} - Home`} />

            <div className="space-y-8 max-w-3xl">
                {/* CALM GREETING & CONTEXT */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        {getGreeting()}, {userFirstName}
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 mt-1">
                        {organization.name} · {organization.estate_name}
                    </p>
                </div>

                {/* NEEDS ATTENTION (Earned Card - Actionable Exception) */}
                {hasPendingConfirmations && (
                    <section className="space-y-3">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">
                            Needs Your Attention
                        </h2>

                        <div className="rounded-3xl border border-amber-200/90 bg-amber-50/70 p-5 shadow-xs space-y-4">
                            {pending_arrivals.map((arrival) => (
                                <div
                                    key={arrival.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div>
                                        <h3 className="font-bold text-sm sm:text-base text-amber-950">
                                            {arrival.visitor_name}
                                        </h3>
                                        <p className="text-xs text-amber-800/90 mt-0.5">
                                            Arrived through {arrival.entry_point || 'Main Gate'} {arrival.verified_at_human || 'recently'}
                                        </p>
                                    </div>

                                    <Link
                                        href="/org/arrivals"
                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-colors self-start sm:self-auto shadow-xs"
                                    >
                                        <span>Confirm arrival</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* TODAY AT OSBA (Typographic & Spaced, No Nested KPI Boxes) */}
                <section className="space-y-3">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Today
                    </h2>

                    {isQuiet ? (
                        <div className="py-2 space-y-2">
                            <p className="text-base sm:text-lg font-bold text-slate-800">
                                It’s quiet right now.
                            </p>
                            <p className="text-sm text-slate-500">
                                No one is currently at {organization.name} and there haven’t been any arrivals today.
                            </p>
                            <div className="pt-2">
                                <Link
                                    href="/org/arrivals"
                                    className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    <span>View arrivals</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 space-y-3">
                            <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                {currentlyHere === 1
                                    ? '1 person is currently at '
                                    : `${currentlyHere} people are currently at `}
                                {organization.name}.
                            </p>

                            <p className="text-sm text-slate-500 font-medium">
                                {arrivalsToday} {arrivalsToday === 1 ? 'arrival' : 'arrivals'} today
                                {hasPendingConfirmations && ` · ${pending_arrivals.length} need your confirmation`}
                            </p>

                            <div className="pt-1">
                                <Link
                                    href="/org/arrivals"
                                    className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700"
                                >
                                    <span>Review arrivals</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </section>

                <div className="h-px bg-slate-200/60" />

                {/* RECENT ACTIVITY (Clean Editorial Feed, Not a Dashboard Box) */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Recent Activity
                        </h2>
                        {recent_activity.length > 0 && (
                            <Link
                                href="/org/arrivals/history"
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                                View all
                            </Link>
                        )}
                    </div>

                    {recent_activity.length === 0 ? (
                        <div className="py-2 space-y-1">
                            <p className="text-sm font-bold text-slate-800">Nothing here yet.</p>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Today’s activity will appear here as people arrive or leave.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {recent_activity.map((item) => (
                                <div
                                    key={item.id}
                                    className="py-3 flex items-center justify-between gap-4 text-sm"
                                >
                                    <p className="font-medium text-slate-800">
                                        {item.description}
                                    </p>
                                    <span className="text-xs text-slate-400 shrink-0 font-medium">
                                        {item.time_human}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </OrganizationLayout>
    );
}
