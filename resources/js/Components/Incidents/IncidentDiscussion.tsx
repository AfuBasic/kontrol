import React, { useEffect, useRef, useState } from 'react';
import { CornerDownRight, Loader2, MessageSquare, Send } from 'lucide-react';
import type { IncidentComment, PaginatedData } from '@/types/incidents';

interface Props {
    comments: PaginatedData<IncidentComment> | IncidentComment[];
    canComment?: boolean;
    onSubmitComment?: (body: string, parentId?: number | null) => void;
    submitting?: boolean;
    error?: string | null;
    variant?: 'default' | 'security';
    className?: string;
}

const COMPOSER_MIN_HEIGHT = 48;
const COMPOSER_MAX_HEIGHT = 160;

export default function IncidentDiscussion({
    comments,
    canComment = true,
    onSubmitComment,
    submitting = false,
    error = null,
    variant = 'default',
    className = '',
}: Props) {
    const [body, setBody] = useState('');
    const [replyTo, setReplyTo] = useState<{ id: number; author: string } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const wasSubmitting = useRef(false);

    const isSecurity = variant === 'security';
    const dark = (classes: string): string => (isSecurity ? '' : classes);
    const commentList: IncidentComment[] = Array.isArray(comments) ? comments : comments?.data || [];

    const resizeComposer = () => {
        const el = textareaRef.current;

        if (!el) {
            return;
        }

        el.style.height = `${COMPOSER_MIN_HEIGHT}px`;
        el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
    };

    useEffect(() => {
        if (!isSecurity) {
            return;
        }

        resizeComposer();
    }, [body, isSecurity]);

    useEffect(() => {
        if (!isSecurity) {
            return;
        }

        if (wasSubmitting.current && !submitting && !error) {
            setBody('');
            setReplyTo(null);
            requestAnimationFrame(resizeComposer);
        }

        wasSubmitting.current = submitting;
    }, [error, isSecurity, submitting]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!body.trim() || submitting || !onSubmitComment) {
            return;
        }

        onSubmitComment(body.trim(), replyTo?.id || null);

        if (!isSecurity) {
            setBody('');
            setReplyTo(null);
        }
    };

    const formatDate = (isoString: string) => {
        try {
            const d = new Date(isoString);

            if (isSecurity) {
                const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

                return `${date} · ${time}`;
            }

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

    const canSend = Boolean(body.trim()) && !submitting;

    if (isSecurity) {
        return (
            <section className={`scroll-mt-[calc(4.5rem+var(--safe-area-inset-top-stable,env(safe-area-inset-top,0px)))] ${className}`}>
                <div className="mb-3">
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-sm font-bold tracking-tight text-slate-900">Resident Discussion</h3>
                        <span className="text-[11px] font-medium text-slate-400 tabular-nums">{commentList.length}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">Updates and conversation about this incident.</p>
                </div>

                {canComment && onSubmitComment && (
                    <form onSubmit={handleSubmit} className="mb-4" noValidate>
                        {replyTo && (
                            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600">
                                <span className="min-w-0 truncate">
                                    Replying to <strong className="font-semibold text-slate-900">{replyTo.author}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setReplyTo(null)}
                                    className="min-h-9 shrink-0 px-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                        <div className="relative rounded-xl border border-slate-200 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                            <label htmlFor="incident-discussion-composer" className="sr-only">
                                {replyTo ? `Reply to ${replyTo.author}` : 'Share an update or comment'}
                            </label>
                            <textarea
                                id="incident-discussion-composer"
                                ref={textareaRef}
                                autoCorrect="on"
                                autoCapitalize="sentences"
                                spellCheck={true}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'center', behavior: 'smooth' })}
                                placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                                rows={1}
                                disabled={submitting}
                                aria-invalid={error ? true : undefined}
                                aria-describedby={error ? 'incident-discussion-error' : undefined}
                                className="block w-full resize-none bg-transparent py-3 pr-12 pl-3 text-sm leading-5 text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:text-slate-500"
                                style={{ minHeight: COMPOSER_MIN_HEIGHT, maxHeight: COMPOSER_MAX_HEIGHT }}
                            />
                            <button
                                type="submit"
                                disabled={!canSend}
                                aria-label={submitting ? 'Sending comment' : 'Send comment'}
                                aria-disabled={!canSend}
                                className={`absolute right-2 bottom-2 inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:scale-[0.97] ${
                                    canSend ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-slate-100 text-slate-400'
                                }`}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                ) : (
                                    <Send className="h-4 w-4" aria-hidden="true" />
                                )}
                            </button>
                        </div>
                        {error && (
                            <p id="incident-discussion-error" className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
                                {error}
                            </p>
                        )}
                    </form>
                )}

                {commentList.length === 0 ? (
                    <p className="text-xs text-slate-500">No discussion yet.</p>
                ) : (
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                        {commentList.map((comment) => (
                            <article key={comment.id} className="py-3.5">
                                <div className="flex items-start gap-2.5">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">
                                        {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-baseline min-[380px]:justify-between min-[380px]:gap-3">
                                            <span className="truncate text-xs font-semibold text-slate-900">
                                                {comment.author?.name || 'Resident'}
                                            </span>
                                            <time className="shrink-0 text-[11px] text-slate-400" dateTime={comment.created_at}>
                                                {formatDate(comment.created_at)}
                                            </time>
                                        </div>
                                        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-800">{comment.body}</p>
                                        {canComment && onSubmitComment && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReplyTo({
                                                        id: comment.id,
                                                        author: comment.author?.name || 'Resident',
                                                    });
                                                    requestAnimationFrame(() => textareaRef.current?.focus());
                                                }}
                                                className="mt-1 inline-flex min-h-9 items-center text-[11px] font-medium text-slate-500 hover:text-indigo-600"
                                                aria-label={`Reply to ${comment.author?.name || 'Resident'}`}
                                            >
                                                Reply
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {comment.replies && comment.replies.length > 0 && (
                                    <div className="mt-2.5 ml-3 space-y-2.5 border-l border-slate-200 pl-3 min-[360px]:ml-4">
                                        {comment.replies.map((reply) => (
                                            <div key={reply.id} className="min-w-0">
                                                <div className="flex min-w-0 flex-col gap-0.5 min-[380px]:flex-row min-[380px]:items-baseline min-[380px]:justify-between min-[380px]:gap-3">
                                                    <span className="truncate text-xs font-semibold text-slate-900">
                                                        {reply.author?.name || 'Resident'}
                                                    </span>
                                                    <time className="shrink-0 text-[11px] text-slate-400" dateTime={reply.created_at}>
                                                        {formatDate(reply.created_at)}
                                                    </time>
                                                </div>
                                                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-slate-800">{reply.body}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}
            </section>
        );
    }

    return (
        <section
            className={`rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5 ${dark('dark:border-slate-800 dark:bg-slate-900')} ${className}`}
        >
            <div className={`mb-4 flex items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 ${dark('dark:border-slate-800')}`}>
                <div className="flex min-w-0 items-center gap-2">
                    <MessageSquare className="h-4 w-4 shrink-0 text-slate-500" />
                    <h3 className={`text-sm font-black tracking-tight text-slate-900 ${dark('dark:text-slate-100')}`}>Resident Discussion</h3>
                    <span
                        className={`shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 ${dark('dark:bg-slate-800 dark:text-slate-400')}`}
                    >
                        {commentList.length}
                    </span>
                </div>
            </div>

            {canComment && onSubmitComment && (
                <form onSubmit={handleSubmit} className="mb-5" noValidate>
                    {replyTo && (
                        <div
                            className={`mb-2 flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700 ${dark('dark:bg-indigo-950/40 dark:text-indigo-300')}`}
                        >
                            <span className="flex items-center gap-1.5 truncate">
                                <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                    Replying to <strong className="font-bold">{replyTo.author}</strong>
                                </span>
                            </span>
                            <button type="button" onClick={() => setReplyTo(null)} className="ml-2 shrink-0 font-bold hover:underline">
                                Cancel
                            </button>
                        </div>
                    )}
                    <div className="relative">
                        <textarea
                            autoCorrect="on"
                            autoCapitalize="sentences"
                            spellCheck={true}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Share an update or comment on this incident..."
                            rows={3}
                            disabled={submitting}
                            className={`w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 pr-12 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:outline-none sm:p-3.5 sm:text-sm ${dark('dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-indigo-500 dark:focus:bg-slate-900')}`}
                        />
                        <button
                            type="submit"
                            disabled={!body.trim() || submitting}
                            className="absolute right-2.5 bottom-3 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600"
                        >
                            <Send className="h-4 w-4 shrink-0" />
                        </button>
                    </div>
                </form>
            )}

            {commentList.length === 0 ? (
                <div
                    className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center text-slate-400 ${dark('dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-600')}`}
                >
                    <MessageSquare className={`mx-auto mb-1.5 h-6 w-6 shrink-0 stroke-1 text-slate-300 ${dark('dark:text-slate-700')}`} />
                    <p className={`text-xs font-semibold text-slate-500 ${dark('dark:text-slate-400')}`}>
                        No comments yet. Be the first to share details.
                    </p>
                </div>
            ) : (
                <div className="space-y-3.5">
                    {commentList.map((comment) => (
                        <div key={comment.id} className="space-y-2.5">
                            <div
                                className={`rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:p-4 ${dark('dark:border-slate-800 dark:bg-slate-950/40')}`}
                            >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700 ${dark('dark:bg-indigo-950 dark:text-indigo-300')}`}
                                        >
                                            {comment.author?.name ? comment.author.name[0].toUpperCase() : 'U'}
                                        </div>
                                        <span className={`text-xs font-bold text-slate-900 ${dark('dark:text-slate-100')}`}>
                                            {comment.author?.name || 'Resident'}
                                        </span>
                                    </div>
                                    <span
                                        className={`shrink-0 text-[10px] font-semibold whitespace-nowrap text-slate-400 sm:text-[11px] ${dark('dark:text-slate-500')}`}
                                    >
                                        {formatDate(comment.created_at)}
                                    </span>
                                </div>

                                <p
                                    className={`pl-9 text-xs leading-relaxed whitespace-pre-line text-slate-700 sm:text-sm ${dark('dark:text-slate-300')}`}
                                >
                                    {comment.body}
                                </p>

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
                                            className={`inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline ${dark('dark:text-indigo-400')}`}
                                        >
                                            <CornerDownRight className="h-3 w-3 shrink-0" />
                                            <span>Reply</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {comment.replies && comment.replies.length > 0 && (
                                <div className={`ml-3 space-y-2.5 border-l-2 border-slate-200 pl-6 ${dark('dark:border-slate-800')}`}>
                                    {comment.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className={`rounded-xl border border-slate-100 bg-slate-50/40 p-3 ${dark('dark:border-slate-800/80 dark:bg-slate-950/20')}`}
                                        >
                                            <div className="mb-1 flex items-start justify-between gap-3">
                                                <span className={`text-xs font-bold text-slate-900 ${dark('dark:text-slate-100')}`}>
                                                    {reply.author?.name || 'Resident'}
                                                </span>
                                                <span className={`text-[10px] font-semibold text-slate-400 ${dark('dark:text-slate-500')}`}>
                                                    {formatDate(reply.created_at)}
                                                </span>
                                            </div>
                                            <p
                                                className={`text-xs leading-relaxed whitespace-pre-line text-slate-600 ${dark('dark:text-slate-300')}`}
                                            >
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
