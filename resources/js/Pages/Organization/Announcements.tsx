import { Head } from '@inertiajs/react';
import { Megaphone, Calendar, User, ShieldAlert, ChevronRight } from 'lucide-react';
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

    return (
        <OrganizationLayout title="Announcements">
            <Head title={`${organization.name} - Announcements`} />

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                        Announcements
                    </h1>
                    <p className="text-sm text-stone-500 mt-0.5">
                        Estate notices, road closures, and bulletins from {organization.estate_name || 'the Estate Office'}.
                    </p>
                </div>

                {/* Posts Feed */}
                <div className="space-y-3">
                    {posts.data.length === 0 ? (
                        <div className="rounded-3xl bg-white border border-stone-200/80 p-8 sm:p-12 text-center shadow-xs">
                            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                                <Megaphone className="w-6 h-6" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">No estate announcements</h3>
                            <p className="text-sm text-stone-500 max-w-sm mx-auto mt-1">
                                Notices and estate updates posted by the management office will appear here.
                            </p>
                        </div>
                    ) : (
                        posts.data.map((post) => (
                            <article
                                key={post.id}
                                onClick={() => setSelectedPost(post)}
                                className="rounded-3xl bg-white border border-stone-200/80 p-5 sm:p-6 shadow-xs hover:border-indigo-200 transition-all cursor-pointer space-y-3"
                            >
                                <div className="flex items-center justify-between gap-3 text-xs text-stone-400">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-800">{post.author_name}</span>
                                        <span>•</span>
                                        <span>{post.published_at_human}</span>
                                    </div>

                                    <span className="capitalize px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                                        {post.category}
                                    </span>
                                </div>

                                {post.title && (
                                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                                        {post.title}
                                    </h2>
                                )}

                                <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
                                    {post.body.replace(/<[^>]*>/g, '')}
                                </p>

                                <div className="pt-2 flex items-center gap-1 text-xs font-semibold text-indigo-600">
                                    <span>Read notice</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </div>
                            </article>
                        ))
                    )}
                </div>

                {/* Modal Detail */}
                {selectedPost && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                        <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-6 sm:p-7 space-y-4 shadow-xl">
                            <div className="flex items-center justify-between text-xs text-stone-400 pb-3 border-b border-stone-100">
                                <span className="font-semibold text-slate-800">{selectedPost.author_name}</span>
                                <span>{selectedPost.published_at_human}</span>
                            </div>

                            {selectedPost.title && (
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                                    {selectedPost.title}
                                </h3>
                            )}

                            <div
                                className="text-sm text-stone-700 leading-relaxed max-h-[60vh] overflow-y-auto whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{ __html: selectedPost.body }}
                            />

                            <div className="pt-4 border-t border-stone-100 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPost(null)}
                                    className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-semibold text-xs sm:text-sm transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </OrganizationLayout>
    );
}
