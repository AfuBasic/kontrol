import React, { useState } from 'react';
import { CornerDownRight, MessageSquare, Send } from 'lucide-react';
import type { IncidentComment, PaginatedData } from '@/types/incidents';

interface Props {
    comments: PaginatedData<IncidentComment> | IncidentComment[];
    canComment?: boolean;
    onSubmitComment?: (body: string, parentId?: number | null) => void;
    submitting?: boolean;
    className?: string;
}

export default function IncidentDiscussion({ comments, canComment = true, onSubmitComment, submitting = false, className = '' }: Props) {
    const [body, setBody] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);

    const commentList: IncidentComment[] = Array.isArray(comments) ? comments : comments?.data || [];

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
        <section className={`rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 ${className}`}>
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                    <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-slate-100">Resident Discussion</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                        {commentList.length}
                    </span>
                </div>
            </div>

            {/* Comment Form */}
            {canComment && onSubmitComment && (
                <form onSubmit={handleSubmit} className="mb-5" noValidate>
                    {replyTo && (
                        <div className="mb-2 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                            <span className="flex items-center gap-1.5 truncate">
                                <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
                                <span>Replying to <strong className="font-bold">{replyTo.author}</strong></span>
                            </span>
                            <button type="button" onClick={() => setReplyTo(null)} className="font-bold hover:underline shrink-0 ml-2">
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
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 sm:p-3.5 pr-12 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:bg-slate-900"
                        />
                        <button
                            type="submit"
                            disabled={!body.trim() || submitting}
                            className="absolute right-2.5 bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 shrink-0"
                        >
                            <Send className="h-4 w-4 shrink-0" />
                        </button>
                    </div>
                </form>
            )}

            {/* Comments List */}
            {commentList.length === 0 ? (
                <div className="py-6 text-center text-slate-400 dark:text-slate-600 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/30">
                    <MessageSquare className="mx-auto mb-1.5 h-6 w-6 stroke-1 text-slate-300 dark:text-slate-700 shrink-0" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No comments yet. Be the first to share details.</p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {commentList.map((comment) => (
                        <div key={comment.id} className="space-y-2.5">
                            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-950/40">
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                            {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                            {comment.author?.name || 'Resident'}
                                        </span>
                                    </div>
                                    <span className="text-[10px] sm:text-[11px] font-semibold whitespace-nowrap text-slate-400 dark:text-slate-500 shrink-0">
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>

                                <p className="pl-9 text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300">{comment.body}</p>

                                {canComment && onSubmitComment && (
                                    <div className="mt-2 pl-9">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setReplyTo({
                                                    id: comment.id,
                                                    author: comment.author?.name || 'Resident',
                                                })
                                            }
                                            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                                        >
                                            <CornerDownRight className="h-3 w-3 shrink-0" />
                                            <span>Reply</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <div className="ml-3 space-y-2.5 border-l-2 border-slate-200 pl-6 dark:border-slate-800">
                                    {comment.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className="rounded-xl border border-slate-100 bg-slate-50/40 p-3 dark:border-slate-800/80 dark:bg-slate-950/20"
                                        >
                                            <div className="mb-1 flex items-start justify-between gap-3">
                                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                                    {reply.author?.name || 'Resident'}
                                                </span>
                                                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                                    {formatDate(reply.created_at)}
                                                </span>
                                            </div>
                                            <p className="text-xs leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-300">
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
