import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Plus, Search, Filter, X, BarChart3, CalendarDays, Clock, MessageSquare, Image as ImageIcon, Trash2, Shield, Users, Globe } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { create, show, destroy } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { index as boardIndex } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience } from '@/types';
import { useDebounce } from '@/Hooks/useDebounce';

type Props = {
    posts: CursorPaginatedPosts;
    metrics: {
        total: number;
        this_month: number;
        last_broadcast: string | null;
    };
    filters: {
        search: string;
        audience: string;
        category: string;
        priority: string;
    };
};

const CATEGORY_COLORS: Record<string, string> = {
    general: 'bg-slate-100 text-slate-700 ring-slate-200',
    meeting: 'bg-blue-100 text-blue-700 ring-blue-200',
    maintenance: 'bg-orange-100 text-orange-700 ring-orange-200',
    security: 'bg-rose-100 text-rose-700 ring-rose-200',
    event: 'bg-purple-100 text-purple-700 ring-purple-200',
};

const PRIORITY_STYLES: Record<string, { badge: string, border: string }> = {
    normal: { badge: 'bg-slate-100 text-slate-600', border: 'ring-slate-100' },
    important: { badge: 'bg-amber-100 text-amber-700', border: 'ring-amber-200' },
    critical: { badge: 'bg-rose-100 text-rose-700 animate-pulse', border: 'ring-rose-300 shadow-rose-100' },
};

function getAudienceConfig(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return { icon: <Users className="h-3.5 w-3.5" />, label: 'Residents' };
        case 'security':
            return { icon: <Shield className="h-3.5 w-3.5" />, label: 'Security' };
        default:
            return { icon: <Globe className="h-3.5 w-3.5" />, label: 'Everyone' };
    }
}

export default function EstateBoardIndex({ posts, metrics, filters }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const [search, setSearch] = useState(filters.search || '');
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        if (debouncedSearch !== (filters.search || '')) {
            router.get(
                boardIndex.url(),
                { search: debouncedSearch, audience: filters.audience, category: filters.category, priority: filters.priority },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }
    }, [debouncedSearch, filters.audience, filters.category, filters.priority]);

    const setFilter = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value === filters[key as keyof typeof filters] ? '' : value };
        router.get(boardIndex.url(), newFilters, { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = useCallback(() => {
        setSearch('');
        router.get(boardIndex.url(), {}, { preserveState: true, preserveScroll: true, replace: true });
    }, []);

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
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 },
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMore]);

    const hasActiveFilters = Boolean(search || filters.audience !== 'all' || filters.category || filters.priority);

    return (
        <div className="space-y-8 pb-32 max-w-7xl mx-auto">
            <Head title="Estate Board" />

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Communication Center</h1>
                    <p className="mt-1.5 text-sm font-medium text-slate-500">Manage estate-wide broadcasts, alerts, and community updates.</p>
                </div>
                <Link
                    href={create.url()}
                    className="shadow-primary-600/20 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-primary-600/30 active:scale-95"
                >
                    <Plus className="h-5 w-5" />
                    New Broadcast
                </Link>
            </div>

            {/* Communication Summary Hero */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 p-8 sm:p-10 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 via-primary-500/10 to-transparent"></div>
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-slate-500/20 blur-3xl"></div>
                
                <div className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary-200">
                            <BarChart3 className="h-5 w-5 opacity-70" />
                            <span className="text-xs font-bold uppercase tracking-wider">Total Broadcasts</span>
                        </div>
                        <span className="text-4xl font-black text-white">{metrics.total}</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:pl-8 pt-6 sm:pt-0">
                        <div className="flex items-center gap-2 text-primary-200">
                            <CalendarDays className="h-5 w-5 opacity-70" />
                            <span className="text-xs font-bold uppercase tracking-wider">This Month</span>
                        </div>
                        <span className="text-4xl font-black text-white">{metrics.this_month}</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:pl-8 pt-6 sm:pt-0">
                        <div className="flex items-center gap-2 text-primary-200">
                            <Clock className="h-5 w-5 opacity-70" />
                            <span className="text-xs font-bold uppercase tracking-wider">Latest Update</span>
                        </div>
                        <span className="text-xl mt-2 font-black text-white">{metrics.last_broadcast || 'Never'}</span>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 max-w-md relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Search className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="block w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:font-normal placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:leading-6 transition-all"
                            placeholder="Search broadcasts..."
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar items-center">
                        <div className="flex items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary-600">
                            <Filter className="h-4 w-4 text-slate-400 mr-2" />
                            <select
                                value={filters.audience}
                                onChange={(e) => setFilter('audience', e.target.value)}
                                className="border-none bg-transparent py-1 pl-0 pr-6 text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer"
                            >
                                <option value="all">All Audiences</option>
                                <option value="residents">Residents Only</option>
                                <option value="security">Security Only</option>
                            </select>
                        </div>
                        <button
                            onClick={() => setFilter('priority', 'important')}
                            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                                filters.priority === 'important' 
                                ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' 
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Important
                        </button>
                        <button
                            onClick={() => setFilter('category', 'meeting')}
                            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                                filters.category === 'meeting' 
                                ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' 
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Meetings
                        </button>
                        <button
                            onClick={() => setFilter('category', 'security')}
                            className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-bold transition-all whitespace-nowrap ${
                                filters.category === 'security' 
                                ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300' 
                                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            Security
                        </button>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-200"
                            >
                                <X className="h-4 w-4" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Broadcast Feed */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {posts.data.length > 0 ? (
                        posts.data.map((post, idx) => {
                            const audienceConfig = getAudienceConfig(post.audience);
                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    key={post.id}
                                    className={`group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-sm ring-1 transition-all hover:shadow-xl hover:-translate-y-1 ${PRIORITY_STYLES[post.priority || 'normal']?.border || 'ring-slate-200'}`}
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex flex-wrap items-center gap-2">
                                                {post.category && (
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
                                                        {post.category}
                                                    </span>
                                                )}
                                                {post.priority && post.priority !== 'normal' && (
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_STYLES[post.priority].badge}`}>
                                                        {post.priority}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <Link href={show.url({ post: post.hashid })} className="absolute inset-0 z-0" />
                                            {post.title ? (
                                                <h3 className="text-lg font-black text-slate-900 leading-tight group-hover:text-primary-600 transition-colors">
                                                    {post.title}
                                                </h3>
                                            ) : (
                                                <p className="text-lg font-medium text-slate-900 italic">No Title</p>
                                            )}
                                            <div 
                                                className="mt-3 line-clamp-3 text-sm font-medium text-slate-500 leading-relaxed prose prose-sm prose-slate max-w-none"
                                                dangerouslySetInnerHTML={{ __html: post.body }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5 relative z-10">
                                        <div className="flex flex-col gap-1 pointer-events-none">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Audience</span>
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                                {audienceConfig.icon}
                                                {audienceConfig.label}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 pointer-events-none">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {post.published_at
                                                    ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                                    : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                            </span>
                                            <div className="flex items-center gap-3 text-slate-500">
                                                {post.media && post.media.length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                        <span className="text-xs font-bold">{post.media.length}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <MessageSquare className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-bold">{post.comments_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="col-span-full flex flex-col items-center justify-center rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 py-24 px-6 text-center"
                        >
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                                <Megaphone className="h-10 w-10 text-primary-500" />
                            </div>
                            <h3 className="mt-6 text-xl font-black text-slate-900">
                                {hasActiveFilters ? "No matching broadcasts found" : "No broadcasts yet"}
                            </h3>
                            <p className="mt-2 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
                                {hasActiveFilters 
                                    ? "Try adjusting your search query or filters to find what you're looking for."
                                    : "Start engaging with your community by creating your first announcement. Share updates, news, and important information."}
                            </p>
                            {hasActiveFilters ? (
                                <button
                                    onClick={clearFilters}
                                    className="mt-8 shadow-slate-200 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Clear filters
                                </button>
                            ) : (
                                <Link
                                    href={create.url()}
                                    className="mt-8 shadow-primary-600/20 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    <Plus className="h-5 w-5" />
                                    Create First Broadcast
                                </Link>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Infinite Scroll Loader */}
            {posts.next_page_url && (
                <div ref={loadMoreRef} className="mt-10 flex justify-center pb-12">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.3s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500 [animation-delay:-0.15s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-primary-500" />
                    </div>
                </div>
            )}
        </div>
    );
}
