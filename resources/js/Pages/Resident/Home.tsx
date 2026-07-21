import { Head, Link, usePage, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, ChevronRight, Wallet, Users, AlertCircle, Bell, Plus, CheckCircle2, Clock, Calendar, ArrowRight, Activity, PlusCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import resident from '@/routes/resident';
import type { SharedData } from '@/types';
import type { EstateBoardPost } from '@/types';
import CommandCenter from '@/Components/Resident/Dashboard/CommandCenter';
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
    activeCodes: AccessCode[];
    recentActivity: ActivityItem[];
    latestAnnouncements: EstateBoardPost[];
    estateName: string;
    unpaidDues?: UnpaidDue[];
    openIncidentsCount: number;
    activePassesCount: number;
    upcomingPassesCount: number;
    unpaidDuesCount: number;
    totalUnpaidDuesAmount: number;
};

export default function Home({
    auth,
    stats,
    activeCodes,
    recentActivity,
    latestAnnouncements,
    estateName,
    unpaidDues = [],
    openIncidentsCount = 0,
    activePassesCount = 0,
    upcomingPassesCount = 0,
    unpaidDuesCount = 0,
    totalUnpaidDuesAmount = 0
}: Props) {
    const userRoles = auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const parentResidentName = auth?.user?.resident_subscription?.parent_resident_name;

    const { estate_plan } = usePage<SharedData & { estate_plan: { features: string[] } | null }>().props;
    const hasAccessCodeGen = estate_plan?.features?.includes('access-code-generation') ?? true;
    const hasLiveFeed = estate_plan?.features?.includes('real-time-visit-feed') ?? true;
    const hasEstateBoard = estate_plan?.features?.includes('interactive-notice-board') ?? true;
    const hasPaymentCollection = estate_plan?.features?.includes('payment-collection') ?? true;

    // Greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Calculate expiring passes (within 2 hours)
    const now = new Date();
    const expiringPasses = activeCodes.filter(code => {
        if (!code.expires_at) return false;
        const diffMs = new Date(code.expires_at).getTime() - now.getTime();
        return diffMs > 0 && diffMs < 2 * 60 * 60 * 1000;
    });

    const attentionItems: any[] = [];

    if (hasPaymentCollection && unpaidDuesCount > 0) {
        attentionItems.push({
            type: 'dues',
            title: 'Outstanding Estate Dues',
            desc: `You have ${unpaidDuesCount} pending payment${unpaidDuesCount > 1 ? 's' : ''} totaling ₦${totalUnpaidDuesAmount.toLocaleString()}`,
            href: '/resident/dues',
            color: 'border-rose-100 bg-rose-50/30 text-rose-700'
        });
    }

    if (activePassesCount > 0) {
        attentionItems.push({
            type: 'visitors',
            title: 'Visitors Expected Today',
            desc: `${activePassesCount} visitor pass${activePassesCount > 1 ? 'es' : ''} currently active and ready for check-in`,
            href: '/resident/visitors',
            color: 'border-indigo-100 bg-indigo-50/20 text-indigo-700'
        });
    }

    if (expiringPasses.length > 0) {
        attentionItems.push({
            type: 'expiring',
            title: 'Visitor Pass Expiring Soon',
            desc: `${expiringPasses[0].visitor_name || 'Visitor'}'s pass is expiring shortly`,
            href: `/resident/visitors/${expiringPasses[0].id}`,
            color: 'border-amber-100 bg-amber-50/30 text-amber-700'
        });
    }

    if (openIncidentsCount > 0) {
        attentionItems.push({
            type: 'incidents',
            title: 'Pending Incidents',
            desc: `You have ${openIncidentsCount} unresolved security or estate incident${openIncidentsCount > 1 ? 's' : ''}`,
            href: '/resident/incidents',
            color: 'border-slate-200 bg-slate-50/40 text-slate-700'
        });
    }

    if (auth?.user?.unread_notifications_count && auth.user.unread_notifications_count > 0) {
        attentionItems.push({
            type: 'notifications',
            title: 'Unread Announcements',
            desc: `There are ${auth.user.unread_notifications_count} unread notifications/announcements`,
            href: '/resident/notifications',
            color: 'border-blue-100 bg-blue-50/20 text-blue-700'
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

            <div className="mx-auto max-w-2xl space-y-5 pb-24 px-1.5">
                
                {/* HEADER */}
                <div className="flex items-center justify-between py-1">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-450">{getGreeting()}</span>
                        <h1 className="text-lg font-bold text-slate-900 tracking-tight">{estateName}</h1>
                        {isHouseholdMember && parentResidentName && (
                            <span className="text-[10px] font-medium text-slate-400">Household member of {parentResidentName}</span>
                        )}
                    </div>
                </div>

                {/* HERO COMMAND CENTER */}
                <CommandCenter
                    expectedToday={stats?.expectedToday ?? 0}
                    lastActivity={recentActivity[0]?.message}
                    onAction={() => router.visit('/resident/visitors/create')}
                    canGenerate={hasAccessCodeGen}
                />

                {/* SECTION 1: ATTENTION CENTER */}
                <section className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1">Attention Center</h3>
                    {attentionItems.length > 0 ? (
                        <div className="space-y-2">
                            {attentionItems.map((item, index) => {
                                const CardContent = (
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                            <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-normal">{item.desc}</p>
                                        </div>
                                        {item.href && <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />}
                                    </div>
                                );

                                return item.href ? (
                                    <Link
                                        key={index}
                                        href={item.href}
                                        className={`block rounded-2xl border p-3.5 transition-all active:scale-99 hover:bg-slate-50/30 ${item.color}`}
                                    >
                                        {CardContent}
                                    </Link>
                                ) : (
                                    <div
                                        key={index}
                                        className={`rounded-2xl border p-3.5 ${item.color}`}
                                    >
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
                                <p className="mt-0.5 text-[11px] font-medium text-emerald-600/90 leading-tight">
                                    No outstanding dues • No expected visitors today • No unresolved incidents
                                </p>
                            </div>
                        </div>
                    )}
                </section>

                {/* SECTION 2: TODAY'S SNAPSHOT (4 Compact Summary Cards) */}
                <section className="space-y-2">
                    <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-1">Today's Snapshot</h3>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        
                        {/* Visitors Card */}
                        <Link
                            href="/resident/visitors"
                            className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center justify-between transition-all hover:bg-slate-50/40 active:scale-97 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                        >
                            <div className="min-w-0">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Visitors</span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">{activePassesCount}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-650">
                                <Users className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Outstanding Dues Card */}
                        <Link
                            href="/resident/dues"
                            className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center justify-between transition-all hover:bg-slate-50/40 active:scale-97 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                        >
                            <div className="min-w-0">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Dues</span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">₦{totalUnpaidDuesAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-650">
                                <Wallet className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Announcements Card */}
                        <Link
                            href="/resident/estate-board"
                            className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center justify-between transition-all hover:bg-slate-50/40 active:scale-97 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                        >
                            <div className="min-w-0">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Updates</span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">{latestAnnouncements?.length ?? 0}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-650">
                                <Megaphone className="h-4 w-4" />
                            </div>
                        </Link>

                        {/* Open Incidents Card */}
                        <Link
                            href="/resident/incidents"
                            className="rounded-2xl border border-slate-100 bg-white p-3 flex items-center justify-between transition-all hover:bg-slate-50/40 active:scale-97 shadow-[0_1px_4px_rgba(0,0,0,0.01)]"
                        >
                            <div className="min-w-0">
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Incidents</span>
                                <span className="text-base font-bold text-slate-900 mt-0.5 block">{openIncidentsCount}</span>
                            </div>
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-650">
                                <AlertCircle className="h-4 w-4" />
                            </div>
                        </Link>

                    </div>
                </section>


                {/* SECTION 4: ESTATE UPDATES */}
                {hasEstateBoard && latestAnnouncements && latestAnnouncements.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Estate Updates</h3>
                            <Link href="/resident/estate-board" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-755 uppercase tracking-wide">
                                View All
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white divide-y divide-slate-50 overflow-hidden shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                            {latestAnnouncements.slice(0, 3).map((post) => (
                                <Link
                                    key={post.id}
                                    href={`/resident/estate-board/${post.hashid}`}
                                    className="group flex items-center gap-3 p-3.5 hover:bg-slate-50/30 transition-colors"
                                >
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                        <Megaphone className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="truncate text-xs font-semibold text-slate-800 group-hover:text-indigo-650 transition-colors">
                                            {post.title}
                                        </h4>
                                        <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                            {formatDistanceToNow(new Date(post.published_at || post.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-800 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 5: RECENT ACTIVITY */}
                {hasLiveFeed && recentActivity && recentActivity.length > 0 && (
                    <section className="space-y-2">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent Activity</h3>
                            <Link href="/resident/activity" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-755 uppercase tracking-wide">
                                View All
                            </Link>
                        </div>
                        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_1px_5px_rgba(0,0,0,0.01)]">
                            <div className="space-y-4">
                                {recentActivity.slice(0, 3).map((activity, i) => (
                                    <div key={i} className="relative flex items-start gap-3 text-xs">
                                        {i < Math.min(recentActivity.length, 3) - 1 && (
                                            <div className="absolute top-6 bottom-[-18px] left-[9px] w-0.5 bg-slate-50" />
                                        )}
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-50 border border-slate-100/50">
                                            {getActivityIcon(activity.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-slate-700 leading-normal">
                                                {activity.message}
                                            </p>
                                            <p className="mt-0.5 text-[9px] font-medium text-slate-400">
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

            </div>
        </>
    );
}
