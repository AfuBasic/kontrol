import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowLeft, CheckCircle2, Clock, Eye, Lock, MapPin, MessageSquare, MessageSquareMore, Send, Trash2, Wrench, X, ZoomIn } from 'lucide-react';
import React, { useState } from 'react';

import { useAdminConfirmation } from '@/Components/ConfirmationProvider';
import Modal from '@/Components/Modal';
import type { Incident, IncidentComment, IncidentStatus, PaginatedData, SharedData } from '@/types';

type Props = {
    incident: Incident;
    comments: PaginatedData<IncidentComment>;
};

const statusSteps: Array<{ key: IncidentStatus; label: string; desc: string }> = [
    { key: 'pending', label: 'Pending', desc: 'Awaiting review' },
    { key: 'acknowledged', label: 'Acknowledged', desc: 'Received & logged' },
    { key: 'resolving', label: 'Resolving', desc: 'Work is active' },
    { key: 'solved', label: 'Solved', desc: 'Proposed solved' },
    { key: 'closed', label: 'Closed', desc: 'Case closed' },
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

export default function Show({ incident, comments }: Props) {
    const { confirm } = useAdminConfirmation();
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const isReporter = incident.reporter.id === authUser?.id;
    const reporterName = isReporter ? 'you' : incident.reporter?.name || 'Deleted User';

    const currentStatusIdx = statusSteps.findIndex((s) => s.key === incident.status);

    const handleDelete = () => {
        confirm({
            title: 'Delete incident report',
            message: 'Are you sure you want to delete this incident report? This action cannot be undone.',
            confirmLabel: 'Delete report',
            onConfirm: () => router.delete(`/security/incidents/${incident.hashid}`),
        });
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        router.post(
            `/security/incidents/${incident.hashid}/comments`,
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
        confirm({
            title: 'Delete comment',
            message: 'Are you sure you want to delete this comment?',
            confirmLabel: 'Delete comment',
            onConfirm: () =>
                router.delete(`/security/incidents/comments/${commentId}`, {
                    preserveScroll: true,
                }),
        });
    };

    const statusStyle = getStatusStyles(incident.status);
    const categoryLabel = typeof incident.category === 'object' ? incident.category.label : incident.category;

    return (
        <>
            <Head title={`Incident Details - ${incident.title}`} />

            <div className="flex flex-col gap-5">
                {/* Back Link */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/security/incidents"
                        className="inline-flex items-center gap-1 text-xs font-black tracking-wider text-slate-500 uppercase transition hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Workspace
                    </Link>

                    {isReporter && incident.status === 'pending' && (
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 transition hover:text-red-700"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Report
                        </button>
                    )}
                </div>

                {/* Primary Card details */}
                <div className="space-y-4 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-black text-slate-500 uppercase">
                            {categoryLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-black text-slate-500 uppercase">
                            Priority: {incident.priority}
                        </span>
                        {incident.is_private && (
                            <span className="inline-flex items-center gap-0.5 rounded border border-rose-200/50 bg-rose-50 px-1.5 py-0.5 text-[8px] font-black text-rose-700 uppercase">
                                <Lock className="h-2 w-2" />
                                Internal
                            </span>
                        )}
                    </div>

                    <div>
                        <h1 className="text-base leading-snug font-black text-slate-900">{incident.title}</h1>
                        <p className="mt-2 text-[11.5px] leading-relaxed font-semibold whitespace-pre-wrap text-slate-700">{incident.body}</p>
                    </div>

                    {incident.location && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                            <span>{incident.location}</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-[10px] font-semibold text-slate-400">
                        <span>Reported by {reporterName}</span>
                        <span>•</span>
                        <span>{format(new Date(incident.created_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                    <h2 className="mb-4 text-xs font-black tracking-wider text-slate-900 uppercase">Resolution Pipeline</h2>
                    <div className="relative ml-2.5 space-y-5 border-l border-slate-100 pl-6">
                        {statusSteps.map((step, idx) => {
                            const isCurrent = step.key === incident.status;
                            const isPast = idx <= currentStatusIdx;

                            return (
                                <div key={step.key} className="relative">
                                    <span
                                        className={`absolute top-0.5 -left-[31px] flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${
                                            isCurrent
                                                ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                                                : isPast
                                                  ? 'border-slate-200 bg-slate-200 text-slate-500'
                                                  : 'text-slate-350 border-slate-200 bg-white'
                                        }`}
                                    >
                                        {isPast && <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className={`text-[11px] font-black ${isCurrent ? 'text-slate-900' : 'text-slate-500'}`}>
                                            {step.label}
                                        </span>
                                        <span className="text-[10px] leading-relaxed font-semibold text-slate-400">{step.desc}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Evidence Attachment */}
                {incident.attachment_url && (
                    <div className="space-y-3 rounded-2xl border border-slate-200/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                        <h2 className="text-xs font-black tracking-wider text-slate-900 uppercase">Evidence File</h2>
                        <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                            {incident.attachment_type === 'video' ? (
                                <video src={incident.attachment_url} className="max-h-56 w-full object-cover" controls />
                            ) : (
                                <div className="group relative cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
                                    <img src={incident.attachment_url} alt="Attachment" className="max-h-56 w-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                                        <ZoomIn className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Comments Section */}
                <div className="rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                    <div className="mb-5 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-xs font-black tracking-wider text-slate-900 uppercase">
                            <MessageSquareMore className="h-4.5 w-4.5 text-indigo-500" />
                            Comments & Updates
                        </h3>
                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[8px] font-black text-slate-500 uppercase">
                            {incident.comments_count} Updates
                        </span>
                    </div>

                    {/* Discussion thread */}
                    {comments.data.length > 0 ? (
                        <div className="mb-6 space-y-4">
                            {comments.data.map((comment) => (
                                <div key={comment.id} className="space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                                            {comment.author.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5">
                                            <div className="mb-1 flex items-start justify-between gap-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-800">{comment.author.name}</span>
                                                    {comment.is_official && (
                                                        <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[8px] font-black text-blue-800 uppercase">
                                                            Official
                                                        </span>
                                                    )}
                                                </div>
                                                {comment.author.id === authUser?.id && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-slate-350 transition hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs leading-relaxed font-semibold text-slate-600">{comment.body}</p>
                                            <div className="mt-2 flex justify-end">
                                                <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Replies */}
                                    {comment.replies &&
                                        comment.replies.map((reply) => (
                                            <div key={reply.id} className="relative flex items-start gap-3 pl-10">
                                                <div className="absolute top-0 bottom-6 left-4.5 w-0.5 bg-slate-200/80" />
                                                <div className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[9px] font-bold text-slate-600">
                                                    {reply.author.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="bg-slate-55/20 flex-1 rounded-2xl border border-slate-200/60 p-3">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800">{reply.author.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            {reply.is_official && (
                                                                <span className="inline-flex items-center rounded border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[8px] font-black text-blue-800 uppercase">
                                                                    Official
                                                                </span>
                                                            )}
                                                            {reply.author.id === authUser?.id && (
                                                                <button
                                                                    onClick={() => handleDeleteComment(reply.id)}
                                                                    className="text-slate-350 transition hover:text-red-500"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs leading-relaxed font-semibold text-slate-600">{reply.body}</p>
                                                    <div className="mt-2 flex justify-end">
                                                        <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase">
                                                            {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
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
                            <p className="text-xs font-bold text-slate-400">No comments yet. Start the conversation!</p>
                        </div>
                    )}

                    {/* Comment Input Textarea */}
                    {incident.status !== 'closed' && (
                        <form onSubmit={handleCommentSubmit} className="space-y-3">
                            <textarea
                                placeholder="Add to the discussion..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                rows={2}
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-900 transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                                maxLength={2000}
                                required
                            />
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submittingComment || !commentText.trim()}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-black tracking-wider text-white uppercase shadow-xs transition hover:bg-slate-800 disabled:opacity-40"
                                >
                                    <Send className="h-3 w-3" />
                                    Comment
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Image Lightbox */}
            {incident.attachment_url && incident.attachment_type !== 'video' && (
                <Modal isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} maxWidth="2xl">
                    <div className="relative flex flex-col items-center bg-slate-950 p-2">
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-4 right-4 z-50 rounded-full bg-slate-900/80 p-2 text-white transition hover:bg-slate-950"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <img src={incident.attachment_url} alt="Full evidence view" className="mt-10 max-h-[80vh] w-auto rounded-lg object-contain" />
                    </div>
                </Modal>
            )}
        </>
    );
}
