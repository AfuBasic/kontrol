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
    UserPlus,
    Wrench,
} from 'lucide-react';
import React, { useState } from 'react';

import AdminLayout from '@/Layouts/AdminLayout';
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

            {/* Back Button */}
            <div className="mb-4">
                <Link
                    href="/admin/incidents"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
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
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-0.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                {incident.category.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                                Reported {format(new Date(incident.created_at), 'PPP')}
                            </span>
                        </div>

                        <h1 className="text-xl font-black text-slate-900 sm:text-2xl mb-4">
                            {incident.title}
                        </h1>

                        <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-wrap mb-6">
                            {incident.body}
                        </p>

                        {/* Attachment */}
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

                        {/* Reporter & Metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-50 pt-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600">
                                    {incident.reporter.name.charAt(0).toUpperCase()}
                                </div>
                                <span>Reported by <b>{incident.reporter.name}</b> ({incident.reporter.email})</span>
                            </div>

                            <button
                                onClick={handleDeleteIncident}
                                className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Report
                            </button>
                        </div>
                    </div>

                    {/* Admin Comments Thread */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                        <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-slate-900">
                            <MessageSquareMore className="h-5 w-5 text-slate-400" />
                            Community Discussion ({incident.comments_count})
                        </h3>

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
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="text-slate-400 hover:text-red-500"
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
                                                            <button
                                                                onClick={() => handleDeleteComment(reply.id)}
                                                                className="text-slate-400 hover:text-red-500"
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
                            <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100 mb-6">
                                <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                <p className="text-xs text-slate-400">No comments yet.</p>
                            </div>
                        )}

                        {/* Comment Input Form */}
                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleCommentSubmit} className="space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Add an official administrator response..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4"
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

                {/* Right Column: Admin Management Controls */}
                <div className="space-y-6">
                    {/* Status Update Card */}
                    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] sm:p-6">
                        <h3 className="mb-4 text-sm font-black tracking-wider text-slate-400 uppercase">
                            Status & Assignment
                        </h3>

                        {incident.status !== 'closed' ? (
                            <form onSubmit={handleStatusUpdate} className="space-y-4">
                                {/* Status Selection */}
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                        Resolution Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4 font-semibold"
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">
                                        Assign To Staff
                                    </label>
                                    <select
                                        value={data.assigned_to}
                                        onChange={e => setData('assigned_to', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-hidden ring-indigo-100 transition-all focus:border-indigo-500 focus:ring-4 font-semibold"
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
                                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Save Changes
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-3 text-xs text-slate-600">
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
        </>
    );
}
