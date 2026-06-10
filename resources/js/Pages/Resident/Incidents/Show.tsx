import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Eye,
    MessageSquare,
    MessageSquareMore,
    Send,
    ThumbsUp,
    Trash2,
    Wrench,
} from 'lucide-react';
import React, { useState } from 'react';

import ResidentLayout from '@/Layouts/ResidentLayout';
import type { Incident, IncidentComment, IncidentStatus, PaginatedData, SharedData } from '@/types';

type Props = {
    incident: Incident;
    comments: PaginatedData<IncidentComment>;
    canClose: boolean;
};

const statusSteps: Array<{ key: IncidentStatus; label: string; desc: string }> = [
    { key: 'pending', label: 'Pending', desc: 'Awaiting review' },
    { key: 'acknowledged', label: 'Acknowledged', desc: 'Received by admin' },
    { key: 'resolving', label: 'Resolving', desc: 'Work is underway' },
    { key: 'solved', label: 'Solved', desc: 'Resolution proposed' },
    { key: 'closed', label: 'Closed', desc: 'Reporter confirmed' },
];

const getStatusStyles = (status: IncidentStatus) => {
    switch (status) {
        case 'pending':
            return { bg: 'bg-amber-500', text: 'text-amber-700', icon: <Clock className="h-4 w-4 text-white" /> };
        case 'acknowledged':
            return { bg: 'bg-blue-500', text: 'text-blue-700', icon: <Eye className="h-4 w-4 text-white" /> };
        case 'resolving':
            return { bg: 'bg-indigo-500', text: 'text-indigo-700', icon: <Wrench className="h-4 w-4 text-white" /> };
        case 'solved':
            return { bg: 'bg-emerald-500', text: 'text-emerald-700', icon: <CheckCircle2 className="h-4 w-4 text-white" /> };
        case 'closed':
            return { bg: 'bg-slate-500', text: 'text-slate-700', icon: <CheckCircle2 className="h-4 w-4 text-white" /> };
        default:
            return { bg: 'bg-slate-500', text: 'text-slate-700', icon: <Clock className="h-4 w-4 text-white" /> };
    }
};

export default function Show({ incident, comments, canClose }: Props) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [commentText, setCommentText] = useState('');
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);

    const isReporter = incident.reporter_id === authUser?.id;

    // Get current status index
    const currentStatusIdx = statusSteps.findIndex(s => s.key === incident.status);

    const handleUpvote = () => {
        if (isReporter) return;

        router.post(`/resident/incidents/${incident.hashid}/upvote`, {}, {
            preserveScroll: true,
        });
    };

    const handleClose = () => {
        if (!canClose) return;

        router.post(`/resident/incidents/${incident.hashid}/close`, {}, {
            onSuccess: () => {
                // Marks as closed
            },
        });
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        router.post(
            `/resident/incidents/${incident.hashid}/comments`,
            {
                body: commentText,
                parent_id: replyToId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentText('');
                    setReplyToId(null);
                },
                onFinish: () => {
                    setSubmittingComment(false);
                },
            }
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            router.delete(`/resident/incidents/comments/${commentId}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title={`Incident: ${incident.title}`} />

            {/* Back Button */}
            <div className="mb-4">
                <Link
                    href="/resident/incidents"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to incidents
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left/Main Column: Incident Details & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details Card */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {incident.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Reported on {format(new Date(incident.created_at), 'PPP')}
                            </span>
                        </div>

                        <h1 className="text-xl font-black text-slate-900 sm:text-2xl mb-4">
                            {incident.title}
                        </h1>

                        <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap mb-6">
                            {incident.body}
                        </p>

                        {/* Media Preview */}
                        {incident.attachment_url && (
                            <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                {incident.attachment_type === 'image' ? (
                                    <img
                                        src={incident.attachment_url}
                                        alt="Attachment"
                                        className="max-h-96 w-full object-contain"
                                    />
                                ) : (
                                    <video
                                        src={incident.attachment_url}
                                        controls
                                        className="max-h-96 w-full object-contain"
                                    />
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                                    {incident.reporter.name.charAt(0).toUpperCase()}
                                </div>
                                <span>Reported by <b>{incident.reporter.name}</b></span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleUpvote}
                                    disabled={isReporter}
                                    className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-all ${
                                        incident.is_upvoted
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : isReporter
                                              ? 'text-slate-300 cursor-not-allowed border border-slate-100'
                                              : 'border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                                >
                                    <ThumbsUp
                                        className="h-4.5 w-4.5"
                                        fill={incident.is_upvoted ? 'currentColor' : 'none'}
                                    />
                                    <span>{incident.upvotes_count} Upvotes</span>
                                </button>

                                {canClose && (
                                    <button
                                        onClick={handleClose}
                                        className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700"
                                    >
                                        <CheckCircle2 className="h-4.5 w-4.5" />
                                        Close Incident
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
                            <MessageSquareMore className="h-5 w-5 text-slate-400" />
                            Community Discussion ({incident.comments_count})
                        </h3>

                        {/* Discussion thread */}
                        {comments.data.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                {comments.data.map(comment => (
                                    <div key={comment.id} className="space-y-3">
                                        <div className="flex gap-3 items-start">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-xs">
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 rounded-2xl bg-slate-50 p-3.5">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        {comment.author.name}
                                                        {comment.is_official && (
                                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-800 uppercase ring-1 ring-blue-200">
                                                                Official
                                                            </span>
                                                        )}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {formatDistanceToNow(new Date(comment.created_at), {
                                                                addSuffix: true,
                                                            })}
                                                        </span>
                                                        {comment.author.id === authUser?.id && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="text-slate-400 hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs leading-relaxed text-slate-600">
                                                    {comment.body}
                                                </p>
                                                {incident.status !== 'closed' && (
                                                    <button
                                                        onClick={() => setReplyToId(comment.id)}
                                                        className="mt-2 text-[10px] font-bold text-indigo-600 hover:underline"
                                                    >
                                                        Reply
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Replies */}
                                        {comment.replies && comment.replies.map(reply => (
                                            <div key={reply.id} className="flex gap-3 items-start pl-11">
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-[10px]">
                                                    {reply.author.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 rounded-2xl bg-slate-50 p-3">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                            {reply.author.name}
                                                            {reply.is_official && (
                                                                <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-800 uppercase ring-1 ring-blue-200">
                                                                    Official
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-400 font-medium">
                                                                {formatDistanceToNow(new Date(reply.created_at), {
                                                                    addSuffix: true,
                                                                })}
                                                            </span>
                                                            {reply.author.id === authUser?.id && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(reply.id)}
                                                                    className="text-slate-400 hover:text-red-500"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs leading-relaxed text-slate-600">
                                                        {reply.body}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 mb-6">
                                <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400">No comments yet. Start the conversation!</p>
                            </div>
                        )}

                        {/* Comment Input */}
                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleCommentSubmit} className="space-y-3">
                                {replyToId && (
                                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-1.5 text-xs text-slate-500">
                                        <span>Replying to a comment...</span>
                                        <button
                                            type="button"
                                            onClick={() => setReplyToId(null)}
                                            className="text-slate-400 hover:text-slate-600 font-bold"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add to the discussion..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4"
                                        maxLength={2000}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-center text-xs text-slate-400">
                                This incident is closed. Discussion has been locked.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column: Status Tracker Timeline */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                        <h3 className="mb-5 text-sm font-black tracking-wider text-slate-400 uppercase">
                            Resolution Timeline
                        </h3>

                        <div className="relative border-l border-slate-100 pl-6 ml-2 space-y-6">
                            {statusSteps.map((step, idx) => {
                                const isCompleted = idx <= currentStatusIdx;
                                const isCurrent = idx === currentStatusIdx;
                                const stepStyles = getStatusStyles(step.key);

                                return (
                                    <div key={step.key} className="relative">
                                        {/* Timeline Dot/Icon */}
                                        <div
                                            className={`absolute left-[-34px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                                isCurrent
                                                    ? `${stepStyles.bg} border-white shadow-md scale-110`
                                                    : isCompleted
                                                      ? 'bg-slate-800 border-white text-white'
                                                      : 'bg-white border-slate-200 text-slate-300'
                                            }`}
                                        >
                                            {isCurrent ? (
                                                stepStyles.icon
                                            ) : isCompleted ? (
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            ) : (
                                                <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                            )}
                                        </div>

                                        {/* Step Content */}
                                        <div>
                                            <h4
                                                className={`text-xs font-black uppercase tracking-wider ${
                                                    isCurrent
                                                        ? stepStyles.text
                                                        : isCompleted
                                                          ? 'text-slate-800'
                                                          : 'text-slate-400'
                                                }`}
                                            >
                                                {step.label}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
