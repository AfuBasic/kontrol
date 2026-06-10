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
            return { bg: 'bg-amber-500', text: 'text-amber-700', border: 'border-amber-200/50', icon: <Clock className="h-4 w-4 text-white" />, label: 'Pending' };
        case 'acknowledged':
            return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200/50', icon: <Eye className="h-4 w-4 text-white" />, label: 'Acknowledged' };
        case 'resolving':
            return { bg: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200/50', icon: <Wrench className="h-4 w-4 text-white" />, label: 'Resolving' };
        case 'solved':
            return { bg: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200/50', icon: <CheckCircle2 className="h-4 w-4 text-white" />, label: 'Solved' };
        case 'closed':
            return { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-300', icon: <CheckCircle2 className="h-4 w-4 text-white" />, label: 'Closed' };
        default:
            return { bg: 'bg-slate-500', text: 'text-slate-700', border: 'border-slate-300', icon: <Clock className="h-4 w-4 text-white" />, label: 'Unknown' };
    }
};

export default function Show({ incident, comments, admins, statuses }: Props) {
    const { auth } = usePage<SharedData>().props;
    const authUser = auth?.user;

    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Form for updating status & assignment
    const { data, setData, put, processing: updatingStatus, errors } = useForm({
        status: incident.status,
        assigned_to: incident.assigned_to?.id || '',
    });

    const handleStatusUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/incidents/${incident.hashid}/status`, {
            preserveScroll: true,
            onSuccess: () => {
                // Status updated
            },
        });
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        router.post(
            `/admin/incidents/${incident.hashid}/comments`,
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
            }
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (confirm('Are you sure you want to delete this comment?')) {
            router.delete(`/admin/incidents/comments/${commentId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleDeleteIncident = () => {
        if (confirm('Are you sure you want to delete this incident report? This action cannot be undone.')) {
            router.delete(`/admin/incidents/${incident.hashid}`);
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
                    className="inline-flex min-h-[44px] items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to incidents
                </Link>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left/Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details Card */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[9px] font-black tracking-[0.2em] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 uppercase">
                                {incident.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Reported {format(new Date(incident.created_at), 'PPP')}
                            </span>
                        </div>

                        <h1 className="text-xl font-black text-slate-900 sm:text-2xl mb-4 leading-tight">
                            {incident.title}
                        </h1>

                        <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap mb-6">
                            {incident.body}
                        </p>

                        {/* Attachment Preview / Lightbox Trigger */}
                        {incident.attachment_url && (
                            <div 
                                className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 relative group cursor-zoom-in shadow-xs"
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
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="bg-white/95 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-1.5 active:scale-95 transition-transform">
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
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-5 mt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 border border-slate-200 font-black text-slate-600 text-[9px]">
                                    {incident.reporter.name.charAt(0).toUpperCase()}
                                </div>
                                <span>Reported by <b>{incident.reporter.name}</b> ({incident.reporter.email})</span>
                            </div>

                            <button
                                onClick={handleDeleteIncident}
                                className="inline-flex min-h-[44px] items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Report
                            </button>
                        </div>
                    </div>

                    {/* Admin Comments Thread */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <h3 className="flex items-center gap-2 text-base font-black text-slate-900">
                                <MessageSquareMore className="h-5 w-5 text-indigo-500" />
                                Comments & Updates
                            </h3>
                            <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase bg-slate-50 border border-slate-100/80 px-2.5 py-1 rounded-md">
                                {incident.comments_count} Updates
                            </span>
                        </div>

                        {comments.data.length > 0 ? (
                            <div className="space-y-5 mb-6">
                                {comments.data.map(comment => (
                                    <div key={comment.id} className="space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-600 text-xs">
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 rounded-2xl border border-slate-150 bg-slate-50/50 p-4">
                                                <div className="mb-1 flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                        {comment.author.name}
                                                        {comment.is_official && (
                                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-800 uppercase border border-blue-150">
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
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-slate-450 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                            title="Delete/Moderate Comment"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-xs leading-relaxed text-slate-600">
                                                    {comment.body}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Threaded replies */}
                                        {comment.replies && comment.replies.map(reply => (
                                            <div key={reply.id} className="relative flex gap-3 items-start pl-11">
                                                <div className="absolute left-5 top-0 bottom-6 w-0.5 bg-slate-200/80" />
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 font-bold text-slate-600 text-[10px] z-10">
                                                    {reply.author.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 rounded-2xl border border-slate-150 bg-slate-50/25 p-3.5">
                                                    <div className="mb-1 flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                                            {reply.author.name}
                                                            {reply.is_official && (
                                                                <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black tracking-widest text-blue-800 uppercase border border-blue-150">
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
                                                            <button
                                                                onClick={() => handleDeleteComment(reply.id)}
                                                                className="text-slate-455 hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                                                title="Delete/Moderate Comment"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
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
                            <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 mb-6">
                                <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400">No comments yet.</p>
                            </div>
                        )}

                        {/* Comment Input Form - Capsule layout */}
                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleCommentSubmit} className="space-y-3">
                                <div className="flex gap-2 items-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
                                    <input
                                        type="text"
                                        placeholder="Add an official administrator response..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        className="flex-1 min-h-[44px] bg-transparent border-0 px-3 text-xs text-slate-800 placeholder-slate-400 outline-hidden focus:ring-0"
                                        maxLength={2000}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={submittingComment || !commentText.trim()}
                                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                                    >
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                This incident is closed. Discussion has been locked.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Column: Admin Management Controls */}
                <div className="space-y-6">
                    {/* Status Update Card */}
                    <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-[0_4px_25px_rgba(0,0,0,0.01)] sm:p-6">
                        <h3 className="mb-4 text-[10px] font-black tracking-[0.2em] text-slate-405 uppercase">
                            Status & Assignment
                        </h3>

                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleStatusUpdate} className="space-y-4">
                                {/* Status Selection */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-wider text-slate-400 uppercase mb-1.5">
                                        Resolution Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value as IncidentStatus)}
                                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4 font-semibold"
                                    >
                                        {statuses.map(s => (
                                            <option key={s.value} value={s.value}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.status && (
                                        <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.status}</p>
                                    )}
                                </div>

                                {/* Assignee Selection */}
                                <div>
                                    <label className="block text-[10px] font-black tracking-wider text-slate-400 uppercase mb-1.5">
                                        Assign To Staff
                                    </label>
                                    <select
                                        value={data.assigned_to}
                                        onChange={e => setData('assigned_to', e.target.value)}
                                        className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4 font-semibold"
                                    >
                                        <option value="">Unassigned</option>
                                        {admins.map(adm => (
                                            <option key={adm.id} value={adm.id}>
                                                {adm.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.assigned_to && (
                                        <p className="mt-1 text-[10px] text-red-500 font-bold">{errors.assigned_to}</p>
                                    )}
                                </div>

                                {/* Save Button */}
                                <button
                                    type="submit"
                                    disabled={updatingStatus}
                                    className="w-full inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    Save Changes
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600 border border-slate-200">
                                    <CheckCircle2 className="h-4 w-4 text-slate-500" />
                                    <span>This incident is marked as Closed by the reporter.</span>
                                </div>
                                <div className="text-xs text-slate-500">
                                    {incident.closed_at && (
                                        <p>Closed on {format(new Date(incident.closed_at), 'PPP')}</p>
                                    )}
                                </div>
                            </div>
                        )}
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
                        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4 pt-safe z-10">
                            <button
                                onClick={() => setIsLightboxOpen(false)}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all"
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
