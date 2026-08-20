import React, { useState } from 'react';
import {
    CornerDownRight,
    MessageSquare,
    Send,
    UserCircle,
} from 'lucide-react';
import type { IncidentComment, PaginatedData } from '@/types/incidents';

interface Props {
    comments: PaginatedData<IncidentComment> | IncidentComment[];
    canComment?: boolean;
    onSubmitComment?: (body: string, parentId?: number | null) => void;
    submitting?: boolean;
    className?: string;
}

export default function IncidentDiscussion({
    comments,
    canComment = true,
    onSubmitComment,
    submitting = false,
    className = '',
}: Props) {
    const [body, setBody] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);

    const commentList: IncidentComment[] = Array.isArray(comments)
        ? comments
        : comments?.data || [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || submitting || !onSubmitComment) return;
        onSubmitComment(body.trim(), replyTo?.id || null);
        setBody('');
        setReplyTo(null);
    };

    const formatDate = (isoString: string) => {
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return isoString;
        }
    };

    return (
        <section className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">
                        Resident Discussion
                    </h3>
                    <span className="rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-xs font-bold px-2 py-0.5">
                        {commentList.length}
                    </span>
                </div>
            </div>

            {/* Comment Form */}
            {canComment && onSubmitComment && (
                <form onSubmit={handleSubmit} className="mb-6">
                    {replyTo && (
                        <div className="mb-2 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            <span className="flex items-center gap-1">
                                <CornerDownRight className="w-3.5 h-3.5" />
                                Replying to <strong className="font-bold">{replyTo.author}</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => setReplyTo(null)}
                                className="font-bold hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Share an update or comment on this incident..."
                            rows={3}
                            disabled={submitting}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:bg-slate-900"
                        />
                        <button
                            type="submit"
                            disabled={!body.trim() || submitting}
                            className="absolute right-2.5 bottom-3.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            )}

            {/* Comments List */}
            {commentList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 dark:text-slate-600">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
                    <p className="text-xs font-semibold">No comments yet. Be the first to share details.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {commentList.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="flex items-start justify-between gap-3 mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                            {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                            {comment.author?.name || 'Resident'}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>

                                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line pl-9">
                                    {comment.body}
                                </p>

                                {canComment && onSubmitComment && (
                                    <div className="pl-9 mt-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setReplyTo({
                                                    id: comment.id,
                                                    author: comment.author?.name || 'Resident',
                                                })
                                            }
                                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                                        >
                                            <CornerDownRight className="w-3 h-3" /> Reply
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="pl-6 ml-3 space-y-2.5 border-l-2 border-slate-200 dark:border-slate-800">
                                    {comment.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800/80 dark:bg-slate-950/20"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-1">
                                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                    {reply.author?.name || 'Resident'}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    {formatDate(reply.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                                {reply.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
