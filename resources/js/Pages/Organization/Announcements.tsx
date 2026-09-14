import { Head } from '@inertiajs/react';
import { Bell, ImageIcon, Megaphone, ShieldAlert } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import AnnouncementAttachments from '@/Components/EstateBoard/AnnouncementAttachments';
import AnnouncementProse from '@/Components/EstateBoard/AnnouncementProse';
import OrganizationLayout from '@/Layouts/OrganizationLayout';
import type { PostMedia } from '@/types';

interface Post {
    id: number;
    title: string | null;
    body: string;
    category: string;
    priority: string;
    published_at: string | null;
    published_at_human: string;
    author_name: string;
    media?: PostMedia[];
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

export default function Announcements({ organization, posts }: Props) {
    const [selectedPostId, setSelectedPostId] = useState<number | null>(posts.data[0]?.id ?? null);

    const selectedPost = useMemo(() => posts.data.find((post) => post.id === selectedPostId) ?? posts.data[0] ?? null, [posts.data, selectedPostId]);

    const stripHtml = (html: string) =>
        html
            .replace(/<style[^>]*>.*?<\/style>/gis, ' ')
            .replace(/<script[^>]*>.*?<\/script>/gis, ' ')
            .replace(/<[^>]*>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

    const categoryLabel = (value: string) =>
        value
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

    const formatDate = (isoString: string | null) => {
        if (!isoString) {
            return 'Recently';
        }

        return new Date(isoString).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const priorityTone = (priority: string) => {
        if (priority === 'critical') {
            return 'bg-rose-50 text-rose-700 ring-rose-100';
        }

        if (priority === 'important') {
            return 'bg-amber-50 text-amber-700 ring-amber-100';
        }

        return 'bg-[#eaf2ff] text-[#0b4aa2] ring-[#bfdbfe]';
    };

    const firstImageFor = (post: Post) => post.media?.find((item) => item.mime_type?.startsWith('image/')) ?? post.media?.[0] ?? null;

    return (
        <OrganizationLayout title="Announcements" contentClassName="max-w-[92rem]">
            <Head title={`${organization.name} - Announcements`} />

            <div className="space-y-5">
                <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-sm font-black text-[#0b4aa2]">Estate communication</p>
                            <h1 className="mt-1.5 text-2xl font-black text-slate-950 sm:mt-2 sm:text-4xl">Updates for {organization.name}</h1>
                            <p className="mt-3 text-sm leading-6 font-semibold text-slate-500 sm:text-base">
                                Notices from {organization.estate_name || 'the estate'} collected in one reading space.
                            </p>
                        </div>

                        <div className="rounded-[1.5rem] bg-[#0f172a] p-4 text-white lg:min-w-48">
                            <p className="text-3xl font-black">{posts.total}</p>
                            <p className="mt-1 text-xs font-bold text-slate-300">Published notices</p>
                        </div>
                    </div>
                </section>

                {posts.data.length === 0 ? (
                    <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem]">
                        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_15rem] sm:gap-6 sm:p-8">
                            <div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2ff] text-[#0b4aa2]">
                                    <Megaphone className="h-6 w-6" />
                                </div>
                                <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">No estate updates yet.</h2>
                                <p className="mt-3 max-w-xl text-sm leading-6 font-semibold text-slate-500">
                                    Announcements, security reminders, meeting notes, and estate bulletins will appear here when management publishes
                                    them.
                                </p>
                            </div>
                            <div className="rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-100">
                                <p className="text-sm font-black text-slate-950">Quiet inbox</p>
                                <p className="mt-2 text-sm leading-6 font-semibold text-slate-500">
                                    A quiet page means there is nothing new for this organization to act on.
                                </p>
                            </div>
                        </div>
                    </section>
                ) : (
                    <section className="grid gap-4 lg:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1fr)]">
                        <div className="rounded-[1.5rem] bg-white p-3 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-4">
                            <div className="space-y-2">
                                {posts.data.map((post) => {
                                    const selected = selectedPost?.id === post.id;
                                    const preview = stripHtml(post.body);
                                    const image = firstImageFor(post);

                                    return (
                                        <button
                                            key={post.id}
                                            type="button"
                                            onClick={() => setSelectedPostId(post.id)}
                                            className={`w-full rounded-[1.5rem] p-3 text-left transition sm:p-4 ${
                                                selected
                                                    ? 'bg-[#0f172a] text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]'
                                                    : 'bg-slate-50 text-slate-950 ring-1 ring-slate-100 hover:bg-white hover:shadow-[0_12px_30px_rgba(15,23,42,0.07)]'
                                            }`}
                                        >
                                            {image && (
                                                <div className="mb-3 aspect-[16/8] overflow-hidden rounded-[1.1rem] bg-slate-200">
                                                    <img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between gap-3">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${
                                                        selected ? 'bg-white/10 text-slate-200 ring-white/10' : priorityTone(post.priority)
                                                    }`}
                                                >
                                                    {categoryLabel(post.category)}
                                                </span>
                                                <span className={`text-xs font-bold ${selected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                    {formatDate(post.published_at)}
                                                </span>
                                            </div>

                                            <h2
                                                className={`mt-3 line-clamp-2 text-lg leading-tight font-black break-words ${
                                                    selected ? 'text-white' : 'text-slate-950'
                                                }`}
                                            >
                                                {post.title || 'Untitled announcement'}
                                            </h2>
                                            {preview && (
                                                <p
                                                    className={`mt-2 line-clamp-2 text-sm leading-6 font-semibold ${
                                                        selected ? 'text-slate-300' : 'text-slate-500'
                                                    }`}
                                                >
                                                    {preview}
                                                </p>
                                            )}

                                            <div
                                                className={`mt-3 flex items-center justify-between text-xs font-black ${
                                                    selected ? 'text-slate-300' : 'text-slate-500'
                                                }`}
                                            >
                                                <span>{post.author_name}</span>
                                                {post.media && post.media.length > 0 && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <ImageIcon className="h-3.5 w-3.5" />
                                                        {post.media.length}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedPost && (
                            <article className="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/80 sm:rounded-[2rem] sm:p-8">
                                <div className="flex flex-col gap-5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${priorityTone(
                                                    selectedPost.priority,
                                                )}`}
                                            >
                                                {selectedPost.priority === 'critical' ? (
                                                    <ShieldAlert className="h-3.5 w-3.5" />
                                                ) : (
                                                    <Bell className="h-3.5 w-3.5" />
                                                )}
                                                {categoryLabel(selectedPost.category)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-500">{selectedPost.published_at_human}</span>
                                        </div>

                                        <h2 className="mt-4 text-2xl leading-tight font-black break-words text-slate-950 sm:text-5xl">
                                            {selectedPost.title || 'Untitled announcement'}
                                        </h2>
                                        <p className="mt-4 text-sm font-black text-slate-500">From {selectedPost.author_name}</p>
                                    </div>
                                </div>

                                {selectedPost.media && selectedPost.media.length > 0 && (
                                    <div className="border-b border-slate-100 py-6">
                                        <AnnouncementAttachments media={selectedPost.media} />
                                    </div>
                                )}

                                <div className="pt-6">
                                    <AnnouncementProse html={selectedPost.body} className="prose-p:mb-4 prose-p:text-base prose-p:leading-8" />
                                </div>
                            </article>
                        )}
                    </section>
                )}
            </div>
        </OrganizationLayout>
    );
}
