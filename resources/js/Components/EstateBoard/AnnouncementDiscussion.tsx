import { formatDistanceToNow } from 'date-fns';
import { MessageCircle, Send, Trash2, Reply } from 'lucide-react';
import React, { useState } from 'react';
import type { EstateBoardComment } from '@/types';

interface CommentItemProps {
    comment: EstateBoardComment;
    onDelete?: (commentId: number) => void;
    canDeleteGlobal?: boolean;
    currentUserId?: number;
}

function CommentItem({ comment, onDelete, canDeleteGlobal, currentUserId }: CommentItemProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const isAuthor = currentUserId !== undefined && comment.author.id === currentUserId;
    const canDelete = Boolean(comment.can_delete || canDeleteGlobal || isAuthor);

    const initial = (comment.author?.name || 'User').charAt(0).toUpperCase();

    return (
        <div className="flex gap-3 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                {initial}
            </div>
            <div className="flex-1 min-w-0">
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
                    <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-slate-900">
                            {comment.author?.name || 'Anonymous Resident'}
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                            {comment.created_at
                                ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                                : 'Recently'}
                        </span>
                    </div>
                    <p className="text-xs leading-relaxed font-normal text-slate-700 break-words">
                        {comment.body}
                    </p>
                </div>

                {canDelete && (
                    <div className="mt-1.5 flex items-center gap-3 px-1">
                        {showDeleteConfirm ? (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500">Delete comment?</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onDelete?.(comment.id);
                                        setShowDeleteConfirm(false);
                                    }}
                                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                                >
                                    Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 transition-colors hover:text-rose-600"
                            >
                                <Trash2 className="h-3 w-3" />
                                Delete
                            </button>
                        )}
                    </div>
                )}

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-3 sm:pl-4">
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                onDelete={onDelete}
                                canDeleteGlobal={canDeleteGlobal}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

interface AnnouncementDiscussionProps {
    comments: EstateBoardComment[];
    commentsCount: number;
    commentBody: string;
    onCommentBodyChange: (value: string) => void;
    onSubmitComment: (e: React.FormEvent) => void;
    onDeleteComment: (commentId: number) => void;
    processing?: boolean;
    error?: string;
    currentUserId?: number;
    canDeleteGlobal?: boolean;
    nextPageUrl?: string | null;
    loadMoreRef?: React.RefObject<HTMLDivElement | null>;
    className?: string;
}

export default function AnnouncementDiscussion({
    comments,
    commentsCount,
    commentBody,
    onCommentBodyChange,
    onSubmitComment,
    onDeleteComment,
    processing = false,
    error,
    currentUserId,
    canDeleteGlobal = false,
    nextPageUrl,
    loadMoreRef,
    className = '',
}: AnnouncementDiscussionProps) {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <section className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-black text-slate-900">Discussion</h2>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {commentsCount}
                    </span>
                </div>
            </div>

            {/* Composer */}
            <form onSubmit={onSubmitComment} className="space-y-2">
                <div className={`relative rounded-2xl border bg-slate-50/70 transition-all ${
                    isFocused ? 'border-primary-500 bg-white ring-2 ring-primary-500/10' : 'border-slate-200'
                }`}>
                    <textarea
                        value={commentBody}
                        onChange={(e) => onCommentBodyChange(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Write a comment..."
                        rows={isFocused || commentBody.trim() ? 3 : 2}
                        className="w-full resize-none rounded-2xl border-0 bg-transparent px-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                    />
                    <div className="flex items-center justify-end px-3 pb-2.5">
                        <button
                            type="submit"
                            disabled={processing || !commentBody.trim()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-slate-800 active:scale-95 disabled:opacity-40"
                        >
                            <Send className="h-3.5 w-3.5" />
                            {processing ? 'Posting...' : 'Post'}
                        </button>
                    </div>
                </div>
                {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
            </form>

            {/* Comment List */}
            {comments.length > 0 ? (
                <div className="space-y-4 pt-1">
                    {comments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onDelete={onDeleteComment}
                            canDeleteGlobal={canDeleteGlobal}
                            currentUserId={currentUserId}
                        />
                    ))}

                    {nextPageUrl && loadMoreRef && (
                        <div ref={loadMoreRef} className="flex justify-center py-4">
                            <div className="flex gap-1.5">
                                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 py-8 text-center">
                    <MessageCircle className="mx-auto h-7 w-7 text-slate-300" />
                    <p className="mt-2 text-xs font-bold text-slate-700">No comments yet</p>
                    <p className="text-[11px] font-medium text-slate-400">Be the first to share your thoughts.</p>
                </div>
            )}
        </section>
    );
}
