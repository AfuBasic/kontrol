import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Edit, Eye, Filter, Globe, Image as ImageIcon, MessageCircle, Plus, Search, Shield, Trash2, Users, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { create, edit, index, show, destroy } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import AdminLayout from '@/layouts/AdminLayout';
import type { CursorPaginatedPosts, EstateBoardPost, PostAudience, PostStatus } from '@/types';

type Props = {
    posts: CursorPaginatedPosts;
};

type FilterStatus = 'all' | PostStatus;
type FilterAudience = 'all' | PostAudience;

function getAudienceIcon(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return <Users className="h-3.5 w-3.5" />;
        case 'security':
            return <Shield className="h-3.5 w-3.5" />;
        default:
            return <Globe className="h-3.5 w-3.5" />;
    }
}

function getAudienceLabel(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return 'Residents';
        case 'security':
            return 'Security';
        default:
            return 'Everyone';
    }
}

function PostCard({ post, index: idx }: { post: EstateBoardPost; index: number }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    function handleDelete() {
        router.delete(destroy.url({ post: post.hashid }), {
            preserveScroll: true,
        });
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.03, ease: 'easeOut' }}
            className="group relative rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
                {post.status === 'published' ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 ring-1 ring-green-600/20 ring-inset">
                        Published
                    </span>
                ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset">
                        Draft
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="pr-20">
                <Link href={show.url({ post: post.hashid })} className="block">
                    {post.title ? (
                        <h3 className="line-clamp-1 font-semibold text-gray-900 transition-colors group-hover:text-primary-600">{post.title}</h3>
                    ) : null}
                    <p className={`line-clamp-2 text-gray-600 ${post.title ? 'mt-1 text-sm' : 'font-medium'}`}>{post.body}</p>
                </Link>
            </div>

            {/* Meta */}
            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                        {getAudienceIcon(post.audience)}
                        <span>{getAudienceLabel(post.audience)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>{post.comments_count}</span>
                    </div>
                    {(post.media_count ?? 0) > 0 && (
                        <div className="flex items-center gap-1">
                            <ImageIcon className="h-3.5 w-3.5" />
                            <span>{post.media_count}</span>
                        </div>
                    )}
                </div>
                <span className="text-xs text-gray-400">
                    {post.published_at
                        ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                        : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-1">
                    <Link
                        href={show.url({ post: post.hashid })}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                    >
                        <Eye className="h-4 w-4" />
                        View
                    </Link>
                    <Link
                        href={edit.url({ post: post.hashid })}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Link>
                </div>
                {showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Delete?</span>
                        <button onClick={handleDelete} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700">
                            Yes
                        </button>
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                            No
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                )}
            </div>
        </motion.div>
    );
}

export default function ManagePosts({ posts }: Props) {
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const isLoadingMore = useRef(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [audienceFilter, setAudienceFilter] = useState<FilterAudience>('all');
    const [showFilters, setShowFilters] = useState(false);

    // Filter posts client-side
    const filteredPosts = useMemo(() => {
        return posts.data.filter((post) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = post.title?.toLowerCase().includes(query);
                const matchesBody = post.body.toLowerCase().includes(query);
                if (!matchesTitle && !matchesBody) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && post.status !== statusFilter) return false;

            // Audience filter
            if (audienceFilter !== 'all' && post.audience !== audienceFilter) return false;

            return true;
        });
    }, [posts.data, searchQuery, statusFilter, audienceFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = posts.data.length;
        const published = posts.data.filter((p) => p.status === 'published').length;
        const drafts = posts.data.filter((p) => p.status === 'draft').length;
        return { total, published, drafts };
    }, [posts.data]);

    const hasActiveFilters = statusFilter !== 'all' || audienceFilter !== 'all' || searchQuery !== '';

    function clearFilters() {
        setSearchQuery('');
        setStatusFilter('all');
        setAudienceFilter('all');
    }

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

    return (
        <AdminLayout>
            <Head title="Manage Posts" />

            {/* Page Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Manage Posts</h1>
                    <p className="mt-1 text-gray-500">View and manage all estate board posts.</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        <Eye className="h-4 w-4" />
                        View Feed
                    </Link>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <Plus className="h-5 w-5" />
                        New Post
                    </Link>
                </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
                className="mb-6 grid grid-cols-3 gap-4"
            >
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-medium text-gray-500">Total Posts</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-medium text-gray-500">Published</p>
                    <p className="mt-1 text-2xl font-semibold text-green-600">{stats.published}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-medium text-gray-500">Drafts</p>
                    <p className="mt-1 text-2xl font-semibold text-amber-600">{stats.drafts}</p>
                </div>
            </motion.div>

            {/* Search & Filters */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="mb-6"
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search posts..."
                            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pr-4 pl-10 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                            showFilters || hasActiveFilters
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                        {hasActiveFilters && (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-xs text-white">
                                {(statusFilter !== 'all' ? 1 : 0) + (audienceFilter !== 'all' ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter Options */}
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
                    >
                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value="all">All</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        {/* Audience Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700">Audience:</span>
                            <select
                                value={audienceFilter}
                                onChange={(e) => setAudienceFilter(e.target.value as FilterAudience)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value="all">All Audiences</option>
                                <option value="residents">Residents Only</option>
                                <option value="security">Security Only</option>
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="ml-auto inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                            >
                                <X className="h-4 w-4" />
                                Clear filters
                            </button>
                        )}
                    </motion.div>
                )}
            </motion.div>

            {/* Posts Grid */}
            {filteredPosts.length > 0 ? (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredPosts.map((post, idx) => (
                            <PostCard key={post.id} post={post} index={idx} />
                        ))}
                    </div>

                    {/* Load More */}
                    {posts.next_page_url && !hasActiveFilters && (
                        <div ref={loadMoreRef} className="mt-8 flex justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                        </div>
                    )}
                </>
            ) : posts.data.length > 0 ? (
                /* No results from filter */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center"
                >
                    <div className="mb-4 rounded-full bg-gray-100 p-4">
                        <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No matching posts</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                    <button onClick={clearFilters} className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
                        Clear all filters
                    </button>
                </motion.div>
            ) : (
                /* Empty State */
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                    className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-center"
                >
                    <div className="mb-4 rounded-full bg-gray-100 p-4">
                        <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-500">Get started by creating the first announcement for your estate community.</p>
                    <Link
                        href={create.url()}
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
                    >
                        <Plus className="h-5 w-5" />
                        Create First Post
                    </Link>
                </motion.div>
            )}
        </AdminLayout>
    );
}
