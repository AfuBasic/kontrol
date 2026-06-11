import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Download,
    Eye,
    Lock,
    MapPin,
    MessageSquare,
    MessageSquareMore,
    Send,
    ThumbsUp,
    Trash2,
    Wrench,
    X,
    ZoomIn,
} from 'lucide-react';
import React, { useState } from 'react';

import Modal from '@/Components/Modal';
import ResidentLayout from '@/Layouts/ResidentLayout';
import type { Incident, IncidentComment, IncidentStatus, PaginatedData, SharedData } from '@/types';

type Props = {
    incident: Incident;
    comments: PaginatedData<IncidentComment>;
    canClose: boolean;
};

const statusSteps: Array<{ key: IncidentStatus; label: string; desc: string }> = [
    { key: 'pending', label: 'Pending', desc: 'Awaiting board review' },
    { key: 'acknowledged', label: 'Acknowledged', desc: 'Received & logged' },
    { key: 'resolving', label: 'Resolving', desc: 'Work is currently active' },
    { key: 'solved', label: 'Solved', desc: 'Awaiting your closure' },
    { key: 'closed', label: 'Closed', desc: 'Resolved and archives closed' },
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
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const isReporter = incident.reporter_id === authUser?.id;
    const reporterName = isReporter ? 'you' : incident.reporter?.name || 'Deleted User';

    // Get current status index
    const currentStatusIdx = statusSteps.findIndex((s) => s.key === incident.status);

    const handleUpvote = () => {
        if (isReporter) return;

        router.post(
            `/resident/incidents/${incident.hashid}/upvote`,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    const handleClose = () => {
        if (!canClose) return;

        router.post(
            `/resident/incidents/${incident.hashid}/close`,
            {},
            {
                onSuccess: () => {
                    // Marks as closed
                },
            },
        );
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this incident report? This action cannot be undone.')) {
            router.delete(`/resident/incidents/${incident.hashid}`);
        }
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        router.post(
            `/resident/incidents/${incident.hashid}/comments`,
            {
                body: commentText,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentText('');
                },
                onFinish: () => {
                    setSubmittingComment(false);
                },
            },
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

            {/* Premium Header Back Link */}
            <div className="mb-4">
                <Link
                    href="/resident/incidents"
                    className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Incident Feed
                </Link>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left/Main Column: Incident Details & Timeline */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Details Card */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-black tracking-[0.2em] text-indigo-600 uppercase">
                                    {incident.category.replace('_', ' ')}
                                </span>
                                {incident.is_private && (
                                    <span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[9px] font-black tracking-[0.2em] text-amber-700 uppercase flex items-center gap-1">
                                        <Lock className="h-3 w-3" />
                                        Private
                                    </span>
                                )}
                            </div>
                            <span className="text-xs font-medium text-slate-400">Reported on {format(new Date(incident.created_at), 'PPP')}</span>
                        </div>

                        <h1 className="mb-3 text-xl leading-tight font-black text-slate-900 sm:text-2xl">{incident.title}</h1>

                        {incident.location && (
                            <div className="mb-4 flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200/50 rounded-xl px-3 py-1.5 w-fit">
                                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                                <span>{incident.location}</span>
                            </div>
                        )}

                        <p className="mb-6 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">{incident.body}</p>

                        {/* Media Preview / Interactive Expandable Card */}
                        {incident.attachment_url && (
                            <div
                                className="group relative mb-6 cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-xs"
                                onClick={() => {
                                    if (incident.attachment_type === 'image') {
                                        setIsLightboxOpen(true);
                                    }
                                }}
                            >
                                {incident.attachment_type === 'image' ? (
                                    <>
                                        <img
                                            src={incident.attachment_url}
                                            alt="Attachment"
                                            className="max-h-96 w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                                            <span className="flex items-center gap-1.5 rounded-xl bg-white/95 px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-lg transition-transform active:scale-95">
                                                <ZoomIn className="h-4 w-4" /> Click to Expand View
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <video
                                        src={incident.attachment_url}
                                        controls
                                        onClick={(e) => e.stopPropagation()}
                                        className="max-h-96 w-full object-contain"
                                    />
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                    <span>
                                        Reported by <b className="capitalize">{reporterName}</b>
                                    </span>
                                </div>

                                <button
                                    onClick={handleUpvote}
                                    disabled={isReporter}
                                    className={`flex min-h-[38px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-black tracking-wider uppercase transition-all ${
                                        incident.is_upvoted
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                                            : isReporter
                                              ? 'cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400'
                                              : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 active:scale-95'
                                    }`}
                                >
                                    <ThumbsUp className="h-3.5 w-3.5" fill={incident.is_upvoted ? 'currentColor' : 'none'} />
                                    <span>{incident.upvotes_count} Upvotes</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                {isReporter && incident.status === 'pending' && (
                                    <button
                                        onClick={handleDelete}
                                        className="hover:text-red-750 inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-black tracking-wider text-red-500 uppercase transition-all hover:bg-red-50 active:scale-95"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Report
                                    </button>
                                )}

                                {canClose && (
                                    <button
                                        onClick={handleClose}
                                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black tracking-wider text-white uppercase shadow-md shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95"
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Close Incident
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                                <MessageSquareMore className="h-5 w-5 text-indigo-500" />
                                Comments & Updates
                            </h3>
                            <span className="rounded-md border border-slate-100/80 bg-slate-50 px-2.5 py-1 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                {incident.comments_count} Updates
                            </span>
                        </div>

                        {/* Discussion thread */}
                        {comments.data.length > 0 ? (
                            <div className="mb-6 space-y-5">
                                {comments.data.map((comment) => (
                                    <div key={comment.id} className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-bold text-slate-600">
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="border-slate-150 flex-1 rounded-2xl border bg-slate-50/50 p-4">
                                                <div className="mb-2 flex items-start justify-between gap-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-bold text-slate-800">
                                                            {comment.author.name}
                                                        </span>
                                                        {comment.is_official && (
                                                            <span className="border-blue-150 inline-flex items-center rounded-full border bg-blue-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-800 uppercase">
                                                                Official
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {comment.author.id === authUser?.id && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="text-slate-400 -mt-2 -mr-2 flex min-h-[32px] min-w-[32px] items-center justify-center hover:text-red-500"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs leading-relaxed text-slate-600">{comment.body}</p>
                                                <div className="mt-2 flex justify-end">
                                                    <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                        {formatDistanceToNow(new Date(comment.created_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Replies - Threaded view with guide branches */}
                                        {comment.replies &&
                                            comment.replies.map((reply) => (
                                                <div key={reply.id} className="relative flex items-start gap-3 pl-11">
                                                    <div className="absolute top-0 bottom-6 left-5 w-0.5 bg-slate-200/80" />
                                                    <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                                                        {reply.author.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="border-slate-150 flex-1 rounded-2xl border bg-slate-50/20 p-3.5">
                                                        <div className="mb-2 flex items-center justify-between">
                                                            <span className="text-xs font-bold text-slate-800">{reply.author.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                {reply.is_official && (
                                                                    <span className="border-blue-150 inline-flex items-center rounded-full border bg-blue-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-800 uppercase">
                                                                        Official
                                                                    </span>
                                                                )}
                                                                {reply.author.id === authUser?.id && (
                                                                    <button
                                                                        onClick={() => handleDeleteComment(reply.id)}
                                                                        className="text-slate-400 -mt-2 -mr-2 flex min-h-[32px] min-w-[32px] items-center justify-center hover:text-red-500"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs leading-relaxed text-slate-600">{reply.body}</p>
                                                        <div className="mt-2 flex justify-end">
                                                            <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                                {formatDistanceToNow(new Date(reply.created_at), {
                                                                    addSuffix: true,
                                                                })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mb-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center">
                                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                                <p className="text-slate-405 text-xs font-bold">No comments yet. Start the conversation!</p>
                            </div>
                        )}

                        {/* Comment Input - Premium Capsule style */}
                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleCommentSubmit} className="space-y-3">
                                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
                                    <input
                                        type="text"
                                        placeholder="Add to the discussion..."
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className="min-h-[44px] flex-1 border-0 bg-transparent px-3 text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:ring-0"
                                        maxLength={2000}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="rounded-2xl border border-slate-100 bg-slate-50 py-3 text-center text-xs text-slate-400">
                                This incident is closed. Discussion has been locked.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column: Status Tracker Timeline */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <h3 className="mb-6 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">Resolution Timeline</h3>

                        <div className="ml-2">
                            {statusSteps.map((step, idx) => {
                                const isCompleted = idx <= currentStatusIdx;
                                const isCurrent = idx === currentStatusIdx;
                                const stepStyles = getStatusStyles(step.key);
                                const isLast = idx === statusSteps.length - 1;

                                return (
                                    <div key={step.key} className="relative flex gap-5">
                                        {/* Timeline Dot & Line Column */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all relative z-10 ${
                                                    isCurrent
                                                        ? `${stepStyles.bg} scale-110 border-white shadow-lg`
                                                        : isCompleted
                                                          ? 'border-white bg-slate-800 text-white'
                                                          : 'text-slate-400 border-slate-200 bg-white'
                                                }`}
                                            >
                                                {isCurrent ? (
                                                    stepStyles.icon
                                                ) : isCompleted ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                ) : (
                                                    <div className="bg-slate-300 h-1.5 w-1.5 rounded-full" />
                                                )}
                                            </div>
                                            {/* Line connecting to next item */}
                                            {!isLast && (
                                                <div className="w-0.5 bg-slate-100 grow my-1" />
                                            )}
                                        </div>

                                        {/* Step Content */}
                                        <div className={`flex-1 ${!isLast ? 'pb-8' : ''}`}>
                                            <h4
                                                className={`h-7 flex items-center text-[10px] font-black tracking-wider uppercase ${
                                                    isCurrent ? stepStyles.text : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                                }`}
                                            >
                                                {step.label}
                                            </h4>
                                            <p className={`mt-0.5 text-xs leading-relaxed ${isCurrent ? 'text-slate-600 font-semibold' : isCompleted ? 'text-slate-500' : 'text-slate-400/80'}`}>{step.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Twitter-Like Image Lightbox */}
            <AnimatePresence>
                {isLightboxOpen && incident.attachment_url && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-xs"
                    >
                        {/* Top Navigation Bar (Notch/Status Bar Safe) */}
                        <div className="pt-safe absolute inset-x-0 top-0 z-10 flex items-center justify-between px-6 py-4">
                            <button
                                onClick={() => setIsLightboxOpen(false)}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 active:scale-95"
                                aria-label="Close preview"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <div className="w-11" />
                        </div>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="relative flex max-h-[80vh] w-full max-w-4xl items-center justify-center overflow-auto"
                        >
                            <img
                                src={incident.attachment_url}
                                alt="Attachment full preview"
                                className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl select-text"
                            />
                        </motion.div>

                        {/* Control bar / Download button at the bottom */}
                        <div className="mt-6 flex flex-col items-center gap-2">
                            <a
                                href={incident.attachment_url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-[48px] min-w-[160px] items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-xl transition-all hover:bg-slate-100 active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download</span>
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

Show.layout = (page: React.ReactNode) => <ResidentLayout children={page} />;
