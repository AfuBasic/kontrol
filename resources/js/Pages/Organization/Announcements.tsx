import { Head } from '@inertiajs/react';
import { ArrowRight, X } from 'lucide-react';
import React, { useState } from 'react';
import OrganizationLayout from '@/Layouts/OrganizationLayout';

interface Post {
    id: number;
    title: string | null;
    body: string;
    category: string;
    priority: string;
    published_at: string | null;
    published_at_human: string;
    author_name: string;
}

interface PaginatedPosts {
    data: Post[];
    current_page: number;
    last_page: number;
    total: number;
    links: Array<{ url: string | null; label: string; active: boolean }>;
}

interface Props {
    organization: {
        id: number;
        name: string;
        type: string;
        estate_name?: string;
    };
    membership: {
        role: string;
        is_admin: boolean;
    };
    posts: PaginatedPosts;
}

export default function Announcements({ organization, membership, posts }: Props) {
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);

    // Format rich text or plain text into properly spaced paragraphs
    const formatBody = (text: string) => {
        // Strip html tags if simple markup or decode html entities
        const clean = text
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .trim();

        return clean;
    };

    const formatDateHeader = (isoString?: string | null) => {
        if (!isoString) return 'RECENT';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase();
        } catch {
            return 'RECENT';
        }
    };

    return (
        <OrganizationLayout title="Announcements">
            <Head title={`${organization.name} - Announcements`} />

            <div className="space-y-8 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        Announcements
                    </h1>
                    <p className="text-sm font-semibold text-slate-400 mt-1">
                        Updates from {organization.estate_name || 'Golden Heights'}
                    </p>
                </div>

                {/* Editorial Announcements Feed */}
                {posts.data.length === 0 ? (
                    <div className="py-6 space-y-1">
                        <p className="text-base sm:text-lg font-bold text-slate-800">No announcements yet.</p>
                        <p className="text-sm text-slate-500">
                            Estate bulletins and notices published by the management office will appear here.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200/70 space-y-8">
                        {posts.data.map((post) => {
                            const dateLabel = formatDateHeader(post.published_at);
                            const excerpt = formatBody(post.body);

                            return (
                                <article
                                    key={post.id}
                                    className="pt-8 first:pt-0 space-y-3"
                                >
                                    {/* Date & Author */}
                                    <div className="flex items-center gap-3 text-xs font-black tracking-widest text-slate-400 uppercase">
                                        <span>{dateLabel}</span>
                                        <span>·</span>
                                        <span className="text-slate-500 font-bold">{post.author_name}</span>
                                    </div>

                                    {/* Title */}
                                    {post.title && (
                                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                                            {post.title}
                                        </h2>
                                    )}

                                    {/* Body Excerpt */}
                                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed line-clamp-3">
                                        {excerpt}
                                    </p>

                                    {/* Read Action */}
                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPost(post)}
                                            className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                        >
                                            <span>Read announcement</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {/* Modal Detail Dialog */}
                {selectedPost && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-800">{selectedPost.author_name}</span>
                                    <span>·</span>
                                    <span>{selectedPost.published_at_human}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedPost(null)}
                                    className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {selectedPost.title && (
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                                    {selectedPost.title}
                                </h3>
                            )}

                            <div className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap pt-2">
                                {formatBody(selectedPost.body)}
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPost(null)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-colors"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
