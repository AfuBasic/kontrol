import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronRight, Globe, Image as ImageIcon, MessageCircle, Newspaper, Shield, Users } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';

import EstateBoardController from '@/actions/App/Http/Controllers/Security/EstateBoardController';
import SecurityLayout from '@/Layouts/SecurityLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
};

const AUDIENCE_META: Record<PostAudience, { label: string; tone: string }> = {
    residents: { label: 'Residents', tone: 'text-indigo-700 bg-indigo-50 ring-indigo-200' },
    security: { label: 'Security', tone: 'text-emerald-700 bg-emerald-50 ring-emerald-200' },
    all: { label: 'Everyone', tone: 'text-slate-700 bg-slate-100 ring-slate-200' },
};

function audienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return Users;
        case 'security':
            return Shield;
        default:
            return Globe;
    }
}

function FeedRow({ post }: { post: EstateBoardPost }) {
    const audience = AUDIENCE_META[post.audience] ?? AUDIENCE_META.all;
    const AudIcon = audienceIcon(post.audience);
    const hasMedia = post.media && post.media.length > 0;
    const firstImage = hasMedia ? post.media[0] : null;
    const ts = post.published_at ?? post.created_at;
    const preview = post.body.replace(/<[^>]*>/g, ' ').slice(0, 160);

    return (
        <motion.li layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Link
                href={EstateBoardController.show.url({ post: post.hashid })}
                className="group flex gap-3 px-4 py-4 transition hover:bg-slate-50/70 active:bg-slate-100/60"
            >
                {/* Timeline rail */}
                <div className="flex flex-col items-center pt-1">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200/70">
                        <AudIcon className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </span>
                    <span className="mt-1 w-px flex-1 bg-slate-100" aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1 pb-1">
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ring-1 ring-inset ${audience.tone}`}>
                            {audience.label}
                        </span>
                        <span className="font-mono text-[10px] tracking-wider text-slate-400">
                            {formatDistanceToNow(new Date(ts), { addSuffix: true })}
                        </span>
                    </div>

                    {post.title && (
                        <h2 className="mt-1.5 line-clamp-2 text-sm font-semibold tracking-tight text-slate-900">{post.title}</h2>
                    )}
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-500">{preview}</p>

                    {firstImage && (
                        <div className="mt-2.5 flex items-center gap-2">
                            <span className="relative h-12 w-16 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200">
                                <img src={firstImage.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                            </span>
                            {post.media.length > 1 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                    <ImageIcon className="h-3 w-3" strokeWidth={2.2} />
                                    {post.media.length} attachments
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate">{post.author.name}</span>
                        <span className="flex items-center gap-3">
                            <span className="inline-flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" strokeWidth={2.2} />
                                {post.comments_count}
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" strokeWidth={2.2} />
                        </span>
                    </div>
                </div>
            </Link>
        </motion.li>
    );
}

export default function FeedIndex({ posts }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const loadMore = useCallback(() => {
        if (!posts.next_page_url || isLoadingMore.current) return;
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
    }, [posts.next_page_url]);

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

    return (
        <SecurityLayout>
            <Head title="Feed · Security" />

            <header className="mb-4">
                <p className="text-[11px] font-semibold tracking-[0.18em] text-slate-500 uppercase">Feed</p>
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Estate updates</h1>
            </header>

            {posts.data.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                    <ul className="divide-y divide-slate-100">
                        {posts.data.map((post) => (
                            <FeedRow key={post.id} post={post} />
                        ))}
                    </ul>

                    {posts.next_page_url && (
                        <div ref={loadMoreRef} className="flex justify-center border-t border-slate-100 py-5">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-14 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Newspaper className="h-5 w-5" strokeWidth={2} />
                    </span>
                    <p className="mt-3 text-sm font-semibold text-slate-900">No updates yet</p>
                    <p className="mt-1 max-w-xs px-4 text-xs text-slate-500">
                        Estate management and security alerts will appear here as they're posted.
                    </p>
                </div>
            )}
        </SecurityLayout>
    );
}
