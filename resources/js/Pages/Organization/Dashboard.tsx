import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, DoorOpen, MapPin, Radio, ShieldCheck, Users } from 'lucide-react';
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
    const arrivalsToday = metrics.today_entries ?? 0;
    const pendingTotal = pending_arrivals.length;
    const confirmedToday = metrics.confirmed ?? 0;
    const isQuiet = currentlyHere === 0 && arrivalsToday === 0 && pendingTotal === 0;
    const isBusy = currentlyHere >= 10 || arrivalsToday >= 20;
    const needsAttention = pendingTotal > 0 || (metrics.overdue_confirmation ?? 0) > 0;
    const userFirstName = user.name ? user.name.split(' ')[0] : organization.name;

    const getGreeting = () => {
        const hour = new Date().getHours();

        if (hour < 12) {
            return 'Good morning';
        }

        if (hour < 17) {
            return 'Good afternoon';
        }

        return 'Good evening';
    };

    const operatingState = needsAttention
        ? {
              label: 'Needs confirmation',
              tone: 'text-amber-200',
              summary: `${pendingTotal} ${pendingTotal === 1 ? 'arrival needs' : 'arrivals need'} your team.`,
          }
        : isBusy
          ? {
                label: 'Busy today',
                tone: 'text-sky-200',
                summary: `${arrivalsToday} arrivals have moved through ${organization.name}.`,
            }
          : isQuiet
            ? {
                  label: 'Quiet now',
                  tone: 'text-emerald-200',
                  summary: 'No one is currently checked in. The day is clear.',
              }
            : {
                  label: 'Active',
                  tone: 'text-emerald-200',
                  summary: `${currentlyHere} ${currentlyHere === 1 ? 'person is' : 'people are'} currently on-site.`,
              };

    const activityIcon = (item: ActivityItem) => {
        if (item.type === 'confirmed') {
            return <CheckCircle2 className="h-4 w-4" />;
        }

        if (item.type === 'checkout') {
            return <DoorOpen className="h-4 w-4" />;
        }

        return <Radio className="h-4 w-4" />;
    };

    return (
        <OrganizationLayout title="Home" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - Home`} />

            <div className="space-y-5">
                <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(20rem,0.8fr)]">
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#0c192c] via-[#0f233d] to-[#0a1322] p-4 text-white shadow-[0_24px_70px_rgba(10,25,47,0.22)] ring-1 ring-white/10 sm:rounded-[2rem] sm:p-8 lg:min-h-[25rem]">
                        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
                        <div className="relative flex h-full flex-col justify-between gap-7 sm:gap-10">
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200 ring-1 ring-white/15 backdrop-blur-sm">
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)]" />
                                        <span>{operatingState.label}</span>
                                    </div>
                                    {organization.estate_name && (
                                        <span className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300 ring-1 ring-white/10 backdrop-blur-sm">
                                            {organization.estate_name}
                                        </span>
                                    )}
                                </div>

                                <div className="max-w-2xl space-y-3">
                                    <p className="text-sm font-medium tracking-normal text-slate-300">
                                        {getGreeting()}, {userFirstName}
                                    </p>
                                    <h1 className="text-[1.85rem] leading-[1.12] font-bold tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
                                        {organization.name} today
                                    </h1>
                                    <p className={`max-w-lg text-sm leading-relaxed font-normal sm:text-base ${operatingState.tone}`}>
                                        {operatingState.summary}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xs transition-colors sm:rounded-[1.35rem] sm:p-4">
                                    <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl sm:font-extrabold">{currentlyHere}</p>
                                    <p className="mt-1 text-xs font-medium tracking-normal text-slate-300">Here now</p>
                                </div>
                                <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xs transition-colors sm:rounded-[1.35rem] sm:p-4">
                                    <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl sm:font-extrabold">{arrivalsToday}</p>
                                    <p className="mt-1 text-xs font-medium tracking-normal text-slate-300">Arrivals today</p>
                                </div>
                                <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xs transition-colors sm:rounded-[1.35rem] sm:p-4">
                                    <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl sm:font-extrabold">{confirmedToday}</p>
                                    <p className="mt-1 text-xs font-medium tracking-normal text-slate-300">Confirmed</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                        {needsAttention ? (
                            <div className="space-y-5">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Confirm arrivals</h2>
                                        <p className="mt-1 text-sm leading-normal font-normal text-slate-600">
                                            Visitors are waiting for your team to confirm they reached {organization.name}.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {pending_arrivals.slice(0, 3).map((arrival) => (
                                        <Link
                                            key={arrival.id}
                                            href="/org/arrivals"
                                            className="block rounded-2xl border border-amber-200 bg-amber-50/80 p-3 transition hover:bg-amber-100/70"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-amber-950">{arrival.visitor_name}</p>
                                                    <p className="mt-0.5 truncate text-xs font-normal text-amber-800">
                                                        {arrival.entry_point || 'Gate'} at {arrival.verified_at_human || 'recently'}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 shrink-0 text-amber-700" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <Link
                                    href="/org/arrivals"
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f172a] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition-transform active:scale-[0.99]"
                                >
                                    Review arrivals
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex h-full flex-col justify-between gap-8">
                                <div className="space-y-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Ready for today</h2>
                                        <p className="mt-1 text-sm leading-normal font-normal text-slate-600">
                                            Your organization context is clear. Track arrivals, manage access, and read estate updates from here.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Link
                                        href="/org/arrivals"
                                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200/60 transition hover:bg-slate-100"
                                    >
                                        <span>View current presence</span>
                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                    </Link>
                                    <Link
                                        href="/org/access-list"
                                        className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-200/60 transition hover:bg-slate-100"
                                    >
                                        <span>Manage access list</span>
                                        <ArrowRight className="h-4 w-4 text-slate-400" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </aside>
                </section>

                <section className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">On site now</h2>
                                <p className="mt-1 text-sm font-normal text-slate-500">People currently checked in for {organization.name}.</p>
                            </div>
                            <Users className="h-5 w-5 text-slate-400" />
                        </div>

                        {recent_arrivals.length === 0 ? (
                            <div className="mt-8 rounded-[1.5rem] bg-slate-50 p-5">
                                <p className="text-sm font-semibold text-slate-800 sm:text-base">No one is on-site.</p>
                                <p className="mt-2 text-sm leading-normal font-normal text-slate-600">
                                    When the gate checks someone in, their visit will appear here with time, point of entry, and confirmation state.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-5 divide-y divide-slate-100">
                                {recent_arrivals.slice(0, 6).map((arrival) => (
                                    <div key={arrival.id} className="flex items-center gap-3 py-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf2ff] text-sm font-bold text-[#0b4aa2]">
                                            {arrival.visitor_name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-900">{arrival.visitor_name}</p>
                                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-normal text-slate-500">
                                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                                <span className="truncate">
                                                    {arrival.entry_point || 'Gate'} at {arrival.verified_at_human || 'recently'}
                                                </span>
                                            </p>
                                        </div>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
                                                arrival.confirmation_state === 'CONFIRMED'
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : arrival.confirmation_state === 'OVERDUE'
                                                      ? 'bg-rose-50 text-rose-700'
                                                      : arrival.confirmation_state === 'PENDING'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {arrival.confirmation_state === 'NOT_REQUIRED' ? 'Cleared' : arrival.confirmation_state.toLowerCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Recent movement</h2>
                                <p className="mt-1 text-sm font-normal text-slate-500">A compact record of what just changed.</p>
                            </div>
                            <Link
                                href="/org/arrivals/history"
                                className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80 transition-colors hover:bg-slate-100"
                            >
                                History
                            </Link>
                        </div>

                        {recent_activity.length === 0 ? (
                            <div className="mt-8 flex gap-4 rounded-[1.5rem] bg-slate-50 p-5">
                                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 sm:text-base">No movement yet.</p>
                                    <p className="mt-2 text-sm leading-normal font-normal text-slate-600">
                                        Today will fill in naturally as arrivals are checked in, confirmed, or checked out.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 space-y-1">
                                {recent_activity.slice(0, 8).map((item) => (
                                    <div key={item.id} className="grid grid-cols-[4.6rem_minmax(0,1fr)] gap-3 py-3">
                                        <time className="text-right text-xs font-medium text-slate-400">{item.time_human}</time>
                                        <div className="flex gap-3">
                                            <span
                                                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                    item.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {activityIcon(item)}
                                            </span>
                                            <p className="min-w-0 text-sm leading-relaxed font-normal text-slate-700">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </OrganizationLayout>
    );
}
