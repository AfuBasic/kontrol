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

import AdminLayout from '@/Layouts/AdminLayout';
import Modal from '@/Components/Modal';
import type { Incident, IncidentComment, IncidentStatus, PaginatedData, SharedData } from '@/types';

type Props = {
    incident: Incident;
    comments: PaginatedData<IncidentComment>;
    admins: Array<{ id: number; name: string }>;
    statuses: Array<{ value: string; label: string }>;
};

const getStatusStyles = (status: IncidentStatus) => {
    switch (status) {
        case 'pending':
            return {
                bg: 'bg-amber-500',
                text: 'text-amber-700',
                border: 'border-amber-200/50',
                icon: <Clock className="h-4 w-4 text-white" />,
                label: 'Pending',
            };
        case 'acknowledged':
            return {
                bg: 'bg-blue-500',
                text: 'text-blue-700',
                border: 'border-blue-200/50',
                icon: <Eye className="h-4 w-4 text-white" />,
                label: 'Acknowledged',
            };
        case 'resolving':
            return {
                bg: 'bg-indigo-500',
                text: 'text-indigo-700',
                border: 'border-indigo-200/50',
                icon: <Wrench className="h-4 w-4 text-white" />,
                label: 'Resolving',
            };
        case 'solved':
            return {
                bg: 'bg-emerald-500',
                text: 'text-emerald-700',
                border: 'border-emerald-200/50',
                icon: <CheckCircle2 className="h-4 w-4 text-white" />,
                label: 'Solved',
            };
        case 'closed':
            return {
                bg: 'bg-slate-500',
                text: 'text-slate-700',
                border: 'border-slate-300',
                icon: <CheckCircle2 className="h-4 w-4 text-white" />,
                label: 'Closed',
            };
        default:
            return {
                bg: 'bg-slate-500',
                text: 'text-slate-700',
                border: 'border-slate-300',
                icon: <Clock className="h-4 w-4 text-white" />,
                label: 'Unknown',
            };
    }
};

export default function Show({ incident, comments, admins, statuses }: Props) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [commentText, setCommentText] = useState('');
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Form for updating status & assignment
    const {
        data,
        setData,
        put,
        processing: updatingStatus,
        errors,
    } = useForm({
        status: incident.status,
        assigned_to: incident.assigned_to?.id || '',
    });

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [targetStatus, setTargetStatus] = useState<IncidentStatus | null>(null);

    const nextStatusMap: Record<
        IncidentStatus,
        { next: IncidentStatus | null; label: string; confirmTitle: string; confirmText: string; colorClass: string } | null
    > = {
        pending: {
            next: 'acknowledged',
            label: 'Acknowledge Incident',
            confirmTitle: 'Acknowledge Incident',
            confirmText:
                'Are you sure you want to acknowledge this incident? This will notify the resident that the estate office has received the report and is reviewing it.',
            colorClass: 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 text-white',
        },
        acknowledged: {
            next: 'resolving',
            label: 'Start Resolving',
            confirmTitle: 'Start Incident Resolution',
            confirmText:
                'Are you sure you want to start resolving this incident? This will notify the resident that active work or investigation has begun.',
            colorClass: 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-white',
        },
        resolving: {
            next: 'solved',
            label: 'Mark as Solved',
            confirmTitle: 'Mark Incident as Solved',
            confirmText:
                'Are you sure you want to mark this incident as solved? This will notify the resident to verify and close the incident report.',
            colorClass: 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 text-white',
        },
        solved: null,
        closed: null,
    };

    const handleAdvanceStatus = (nextStatus: IncidentStatus) => {
        router.put(
            `/admin/incidents/${incident.hashid}/status`,
            {
                status: nextStatus,
                assigned_to: data.assigned_to,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsConfirmModalOpen(false);
                    setTargetStatus(null);
                },
            },
        );
    };

    const handleAssigneeChange = (staffId: string) => {
        setData('assigned_to', staffId);
        router.put(
            `/admin/incidents/${incident.hashid}/status`,
            {
                status: incident.status,
                assigned_to: staffId,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        router.post(
            `/admin/incidents/${incident.hashid}/comments`,
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
            },
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            router.delete(`/admin/incidents/comments/${commentId}`, {
                preserveScroll: true,
            });
        }
    };

    const statusInfo = getStatusStyles(incident.status);

    return (
        <>
            <Head title={`Manage Incident: ${incident.title}`} />

            {/* Premium Header Back Link */}
            <div className="mb-4">
                <Link
                    href="/admin/incidents"
                    className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-800"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to incidents
                </Link>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left/Main Content */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Details Card */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[9px] font-black tracking-[0.2em] text-indigo-600 uppercase">
                                {incident.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-medium text-slate-400">Reported {format(new Date(incident.created_at), 'PPP')}</span>
                        </div>

                        <h1 className="mb-4 text-xl leading-tight font-black text-slate-900 sm:text-2xl">{incident.title}</h1>

                        <p className="mb-6 text-sm leading-relaxed whitespace-pre-wrap text-slate-600">{incident.body}</p>

                        {/* Attachment Preview / Lightbox Trigger */}
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

                        {/* Reporter & Metadata */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[9px] font-black text-slate-600">
                                    {incident.reporter.name.charAt(0).toUpperCase()}
                                </div>
                                <span>
                                    Reported by <b>{incident.reporter.name}</b> ({incident.reporter.email})
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Admin Management Controls */}
                <div className="space-y-6">
                    {/* Status Update Card */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <h3 className="text-slate-405 mb-4 text-[10px] font-black tracking-[0.2em] uppercase">Status & Assignment</h3>

                        {incident.status !== 'closed' ? (
                            <div className="space-y-4">
                                {/* Current Status Info */}
                                <div>
                                    <label className="mb-2 block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                        Current Status
                                    </label>
                                    <div
                                        className={`inline-flex items-center gap-2 rounded-xl border ${statusInfo.border} px-3 py-1.5 text-xs font-bold ${statusInfo.text} bg-slate-50`}
                                    >
                                        <div className={`h-2 w-2 rounded-full ${statusInfo.bg}`} />
                                        <span>{statusInfo.label}</span>
                                    </div>
                                </div>

                                {/* Assignee Selection */}
                                <div>
                                    <label className="mb-1.5 block text-[10px] font-black tracking-wider text-slate-400 uppercase">
                                        Assign To Staff
                                    </label>
                                    <select
                                        value={data.assigned_to}
                                        onChange={(e) => handleAssigneeChange(e.target.value)}
                                        className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-indigo-100 outline-hidden transition-all focus:border-indigo-500 focus:ring-4"
                                    >
                                        <option value="">Unassigned</option>
                                        {admins.map((adm) => (
                                            <option key={adm.id} value={adm.id}>
                                                {adm.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assigned_to && <p className="mt-1 text-[10px] font-bold text-red-500">{errors.assigned_to}</p>}
                                </div>

                                {/* Advance Status Action */}
                                {nextStatusMap[incident.status] ? (
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const mapping = nextStatusMap[incident.status];
                                                if (mapping && mapping.next) {
                                                    setTargetStatus(mapping.next);
                                                    setIsConfirmModalOpen(true);
                                                }
                                            }}
                                            className={`inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-95 ${
                                                nextStatusMap[incident.status]?.colorClass
                                            }`}
                                        >
                                            {nextStatusMap[incident.status]?.label}
                                        </button>
                                    </div>
                                ) : incident.status === 'solved' ? (
                                    <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
                                        Awaiting the reporter to verify and close the incident report.
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-slate-605 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs">
                                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                    <span>This incident is marked as Closed by the reporter.</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {incident.closed_at && <p>Closed on {format(new Date(incident.closed_at), 'PPP')}</p>}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Admin Comments Thread */}
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

                        {comments.data.length > 0 ? (
                            <div className="mb-6 space-y-5">
                                {comments.data.map((comment) => (
                                    <div key={comment.id} className="space-y-4">
                                        <div className="flex items-start gap-3.5">
                                            {/* Initials Avatar */}
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200/65 bg-slate-50 text-xs font-black text-slate-700 shadow-2xs select-none">
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition-all hover:bg-slate-50/80">
                                                <div className="mb-2 flex items-start justify-between gap-4">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="text-xs font-black text-slate-900">{comment.author.name}</span>
                                                        {comment.is_official && (
                                                            <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[8px] font-black tracking-widest text-indigo-700 uppercase">
                                                                Official
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50/30 hover:text-red-500 -mr-2 -mt-2"
                                                            title="Delete Comment"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600">{comment.body}</p>
                                                <div className="mt-2 flex justify-end">
                                                    <span className="text-[9px] tracking-wider text-slate-400 font-bold uppercase">
                                                        {formatDistanceToNow(new Date(comment.created_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Threaded replies */}
                                        {comment.replies &&
                                            comment.replies.map((reply) => (
                                                <div key={reply.id} className="relative flex items-start gap-3.5 pl-11">
                                                    <div className="absolute top-0 bottom-4 left-[33px] w-0.5 bg-slate-200/60" />
                                                    {/* Mini Initials Avatar */}
                                                    <div className="shadow-3xs z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200/70 bg-slate-50 text-[10px] font-black text-slate-600 select-none">
                                                        {reply.author.name.charAt(0).toUpperCase()}
                                                    </div>

                                                    <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/20 p-3.5 transition-all hover:bg-slate-50/50">
                                                        <div className="mb-2 flex items-start justify-between gap-4">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className="text-xs font-black text-slate-900">{reply.author.name}</span>
                                                                {reply.is_official && (
                                                                    <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[8px] font-black tracking-widest text-indigo-700 uppercase">
                                                                        Official
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex shrink-0 items-center gap-2">
                                                                <button
                                                                    onClick={() => handleDeleteComment(reply.id)}
                                                                    className="flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50/30 hover:text-red-500 -mr-2 -mt-2"
                                                                    title="Delete Reply"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600">{reply.body}</p>
                                                        <div className="mt-2 flex justify-end">
                                                            <span className="text-[9px] tracking-wider text-slate-400 font-bold uppercase">
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
                                <p className="text-xs text-slate-400">No comments yet.</p>
                            </div>
                        )}

                        {/* Comment Input Form - Capsule layout */}
                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleCommentSubmit} className="space-y-3">
                                {replyToId && (
                                    <div className="border-slate-150 animate-fadeIn flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
                                        <span>Replying to comment...</span>
                                        <button
                                            type="button"
                                            onClick={() => setReplyToId(null)}
                                            className="min-h-[32px] text-[10px] font-black tracking-wider text-slate-400 uppercase hover:text-slate-700"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-1.5 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100">
                                    <input
                                        type="text"
                                        placeholder={replyToId ? 'Write a reply...' : 'Add an official administrator response...'}
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

                    {/* Confirmation Modal */}
                    <Modal
                        isOpen={isConfirmModalOpen}
                        onClose={() => {
                            setIsConfirmModalOpen(false);
                            setTargetStatus(null);
                        }}
                        title={targetStatus ? nextStatusMap[incident.status]?.confirmTitle : ''}
                    >
                        {targetStatus && (
                            <div className="space-y-4">
                                <p className="text-slate-650 text-xs leading-relaxed">{nextStatusMap[incident.status]?.confirmText}</p>
                                <div className="flex justify-end gap-3 pt-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsConfirmModalOpen(false);
                                            setTargetStatus(null);
                                        }}
                                        className="inline-flex min-h-[38px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAdvanceStatus(targetStatus)}
                                        className={`inline-flex min-h-[38px] items-center justify-center rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                                            nextStatusMap[incident.status]?.colorClass
                                        }`}
                                    >
                                        Confirm & Advance
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>
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

Show.layout = (page: React.ReactNode) => <AdminLayout children={page} />;
