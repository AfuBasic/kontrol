import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Eye,
    MessageSquare,
    Paperclip,
    Globe,
    Users,
    Shield,
    Pin,
    AlertOctagon,
    MoreVertical,
    FileText,
    Download,
    Edit3,
    Trash2,
} from 'lucide-react';
import { show, destroy, edit } from '@/actions/App/Http/Controllers/Admin/EstateBoardController';
import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import type { EstateBoardPost, PostAudience } from '@/types';
import CategoryTag from './CategoryTag';

type Props = {
    post: EstateBoardPost;
    isPinned?: boolean;
};

function getAudienceConfig(audience: PostAudience) {
    switch (audience) {
        case 'residents':
            return { icon: Users, label: 'Residents Only' };
        case 'security':
            return { icon: Shield, label: 'Security Only' };
        default:
            return { icon: Globe, label: 'Everyone' };
    }
}

function _stripHtml(html: string): string {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export default function AnnouncementCard({ post, isPinned = false }: Props) {
    const { confirm } = useAdminConfirmation();
    const [showMenu, setShowMenu] = useState(false);
    const audienceConfig = getAudienceConfig(post.audience);
    const AudienceIcon = audienceConfig.icon;

    const mediaList = post.media || [];
    const imageMedia = mediaList.filter((m) => m.mime_type?.startsWith('image/'));
    const docMedia = mediaList.filter((m) => !m.mime_type?.startsWith('image/'));

    const isImportant = post.priority === 'important';
    const isCritical = post.priority === 'critical';

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        confirm({
            title: 'Delete announcement',
            message: 'Are you sure you want to delete this announcement?',
            confirmLabel: 'Delete announcement',
            onConfirm: () => router.delete(destroy.url({ post: post.hashid })),
        });
    };

    return (
        <div
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-5 shadow-xs ring-1 transition-all hover:shadow-md ${
                isPinned || isCritical || isImportant
                    ? 'border-l-4 border-l-amber-500 bg-amber-50/10 ring-slate-200'
                    : 'ring-slate-200 hover:border-slate-300'
            }`}
        >
            <div>
                {/* Secondary Tier (Header metadata row) */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Category Tag */}
                        <CategoryTag category={post.category} />

                        {/* Draft Badge */}
                        {post.status === 'draft' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-slate-600 uppercase ring-1 ring-slate-200">
                                <FileText className="h-3 w-3 text-slate-500" />
                                <span>Draft</span>
                            </span>
                        )}

                        {/* Pinned or Priority Indicator */}
                        {(isPinned || isImportant) && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase ring-1 ring-amber-200">
                                <Pin className="h-3 w-3 text-amber-600" />
                                <span>Pinned</span>
                            </span>
                        )}

                        {isCritical && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-rose-700 uppercase ring-1 ring-rose-200">
                                <AlertOctagon className="h-3 w-3 text-rose-600" />
                                <span>Critical Notice</span>
                            </span>
                        )}
                    </div>

                    {/* Author & Published Time */}
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
                        <span>{post.author?.name || 'Estate Admin'}</span>
                        <span>•</span>
                        <span>
                            {post.published_at
                                ? formatDistanceToNow(new Date(post.published_at), { addSuffix: true })
                                : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>

                {/* Primary Tier (Title & Content) */}
                <div className="space-y-2">
                    <Link
                        href={show.url({ post: post.hashid })}
                        className="block text-base font-bold text-slate-900 transition hover:text-primary-600 sm:text-lg"
                    >
                        {post.title || 'Untitled Announcement'}
                    </Link>

                    {/* Body text preview */}
                    <div
                        className="prose prose-sm prose-slate line-clamp-3 text-xs leading-relaxed font-medium text-slate-600"
                        dangerouslySetInnerHTML={{ __html: post.body }}
                    />
                </div>

                {/* Rich Content Display (Images & Attached Files) */}
                {imageMedia.length > 0 && (
                    <div className="mt-4">
                        {imageMedia.length === 1 ? (
                            <div className="max-h-56 overflow-hidden rounded-xl bg-slate-100">
                                <img
                                    src={imageMedia[0].url}
                                    alt="Post attachment"
                                    className="h-full w-full object-cover transition hover:scale-105"
                                />
                            </div>
                        ) : (
                            <div className="grid max-h-48 grid-cols-2 gap-2 overflow-hidden rounded-xl">
                                {imageMedia.slice(0, 4).map((img, i) => (
                                    <div key={i} className="relative h-24 overflow-hidden rounded-lg bg-slate-100">
                                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                                        {i === 3 && imageMedia.length > 4 && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-xs font-bold text-white">
                                                +{imageMedia.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Document Attachments */}
                {docMedia.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                        {docMedia.map((doc, idx) => (
                            <a
                                key={idx}
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="h-4 w-4 shrink-0 text-primary-600" />
                                    <span className="truncate">Attachment #{idx + 1}</span>
                                </div>
                                <Download className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Tertiary Tier (Footer Metrics & Actions) */}
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                {/* Target Audience Badge */}
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <AudienceIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{audienceConfig.label}</span>
                </div>

                {/* Counts & Actions Menu */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                    {/* Read count */}
                    {post.reads_count !== undefined && (
                        <div className="flex items-center gap-1" title="Reads count">
                            <Eye className="h-3.5 w-3.5 text-slate-400" />
                            <span>{post.reads_count}</span>
                        </div>
                    )}

                    {/* Comments count */}
                    <div className="flex items-center gap-1" title="Comments">
                        <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                        <span>{post.comments_count || 0}</span>
                    </div>

                    {/* Media count */}
                    {mediaList.length > 0 && (
                        <div className="flex items-center gap-1" title="Attachments">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                            <span>{mediaList.length}</span>
                        </div>
                    )}

                    {/* Actions Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu((prev) => !prev)}
                            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Actions"
                        >
                            <MoreVertical className="h-4 w-4" />
                        </button>

                        {showMenu && (
                            <div
                                onMouseLeave={() => setShowMenu(false)}
                                className="absolute right-0 bottom-full z-20 mb-1 w-36 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ring-1 ring-slate-900/5"
                            >
                                <Link
                                    href={show.url({ post: post.hashid })}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                                    View Details
                                </Link>
                                <Link
                                    href={edit.url({ post: post.hashid })}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                                    Edit Post
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                >
                                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
