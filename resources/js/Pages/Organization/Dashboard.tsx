import { Head, Link } from '@inertiajs/react';
import {
    Users,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Plus,
    KeyRound,
    Building2,
    Calendar,
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
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const hasPendingConfirmations = pending_arrivals.length > 0;
    const currentlyHere = metrics.currently_inside ?? 0;
    const arrivalsToday = metrics.today_entries ?? 0;

    return (
        <OrganizationLayout title="Home">
            <Head title={`${organization.name} - Home`} />

            <div className="space-y-6">
                {/* Human Welcome Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                            {getGreeting()}, {organization.name}
                        </h1>
                        <p className="text-sm text-stone-500 mt-1 flex items-center gap-1.5">
                            <span className="font-medium text-slate-700">{organization.estate_name}</span>
                            <span>•</span>
                            <span className="capitalize">{organization.type}</span>
                        </p>
                    </div>

                    {/* Primary Quick Actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/org/access-list"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add person</span>
                        </Link>
                        <Link
                            href="/org/arrivals"
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-stone-50 text-slate-800 text-xs sm:text-sm font-medium border border-stone-200/80 shadow-xs transition-all"
                        >
                            <Clock className="w-4 h-4 text-stone-500" />
                            <span>View arrivals</span>
                        </Link>
                    </div>
                </div>

                {/* WHAT NEEDS MY ATTENTION? (Callout Banner) */}
                {hasPendingConfirmations && (
                    <div className="rounded-2xl border border-amber-200/90 bg-amber-50/70 p-4 sm:p-5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-amber-100 text-amber-800 shrink-0">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm sm:text-base font-bold text-amber-950">
                                        {pending_arrivals.length} arrival{pending_arrivals.length > 1 ? 's' : ''} waiting for confirmation
                                    </h2>
                                    <p className="text-xs sm:text-sm text-amber-800/90 mt-0.5">
                                        Visitors admitted by security who haven't been confirmed at your desk yet.
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/org/arrivals"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-800 hover:bg-amber-900 text-white text-xs sm:text-sm font-semibold transition-colors shrink-0 shadow-xs"
                            >
                                <span>Confirm arrivals</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* WHAT'S HAPPENING TODAY? */}
                <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900">
                                Today at {organization.name}
                            </h2>
                            <p className="text-xs text-stone-500 mt-0.5">
                                Real-time estate activity & presence
                            </p>
                        </div>
                        <Link
                            href="/org/arrivals"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                            <span>Live arrivals</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 flex items-center justify-center text-emerald-700 font-bold text-lg">
                                {currentlyHere}
                            </div>
                            <div>
                                <span className="text-xs text-stone-500 font-medium">Currently on-site</span>
                                <p className="text-sm sm:text-base font-bold text-slate-900">
                                    {currentlyHere === 0
                                        ? 'No one currently here'
                                        : `${currentlyHere} ${currentlyHere === 1 ? 'person is' : 'people are'} here`}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-100/80 flex items-center justify-center text-indigo-700 font-bold text-lg">
                                {arrivalsToday}
                            </div>
                            <div>
                                <span className="text-xs text-stone-500 font-medium">Arrivals today</span>
                                <p className="text-sm sm:text-base font-bold text-slate-900">
                                    {arrivalsToday === 0 ? 'No arrivals recorded today' : `${arrivalsToday} visitors recorded`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RECENT ACTIVITY & OPERATIONAL FEED */}
                <div className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                            Recent Activity
                        </h2>
                        <Link
                            href="/org/arrivals/history"
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                        >
                            <span>View history</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {recent_activity.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <Clock className="w-6 h-6" />
                            </div>
                            <h3 className="text-sm font-semibold text-slate-800">It's quiet right now</h3>
                            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                                No check-ins or exits have been recorded for {organization.name} yet today.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100">
                            {recent_activity.map((item) => (
                                <div key={item.id} className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                                item.type === 'arrival'
                                                    ? 'bg-emerald-500'
                                                    : item.type === 'confirmed'
                                                    ? 'bg-indigo-500'
                                                    : 'bg-stone-400'
                                            }`}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {item.description}
                                            </p>
                                            <span className="text-xs text-stone-400">
                                                {item.time_human}
                                            </span>
                                        </div>
                                    </div>

                                    {item.is_active && (
                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Here now
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </OrganizationLayout>
    );
}
