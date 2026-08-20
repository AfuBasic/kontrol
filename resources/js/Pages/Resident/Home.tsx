import { Deferred, Head, Link, usePage, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Megaphone,
    ChevronRight,
    Wallet,
    Users,
    AlertCircle,
    CheckCircle2,
    Clock,
    Activity,
    PlusCircle,
    XCircle,
} from 'lucide-react';
import { useMemo, } from 'react';
import CommandCenter from '@/Components/Resident/Dashboard/CommandCenter';
import { FeedItemSkeleton } from '@/Components/Skeletons';
import { OfflineState } from '@/Components/States';
import { useNetworkQuality } from '@/Hooks/useNetworkQuality';
import { useStaleData } from '@/Hooks/useStaleData';
import type { SharedData } from '@/types';
import type { EstateBoardPost } from '@/types';
import type { AccessCode, ActivityItem, HomeStats } from '@/types/access-code';

type UnpaidDue = {
    ulid: string;
    amount_due: number;
    amount_paid: number;
    status: 'pending' | 'overdue' | 'grace' | 'partial';
    due_date: string;
    collection: {
        name: string;
        description: string | null;
    };
};

type Props = SharedData & {
    stats: HomeStats;
    activeCodes?: AccessCode[] | null;
    recentActivity?: ActivityItem[] | null;
    latestAnnouncements?: EstateBoardPost[] | null;
    estateName: string;
    unpaidDues?: UnpaidDue[] | null;
    openIncidentsCount: number;
    activePassesCount: number;
    upcomingTodayCount?: number;
    upcomingFutureCount?: number;
    upcomingPassesCount?: number;
    unpaidDuesCount?: number | null;
    totalUnpaidDuesAmount?: number | null;
};

export default function Home({
    auth,
    stats,
    activeCodes,
    recentActivity,
    latestAnnouncements,
    estateName,
    unpaidDues,
    openIncidentsCount = 0,
    activePassesCount = 0,
    upcomingTodayCount = 0,
    upcomingFutureCount = 0,
    unpaidDuesCount,
    totalUnpaidDuesAmount,
}: Props) {
    const userRoles = auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const parentResidentName = auth?.user?.resident_subscription?.parent_resident_name;
    const { quality, isOnline } = useNetworkQuality();

    const shellSnapshot = useMemo(
        () => ({
            stats,
            estateName,
            openIncidentsCount,
            activePassesCount,
            upcomingTodayCount,
            upcomingFutureCount,
        }),
        [stats, estateName, openIncidentsCount, activePassesCount, upcomingTodayCount, upcomingFutureCount],
    );

    const {
        data: staleShell,
        isStale,
        cachedAt,
    } = useStaleData({
        key: 'resident-home',
        serverData: shellSnapshot,
        namespace: 'resident',
        only: ['stats', 'activePassesCount', 'upcomingTodayCount', 'upcomingFutureCount', 'openIncidentsCount'],
        revalidate: isOnline && quality !== 'offline',
    });

    const displayStats = staleShell?.stats ?? stats;
    const displayEstateName = staleShell?.estateName ?? estateName;
    const displayActivePasses = staleShell?.activePassesCount ?? activePassesCount;
    const displayUpcomingToday = staleShell?.upcomingTodayCount ?? upcomingTodayCount;
    const displayUpcomingFuture = staleShell?.upcomingFutureCount ?? upcomingFutureCount;
    const displayOpenIncidents = staleShell?.openIncidentsCount ?? openIncidentsCount;
    const codes = activeCodes ?? [];
    const activity = recentActivity ?? [];
    const announcements = latestAnnouncements ?? [];
    const dues = unpaidDues ?? [];
    const duesCount = unpaidDuesCount ?? 0;
    const duesAmount = totalUnpaidDuesAmount ?? 0;

    // Greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Calculate expiring passes (within 2 hours)
    const now = new Date();
    const expiringPasses = codes.filter((code) => {
        if (!code.expires_at) return false;
        const diffMs = new Date(code.expires_at).getTime() - now.getTime();
        return diffMs > 0 && diffMs < 2 * 60 * 60 * 1000;
    });

    const attentionItems: any[] = [];

    const { estate_plan } = usePage<SharedData & { estate_plan: { features: string[] } | null }>().props;
    const hasPaymentCollection = estate_plan?.features?.includes('payment-collection') ?? true;
    const hasAccessCodeGen = estate_plan?.features?.includes('access-codes') ?? true;

    if (hasPaymentCollection && duesCount > 0) {
        attentionItems.push({
            type: 'dues',
            title: 'Outstanding Estate Dues',
            desc: `You have ${duesCount} pending payment${duesCount > 1 ? 's' : ''} totaling ₦${duesAmount.toLocaleString()}`,
            href: '/resident/dues',
            color: 'border-rose-100 bg-rose-50/30 text-rose-700',
        });
    }

    const totalExpectedToday = displayActivePasses + displayUpcomingToday;
    if (totalExpectedToday > 0 || displayUpcomingFuture > 0) {
        let desc = '';
        let title = 'Visitors Expected Today';

        if (displayActivePasses > 0 && displayUpcomingToday > 0) {
            desc = `${displayActivePasses} active and ${displayUpcomingToday} upcoming visitor pass${totalExpectedToday > 1 ? 'es' : ''} expected today`;
            if (displayUpcomingFuture > 0) {
                desc += ` (${displayUpcomingFuture} scheduled for upcoming days)`;
            }
        } else if (displayActivePasses > 0 && displayUpcomingToday === 0) {
            desc = `${displayActivePasses} visitor pass${displayActivePasses > 1 ? 'es' : ''} currently active today`;
            if (displayUpcomingFuture > 0) {
                desc += ` · ${displayUpcomingFuture} scheduled for upcoming days`;
            }
        } else if (displayUpcomingToday > 0) {
            desc = `${displayUpcomingToday} visitor pass${displayUpcomingToday > 1 ? 'es' : ''} scheduled for later today`;
            if (displayUpcomingFuture > 0) {
                desc += ` · ${displayUpcomingFuture} scheduled for upcoming days`;
            }
        } else if (displayUpcomingFuture > 0) {
            title = 'Upcoming Visitor Passes';
            desc = `${displayUpcomingFuture} visitor pass${displayUpcomingFuture > 1 ? 'es' : ''} scheduled for upcoming days`;
        }

        attentionItems.push({
            type: 'visitors',
            title,
            desc,
            href: '/resident/visitors',
            color: 'border-indigo-100 bg-indigo-50/20 text-indigo-700',
        });
    }

    if (expiringPasses.length > 0) {
        attentionItems.push({
            type: 'expiring',
            title: 'Visitor Pass Expiring Soon',
            desc: `${expiringPasses[0].visitor_name || 'Visitor'}'s pass is expiring shortly`,
            href: `/resident/visitors/${expiringPasses[0].id}`,
            color: 'border-amber-100 bg-amber-50/30 text-amber-700',
        });
    }

    if (displayOpenIncidents > 0) {
        attentionItems.push({
            type: 'incidents',
            title: 'Pending Incidents',
            desc: `You have ${displayOpenIncidents} unresolved security or estate incident${displayOpenIncidents > 1 ? 's' : ''}`,
            href: '/resident/incidents',
            color: 'border-slate-200 bg-slate-50/40 text-slate-700',
        });
    }

    if (auth?.user?.unread_notifications_count && auth.user.unread_notifications_count > 0) {
        attentionItems.push({
            type: 'notifications',
            title: 'Unread Notifications',
            desc: `You have ${auth.user.unread_notifications_count} unread notification${auth.user.unread_notifications_count > 1 ? 's' : ''}`,
            href: '/resident/activity?tab=notifications',
            color: 'border-blue-100 bg-blue-50/20 text-blue-700',
        });
    }

    // Timeline icons helper
    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'created':
                return <PlusCircle className="h-4 w-4 text-indigo-500" />;
            case 'used':
                return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
            case 'expired':
                return <Clock className="h-4 w-4 text-amber-500" />;
            case 'revoked':
                return <XCircle className="h-4 w-4 text-rose-500" />;
            default:
                return <Activity className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <>
            <Head title="Home" />

            <div className="mx-auto max-w-xl space-y-3 px-0.5 pb-20">
                {/* HEADER */}
                <div className="flex items-center justify-between py-0.5">
                    <div className="flex flex-col">
                        <span className="text-slate-450 text-xs font-semibold">{getGreeting()}</span>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">{displayEstateName}</h1>
                        {isHouseholdMember && parentResidentName && (
                            <span className="text-[10px] font-medium text-slate-400">Household member of {parentResidentName}</span>
                        )}
                        {isStale && cachedAt && <span className="text-[10px] font-medium text-amber-600">Showing last saved home data</span>}
                    </div>
                </div>

                {/* HERO COMMAND CENTER */}
                <CommandCenter
                    expectedToday={(displayStats as any)?.expectedToday ?? (displayStats as any)?.total_expected ?? 0}
                    lastActivity={activity[0]?.message}
                    onAction={() => router.visit('/resident/visitors/create')}
                    canGenerate={hasAccessCodeGen}
                />

                {/* SECTION 1: ATTENTION CENTER */}
                <section className="space-y-2">
                    <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Attention Center</h3>
                    {attentionItems.length > 0 ? (
                        <div className="space-y-2">
                            {attentionItems.map((item, index) => {
                                const CardContent = (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                            <p className="mt-0.5 text-[11px] leading-normal font-medium text-slate-500">{item.desc}</p>
                                        </div>
                                        {item.href && <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />}
                                    </div>
                                );

                                return item.href ? (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className={`block rounded-2xl border p-3.5 transition-all hover:bg-slate-50/30 active:scale-99 ${item.color}`}
                                    >
                                        {CardContent}
                                    </Link>
                                ) : (
                                    <div key={index} className={`rounded-2xl border p-3.5 ${item.color}`}>
                                        {CardContent}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-emerald-800">Everything looks good</h4>
                                <p className="mt-0.5 text-[11px] leading-tight font-medium text-emerald-600/90">
                                    No outstanding dues • No expected visitors today • No unresolved incidents
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION 2: TODAY'S SNAPSHOT (4 Compact Summary Cards) */}
                <section className="space-y-2">
                    <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Today's Snapshot</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {/* Visitors Card */}
                        <Link
                            href="/resident/visitors"
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/40 active:scale-97"
                        >
                            <div className="min-w-0">
                                <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Visitors</span>
                                <span className="mt-0.5 block text-base font-bold text-slate-900">{displayActivePasses + displayUpcomingPasses}</span>
                            </div>
                            <div className="text-indigo-650 flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50">
                                <Users className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Outstanding Dues Card */}
                        <Link
                            href="/resident/dues"
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/40 active:scale-97"
                        >
                            <div className="min-w-0">
                                <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Dues</span>
                                <span className="mt-0.5 block text-base font-bold text-slate-900">₦{duesAmount.toLocaleString()}</span>
                            </div>
                            <div className="text-rose-650 flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Announcements Card */}
                        <Link
                            href="/resident/estate-board"
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/40 active:scale-97"
                        >
                            <div className="min-w-0">
                                <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Updates</span>
                                <span className="mt-0.5 block text-base font-bold text-slate-900">{announcements.length}</span>
                            </div>
                            <div className="text-amber-650 flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
                                <Megaphone className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Open Incidents Card */}
                        <Link
                            href="/resident/incidents"
                            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-all hover:bg-slate-50/40 active:scale-97"
                        >
                            <div className="min-w-0">
                                <span className="block text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Incidents</span>
                                <span className="mt-0.5 block text-base font-bold text-slate-900">{displayOpenIncidents}</span>
                            </div>
                            <div className="text-slate-650 flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                        </Link>
                    </div>
                </section>

                {/* SECTION 4: ESTATE UPDATES */}
                {hasEstateBoard && (
                    <Deferred data="latestAnnouncements" fallback={<FeedItemSkeleton count={2} />}>
                        {announcements.length > 0 && (
                            <section className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate Updates</h3>
                                    <Link
                                        href="/resident/estate-board"
                                        className="text-[10px] font-bold tracking-wide text-indigo-600 uppercase hover:text-indigo-700"
                                    >
                                        View All
                                    </Link>
                                </div>
                                <div className="divide-y divide-slate-50 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                                    {announcements.slice(0, 3).map((post) => (
                                        <Link
                                            key={post.id}
                                            href={`/resident/estate-board/${post.hashid}`}
                                            className="group flex items-center gap-3 p-3.5 transition-colors hover:bg-slate-50/30"
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                                <Megaphone className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="group-hover:text-indigo-650 truncate text-xs font-semibold text-slate-800 transition-colors">
                                                    {post.title}
                                                </h4>
                                                <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                                    {formatDistanceToNow(new Date(post.published_at || post.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-800" />
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </Deferred>
                )}

                {/* SECTION 5: RECENT ACTIVITY */}
                {hasLiveFeed &&
                    (!isOnline || quality === 'offline' ? (
                        <section className="space-y-2">
                            <h3 className="px-1 text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Activity</h3>
                            <div className="rounded-2xl border border-slate-100 bg-white">
                                <OfflineState
                                    className="py-8"
                                    title="Activity unavailable offline"
                                    message="Reconnect to refresh your live visit feed."
                                    lastCachedAt={cachedAt}
                                />
                            </div>
                        </section>
                    ) : (
                        <Deferred data="recentActivity" fallback={<FeedItemSkeleton count={3} />}>
                            {activity.length > 0 && (
                                <section className="space-y-2">
                                    <div className="flex items-center justify-between px-1">
                                        <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Activity</h3>
                                        <Link
                                            href="/resident/activity"
                                            className="text-[10px] font-bold tracking-wide text-indigo-600 uppercase hover:text-indigo-700"
                                        >
                                            View All
                                        </Link>
                                    </div>
                                    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                                        <div className="space-y-4">
                                            {activity.slice(0, 3).map((item, i) => (
                                                <div key={i} className="relative flex items-start gap-3 text-xs">
                                                    {i < Math.min(activity.length, 3) - 1 && (
                                                        <div className="absolute top-6 bottom-[-18px] left-[9px] w-0.5 bg-slate-50" />
                                                    )}
                                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-slate-100/50 bg-slate-50">
                                                        {getActivityIcon(item.type)}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="leading-normal font-semibold text-slate-700">{item.message}</p>
                                                        <p className="mt-0.5 text-[9px] font-medium text-slate-400">{item.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </Deferred>
                    ))}
            </div>
        </>
    );
}
