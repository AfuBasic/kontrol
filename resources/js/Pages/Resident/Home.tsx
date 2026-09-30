import { Head, Link, usePage, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { ChevronRight, Megaphone, AlertCircle } from 'lucide-react';
import React, { useMemo } from 'react';

import { FeedItemSkeleton } from '@/Components/Skeletons';
import AnimatedLayout from '@/Layouts/AnimatedLayout';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { EstateBoardPost, SharedData } from '@/types';
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
    upcomingPassesCount: number;
    totalScheduledCount?: number;
    unpaidDuesCount?: number | null;
    totalUnpaidDuesAmount?: number | null;
    billingPrompt?: {
        show_auto_renew_suggestion: boolean;
        payment_method: {
            type: string;
            brand: string;
            last4: string;
        } | null;
    } | null;
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
    upcomingPassesCount = 0,
    totalScheduledCount,
    unpaidDuesCount,
    totalUnpaidDuesAmount,
    billingPrompt,
}: Props) {
    const userRoles = auth?.user?.roles ?? [];
    const isHouseholdMember = userRoles.includes('household_member') && !userRoles.includes('resident');
    const parentResidentName = auth?.user?.household_parent_name;

    const { estate_plan } = usePage<SharedData & { estate_plan: { features: string[] } | null }>().props;
    const hasAccessCodeGen = estate_plan?.features?.includes('access-code-generation') ?? true;
    const hasEstateBoard = estate_plan?.features?.includes('interactive-notice-board') ?? true;

    const codes = activeCodes ?? [];
    const announcements = latestAnnouncements ?? [];
    const duesCount = unpaidDuesCount ?? 0;
    const duesAmount = totalUnpaidDuesAmount ?? 0;
    const totalExpectedToday = activePassesCount + upcomingPassesCount;

    // Build attention items — operational things that need action
    const attentionItems: Array<{
        title: string;
        desc: string;
        href: string;
    }> = [];

    if (hasAccessCodeGen && totalExpectedToday > 0) {
        let desc = '';
        if (activePassesCount > 0 && upcomingPassesCount > 0) {
            desc = `${activePassesCount} active, ${upcomingPassesCount} upcoming`;
        } else if (activePassesCount > 0) {
            desc = `${activePassesCount} active visitor pass${activePassesCount > 1 ? 'es' : ''}`;
        } else {
            desc = `${upcomingPassesCount} visitor pass${upcomingPassesCount > 1 ? 'es' : ''} expected today`;
        }
        attentionItems.push({ title: 'Visitors today', desc, href: '/resident/visitors' });
    }

    if (openIncidentsCount > 0) {
        attentionItems.push({
            title: `${openIncidentsCount} open incident${openIncidentsCount > 1 ? 's' : ''}`,
            desc: 'Unresolved security or estate incident',
            href: '/resident/incidents',
        });
    }

    if (duesCount > 0) {
        attentionItems.push({
            title: `${duesCount} payment${duesCount > 1 ? 's' : ''} due`,
            desc: `₦${duesAmount.toLocaleString()} outstanding`,
            href: '/resident/dues',
        });
    }

    // Determine state
    const hasAttention = attentionItems.length > 0;
    const hasActivity = codes.length > 0 || totalExpectedToday > 0;
    const hasUpdates = announcements.length > 0;

    return (
        <>
            <Head title="Home" />

            <div className="mx-auto max-w-xl pb-24 text-left">
                {/* Header: Greeting + Estate */}
                <div className="px-1 pt-1">
                    <p className="text-xs font-semibold text-slate-400">
                        {(() => {
                            const hour = new Date().getHours();
                            if (hour < 12) return 'Good Morning';
                            if (hour < 17) return 'Good Afternoon';
                            return 'Good Evening';
                        })()}
                    </p>
                    <h1 className="mt-0.5 text-lg font-black tracking-tight text-slate-900">{estateName}</h1>
                    {isHouseholdMember && parentResidentName && (
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                            Household member of {parentResidentName}
                        </p>
                    )}
                </div>

                {/* QUIET STATE: Nothing happening */}
                {!hasAttention && !hasActivity && !hasUpdates && (
                    <div className="mt-6 px-1">
                        <p className="text-sm font-medium text-slate-600">Everything is quiet.</p>
                        <p className="mt-1 text-xs text-slate-400">
                            No arrivals expected today.
                        </p>
                    </div>
                )}

                {/* ATTENTION: Things needing action */}
                {hasAttention && (
                    <section className="mt-5 space-y-2">
                        {attentionItems.map((item, i) => (
                            <Link
                                key={i}
                                href={item.href}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 transition-all hover:bg-slate-50/50 active:scale-[0.99]"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                                    <p className="mt-0.5 text-[11px] font-medium text-slate-500">{item.desc}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                            </Link>
                        ))}
                    </section>
                )}

                {/* ACTIVE VISITORS — quick list if there are people currently here */}
                {codes.length > 0 && (
                    <section className="mt-5">
                        <div className="space-y-1">
                            {codes.slice(0, 3).map((code) => (
                                <div
                                    key={code.id}
                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-3.5"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-900">{code.visitor_name || 'Visitor'}</p>
                                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                                            {code.expires_at
                                                ? `Expires ${new Date(code.expires_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                                                : 'Active'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* RECENT UPDATES — feed-style, not a card */}
                {hasEstateBoard && announcements.length > 0 && (
                    <section className="mt-5">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Recent updates</h3>
                            <Link
                                href="/resident/estate-board"
                                className="text-[10px] font-bold tracking-wide text-indigo-600 uppercase hover:text-indigo-700"
                            >
                                View all
                            </Link>
                        </div>
                        <div className="mt-1">
                            {announcements.slice(0, 4).map((post) => {
                                const isUnread = !post.is_read;
                                const bodyPreview = post.body
                                    ? post.body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
                                    : '';
                                const timeAgo = post.published_at
                                    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                    : formatDistanceToNow(new Date(post.created_at), { addSuffix: true });

                                return (
                                    <Link
                                        key={post.id}
                                        href={`/resident/estate-board/${post.hashid}`}
                                        className="group block border-b border-slate-100 py-3.5 last:border-b-0"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-2">
                                                {isUnread && (
                                                    <span className="mt-[3px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                                                )}
                                                <span className="truncate text-xs font-semibold text-slate-700">
                                                    {post.author?.name || 'Estate Office'}
                                                </span>
                                            </div>
                                            <span className="shrink-0 text-[11px] font-medium text-slate-400">{timeAgo}</span>
                                        </div>
                                        <h4
                                            className={`mt-1 text-[14px] leading-snug font-bold [overflow-wrap:anywhere] break-words transition-colors sm:text-[15px] ${
                                                isUnread ? 'text-slate-900' : 'text-slate-800'
                                            }`}
                                        >
                                            {post.title || 'Untitled Announcement'}
                                        </h4>
                                        {bodyPreview && (
                                            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-slate-500 [overflow-wrap:anywhere] break-words">
                                                {bodyPreview}
                                            </p>
                                        )}
                                        <div className="mt-1.5 text-[11px] font-semibold text-slate-400">
                                            {post.comments_count > 0 ? `${post.comments_count} comment${post.comments_count === 1 ? '' : 's'}` : 'Comment'}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}

Home.layout = (page: React.ReactNode) => (
    <ResidentLayout>
        <AnimatedLayout>{page}</AnimatedLayout>
    </ResidentLayout>
);
