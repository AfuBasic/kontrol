import { Head, Link, router } from '@inertiajs/react';
import { format, isThisWeek, isToday, isYesterday } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronRight, Globe, MessageCircle, Newspaper, Pin, Shield, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import * as EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
};

type FilterKey = 'all' | 'security' | 'residents' | 'broadcasts';

const FILTERS: { key: FilterKey; label: string; match?: PostAudience[] }[] = [
    { key: 'all', label: 'All' },
    { key: 'security', label: 'For me', match: ['security'] },
    { key: 'broadcasts', label: 'Broadcasts', match: ['all'] },
    { key: 'residents', label: 'Residents', match: ['residents'] },
];

const AUDIENCE_META: Record<PostAudience, { label: string; tone: string; icon: typeof Shield }> = {
    security: { label: 'Security', tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200', icon: Shield },
    residents: { label: 'Residents', tone: 'text-indigo-700 bg-indigo-50 ring-indigo-200', icon: Users },
    all: { label: 'Everyone', tone: 'text-slate-700 bg-slate-100 ring-slate-200', icon: Globe },
};

function bucketFor(date: Date): 'today' | 'yesterday' | 'thisWeek' | 'earlier' {
    if (isToday(date)) return 'today';
    if (isYesterday(date)) return 'yesterday';
    if (isThisWeek(date, { weekStartsOn: 1 })) return 'thisWeek';
    return 'earlier';
}

const BUCKET_LABEL: Record<ReturnType<typeof bucketFor>, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This week',
    earlier: 'Earlier',
};

function timestamp(date: Date) {
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yest';
    if (isThisWeek(date, { weekStartsOn: 1 })) return format(date, 'EEE');
    return format(date, 'MMM d');
}

function FeedRow({ post }: { post: EstateBoardPost }) {
    const audience = AUDIENCE_META[post.audience] ?? AUDIENCE_META.all;
    const AudIcon = audience.icon;
    const ts = post.published_at ?? post.created_at;
    const date = new Date(ts);
    const preview = post.body.replace(/<[^>]*>/g, ' ').slice(0, 140);
    const firstImage = post.media?.[0] ?? null;
    const targetsSecurity = post.audience === 'security';

    return (
        <motion.li initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
            <Link
                href={EstateBoardController.show.url({ post: post.hashid })}
                className={`group relative flex gap-3 px-4 py-3.5 transition active:bg-slate-100/70 sm:px-5 ${
                    targetsSecurity ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-slate-50/70'
                }`}
            >
                {/* Left accent rail for security-targeted posts */}
                {targetsSecurity && <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-emerald-500/80" aria-hidden="true" />}

                {/* Time column — fixed width for alignment */}
                <div className="flex w-12 shrink-0 flex-col items-end pt-0.5">
                    <span className="font-mono text-[11px] tracking-wider text-slate-500 tabular-nums">{timestamp(date)}</span>
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ring-1 ring-inset ${audience.tone}`}
                        >
                            <AudIcon className="h-2.5 w-2.5" strokeWidth={2.6} />
                            {audience.label}
                        </span>
                        {targetsSecurity && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold tracking-wider text-emerald-700 uppercase">
                                <Pin className="h-2.5 w-2.5" strokeWidth={2.6} />
                                Briefing
                            </span>
                        )}
                    </div>

                    {post.title && <h2 className="mt-1 line-clamp-1 text-[13.5px] font-semibold tracking-tight text-slate-900">{post.title}</h2>}
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{preview}</p>

                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5 truncate">
                            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] font-semibold tracking-wider text-slate-700 uppercase">
                                {post.author.name.charAt(0)}
                            </span>
                            <span className="truncate">{post.author.name}</span>
                        </span>
                        <span className="flex items-center gap-3">
                            {post.comments_count > 0 && (
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                    <MessageCircle className="h-3 w-3" strokeWidth={2.2} />
                                    {post.comments_count}
                                </span>
                            )}
                            <ChevronRight
                                className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500"
                                strokeWidth={2.2}
                            />
                        </span>
                    </div>
                </div>

                {firstImage && (
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                        <img src={firstImage.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                        {post.media.length > 1 && (
                            <span className="absolute right-0.5 bottom-0.5 rounded bg-slate-900/70 px-1 text-[9px] font-semibold text-white">
                                +{post.media.length - 1}
                            </span>
                        )}
                    </span>
                )}
            </Link>
        </motion.li>
    );
}

export default function FeedIndex({ posts }: Props) {
    const [filter, setFilter] = useState<FilterKey>('all');
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const filtered = useMemo(() => {
        const list = posts?.data ?? [];
        const match = FILTERS.find((f) => f.key === filter)?.match;
        if (!match) return list;
        return list.filter((p) => match.includes(p.audience));
    }, [posts?.data, filter]);

    const grouped = useMemo(() => {
        const groups: Record<string, EstateBoardPost[]> = {};
        for (const post of filtered) {
            const ts = post.published_at ?? post.created_at;
            const key = bucketFor(new Date(ts));
            (groups[key] ??= []).push(post);
        }
        return groups;
    }, [filtered]);

    const securityCount = useMemo(() => (posts?.data ?? []).filter((p) => p.audience === 'security').length, [posts?.data]);

    const loadMore = useCallback(() => {
        if (!posts?.next_page_url || isLoadingMore.current) return;
        isLoadingMore.current = true;
        router.get(
            posts.next_page_url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: ['posts'],
                onFinish: () => {
                    isLoadingMore.current = false;
                },
            },
        );
    }, [posts?.next_page_url]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) loadMore();
            },
            { threshold: 0.1 },
        );
        if (loadMoreRef.current) observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [loadMore]);

    const sections: ReturnType<typeof bucketFor>[] = ['today', 'yesterday', 'thisWeek', 'earlier'];

    return (
        <>
            <Head title="Feed · Security" />

            {/* Header */}
            <header className="mb-3 flex items-end justify-between">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Feed</p>
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900">Estate updates</h1>
                </div>
                {securityCount > 0 && (
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-emerald-200/70">
                        <Shield className="h-3 w-3 text-emerald-700" strokeWidth={2.4} />
                        <span className="text-[11px] font-semibold tracking-tight text-emerald-700 tabular-nums">{securityCount} for you</span>
                    </div>
                )}
            </header>

            {/* Filter chips */}
            <div className="-mx-4 mb-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="inline-flex gap-1.5">
                    {FILTERS.map((f) => {
                        const active = filter === f.key;
                        return (
                            <button
                                key={f.key}
                                type="button"
                                onClick={() => setFilter(f.key)}
                                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold tracking-tight transition ${
                                    active ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                                }`}
                            >
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Date-grouped feed */}
            {filtered.length > 0 ? (
                <div className="space-y-4">
                    {sections.map((bucket) => {
                        const list = grouped[bucket];
                        if (!list || list.length === 0) return null;
                        return (
                            <section key={bucket}>
                                <header className="mb-1.5 flex items-center gap-2 px-1">
                                    <h3 className="text-[10px] font-semibold tracking-[0.16em] text-slate-500 uppercase">{BUCKET_LABEL[bucket]}</h3>
                                    <span className="h-px flex-1 bg-slate-200/70" aria-hidden="true" />
                                    <span className="text-[10px] font-medium text-slate-400 tabular-nums">{list.length}</span>
                                </header>
                                <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                                    {list.map((post) => (
                                        <FeedRow key={post.id} post={post} />
                                    ))}
                                </ul>
                            </section>
                        );
                    })}

                    {posts?.next_page_url && filter === 'all' && (
                        <div ref={loadMoreRef} className="flex justify-center py-3">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                        </div>
                    )}
                </div>
            ) : (
                <EmptyState filter={filter} />
            )}
        </>
    );
}

function EmptyState({ filter }: { filter: FilterKey }) {
    const message =
        filter === 'security'
            ? "No security briefings right now. Estate management will post here when there's something for your shift."
            : filter === 'residents'
              ? 'No resident-targeted posts to show.'
              : filter === 'broadcasts'
                ? 'No estate-wide broadcasts yet.'
                : "Estate management and security alerts will appear here as they're posted.";

    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <Newspaper className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{filter === 'all' ? 'No updates yet' : 'Nothing to show'}</p>
            <p className="mt-1 max-w-xs px-4 text-xs leading-relaxed text-slate-500">{message}</p>
        </div>
    );
}
