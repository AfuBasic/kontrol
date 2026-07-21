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
    Send,
    ThumbsUp,
    Trash2,
    Wrench,
    X,
    ZoomIn,
    User,
    UserPlus,
    Tag,
    AlertTriangle,
    Shield,
    CornerDownRight
} from 'lucide-react';
import React, { useState } from 'react';
import Modal from '@/Components/Modal';

type AdminUser = {
    id: number;
    name: string;
};

type CommentAuthor = {
    name: string;
    email: string;
};

type IncidentComment = {
    id: number;
    body: string;
    created_at: string;
    author: CommentAuthor;
    replies?: IncidentComment[];
};

type Incident = {
    id: number;
    ulid: string;
    hashid: string;
    title: string;
    body: string;
    category: {
        value: string;
        label: string;
    } | string;
    priority: {
        value: string;
        label: string;
    } | string;
    status: {
        value: string;
        label: string;
    } | string;
    location: string | null;
    is_private: boolean;
    created_at: string;
    updated_at: string;
    acknowledged_at: string | null;
    resolving_at: string | null;
    solved_at: string | null;
    closed_at: string | null;
    upvotes_count: number;
    comments_count: number;
    attachment_url: string | null;
    attachment_type: string | null;
    reporter: {
        id: number;
        name: string;
        email: string;
    };
    reporter_role: string;
    source: string;
    assignee: {
        id: number;
        name: string;
    } | null;
    activities?: Array<{
        id: number;
        description: string;
        created_at: string;
        causer?: { name: string } | null;
    }>;
};

type ActivityEvent = {
    id: number;
    description: string;
    created_at: string;
    causer: { name: string } | null;
};

type Props = {
    incident: Incident;
    comments: {
        data: IncidentComment[];
    };
    admins: AdminUser[];
    statuses: Array<{ value: string; label: string }>;
    categories: Array<{ value: string; label: string }>;
    activities: ActivityEvent[];
};

export default function IncidentShow({ incident, comments, admins, statuses, categories, activities }: Props) {
    const [commentText, setCommentText] = useState('');
    const [replyToId, setReplyToId] = useState<number | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // Form state for status & assignment & priority & category
    const { data, setData, put, processing } = useForm({
        status: typeof incident.status === 'object' ? incident.status.value : incident.status,
        assigned_to: incident.assignee?.id || '',
        priority: typeof incident.priority === 'object' ? incident.priority.value : incident.priority,
        category: typeof incident.category === 'object' ? incident.category.value : incident.category,
    });

    const handleUpdateField = (key: string, value: any) => {
        setData(key as any, value);
        router.put(`/admin/incidents/${incident.hashid}/status`, {
            ...data,
            [key]: value
        }, {
            preserveScroll: true,
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
            router.delete(`/admin/incidents/comments/${commentId}`, {
                preserveScroll: true,
            });
        }
    };

    const handleDeleteIncident = () => {
        if (confirm('Are you sure you want to delete this incident report permanently? This action cannot be undone.')) {
            router.delete(`/admin/incidents/${incident.hashid}`);
        }
    };

    // SLA helper calculations
    const getSlaStatus = () => {
        const created = new Date(incident.created_at).getTime();
        const resolved = incident.solved_at ? new Date(incident.solved_at).getTime() : 
                         incident.closed_at ? new Date(incident.closed_at).getTime() : null;
        
        const nowTime = new Date().getTime();
        const durationLimit = 24 * 60 * 60 * 1000; // 24 hours in ms
        const warningLimit = 16 * 60 * 60 * 1000;  // 16 hours in ms

        if (resolved) {
            const timeTaken = resolved - created;
            const breached = timeTaken > durationLimit;
            return {
                label: breached ? 'SLA Breached' : 'SLA Met',
                style: breached ? 'bg-red-50 text-red-700 border-red-200/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
                indicator: breached ? '🔴' : '🟢',
                breached
            };
        }

        const elapsed = nowTime - created;
        if (elapsed > durationLimit) {
            return {
                label: 'SLA Breached',
                style: 'bg-rose-50 text-rose-700 border-rose-250 animate-pulse',
                indicator: '🔴',
                breached: true
            };
        } else if (elapsed > warningLimit) {
            return {
                label: 'SLA Warning',
                style: 'bg-amber-50 text-amber-700 border-amber-250 animate-pulse',
                indicator: '🟠',
                breached: false
            };
        } else {
            const remainingHours = Math.round((durationLimit - elapsed) / (1000 * 60 * 60));
            return {
                label: `${remainingHours}h remaining`,
                style: 'bg-slate-50 text-slate-700 border-slate-200',
                indicator: '🟢',
                breached: false
            };
        }
    };

    // Priority Styling
    const getPriorityStyles = (val: string) => {
        switch (val) {
            case 'critical':
                return 'bg-rose-50 text-rose-700 border-rose-200/50';
            case 'high':
                return 'bg-orange-50 text-orange-700 border-orange-200/50';
            case 'medium':
                return 'bg-blue-50 text-blue-700 border-blue-200/50';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    const statusVal = typeof incident.status === 'object' ? incident.status.value : incident.status;
    const priorityVal = typeof incident.priority === 'object' ? incident.priority.value : incident.priority;
    const categoryVal = typeof incident.category === 'object' ? incident.category.value : incident.category;

    const slaInfo = getSlaStatus();

    return (
        <>
            <Head title={`Incident Workspace: ${incident.title}`} />

            {/* Back bar */}
            <div className="mb-6 flex items-center justify-between">
                <Link
                    href="/admin/incidents"
                    className="inline-flex items-center gap-1 text-xs font-black tracking-wider uppercase text-slate-500 hover:text-slate-900 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Incident Workspace
                </Link>

                <button
                    onClick={handleDeleteIncident}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <Trash2 className="h-4 w-4" />
                    Delete Report
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* LEFT COLUMN: Main Issue Body, Media, Activity Log & Comments */}
                <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs ring-1 ring-slate-100/50">
                        {/* Header Details */}
                        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                            <span className="inline-flex items-center gap-1 text-slate-500">
                                <Tag className="h-3.5 w-3.5" />
                                {categoryVal.replace('_', ' ')}
                            </span>
                            <span>•</span>
                            <span>Reported {format(new Date(incident.created_at), 'PPP')}</span>
                            {incident.is_private && (
                                <>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 text-rose-600">
                                        <Lock className="h-3 w-3" /> Private
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Title */}
                        <h1 className="text-xl leading-snug font-black text-slate-900 sm:text-2xl">{incident.title}</h1>

                        {/* Location */}
                        {incident.location && (
                            <div className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                <span>{incident.location}</span>
                            </div>
                        )}

                        {/* Body / Description */}
                        <div className="mt-5 border-t border-slate-50 pt-5 text-sm leading-relaxed text-slate-655 whitespace-pre-wrap">
                            {incident.body}
                        </div>

                        {/* Image/Video attachments */}
                        {incident.attachment_url && (
                            <div className="mt-6 border-t border-slate-50 pt-5">
                                <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Evidence / Attachments</h3>
                                <div className="relative group max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs">
                                    {incident.attachment_type === 'image' ? (
                                        <img 
                                            src={incident.attachment_url} 
                                            alt="Incident attachment" 
                                            className="max-h-80 w-full rounded-lg object-cover cursor-pointer"
                                            onClick={() => setIsLightboxOpen(true)}
                                        />
                                    ) : (
                                        <video src={incident.attachment_url} controls className="max-h-80 w-full rounded-lg object-contain" />
                                    )}

                                    {incident.attachment_type === 'image' && (
                                        <button
                                            onClick={() => setIsLightboxOpen(true)}
                                            className="absolute bottom-4 right-4 flex items-center gap-1 rounded-xl bg-slate-950/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-xs transition hover:bg-slate-900"
                                        >
                                            <ZoomIn className="h-3.5 w-3.5" />
                                            Enlarge
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COMMENTS / OPERATIONAL THREAD */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs ring-1 ring-slate-100/50">
                        <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-50 pb-3">
                            <MessageSquare className="h-4.5 w-4.5 text-slate-400" />
                            Operational Log & Discussion ({comments.data.length})
                        </h3>

                        {/* Comments feed */}
                        <div className="space-y-4">
                            {comments.data.map((comment) => (
                                <div key={comment.id} className="rounded-xl bg-slate-50/50 p-4 border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-xs font-black text-indigo-700">
                                                {comment.author.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold text-slate-900">{comment.author.name}</span>
                                                <span className="ml-2 text-[10px] font-bold text-slate-400">
                                                    {formatDistanceToNow(new Date(comment.created_at))} ago
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            className="text-slate-350 hover:text-red-600 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <p className="mt-2.5 text-xs font-semibold leading-relaxed text-slate-655">{comment.body}</p>

                                    {/* Replies */}
                                    {comment.replies && comment.replies.map((reply) => (
                                        <div key={reply.id} className="ml-6 mt-3.5 flex items-start gap-2.5 border-l border-slate-200 pl-4 py-1">
                                            <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-1" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-800">{reply.author.name}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">
                                                        {formatDistanceToNow(new Date(reply.created_at))} ago
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs font-medium text-slate-600">{reply.body}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Inline reply trigger */}
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => setReplyToId(comment.id)}
                                            className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Comment form */}
                        <form onSubmit={handleCommentSubmit} className="mt-6 border-t border-slate-100 pt-5">
                            {replyToId && (
                                <div className="mb-3 flex items-center justify-between rounded-lg bg-indigo-50/50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                                    <span>Replying to comment thread</span>
                                    <button onClick={() => setReplyToId(null)} className="text-indigo-900 hover:text-indigo-700">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}

                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Add update notes, comments, or resolution summaries..."
                                rows={3}
                                className="w-full rounded-xl border-slate-200 text-xs font-semibold placeholder:text-slate-400 focus:border-slate-800 focus:ring-slate-800 focus:outline-hidden"
                            />
                            
                            <div className="mt-3 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submittingComment || !commentText.trim()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-black tracking-wide text-white uppercase hover:bg-slate-800 disabled:opacity-40 transition"
                                >
                                    <Send className="h-3 w-3" />
                                    Post Update
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* ACTIVITY TIMELINE */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs ring-1 ring-slate-100/50">
                        <h3 className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-50 pb-3">
                            <Clock className="h-4.5 w-4.5 text-slate-400" />
                            Activity Timeline ({activities.length})
                        </h3>

                        {activities.length === 0 ? (
                            <p className="text-center text-[11px] font-semibold text-slate-400 py-4">No activity recorded yet.</p>
                        ) : (
                            <ol className="relative space-y-4 border-l border-slate-100 pl-5">
                                {activities.map((event) => (
                                    <li key={event.id} className="relative">
                                        <span className="absolute -left-[22px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
                                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                        </span>
                                        <p className="text-[11px] font-semibold text-slate-700 leading-snug">{event.description}</p>
                                        <div className="mt-0.5 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                            {event.causer && <span>{event.causer.name}</span>}
                                            {event.causer && <span>·</span>}
                                            <span>{event.created_at}</span>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Attributes Panel & SLA Status */}
                <div className="space-y-6">
                    {/* SLA Status Card */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50">
                        <h3 className="mb-3 text-[10px] font-black uppercase tracking-wider text-slate-400">SLA Resolution Target</h3>
                        <div className={`flex flex-col gap-2 rounded-xl border p-4 ${slaInfo.style}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{slaInfo.indicator}</span>
                                <span className="text-xs font-black uppercase tracking-wider">{slaInfo.label}</span>
                            </div>
                            <p className="text-[10px] font-semibold text-slate-500">
                                Estate standard SLA guarantees critical/high reports are resolved or verified within 24 hours.
                            </p>
                        </div>
                    </div>

                    {/* Meta Parameters Form */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50 space-y-4.5">
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">Operational Attributes</h3>
                        
                        {/* Status update */}
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => handleUpdateField('status', e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                            >
                                {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                <option value="closed">Closed (Done)</option>
                            </select>
                        </div>

                        {/* Priority update */}
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Priority</label>
                            <select
                                value={data.priority}
                                onChange={(e) => handleUpdateField('priority', e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>

                        {/* Assignee update */}
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned To</label>
                            <select
                                value={data.assigned_to}
                                onChange={(e) => handleUpdateField('assigned_to', e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                            >
                                <option value="">Unassigned</option>
                                {admins.map(adm => <option key={adm.id} value={adm.id}>{adm.name}</option>)}
                            </select>
                        </div>

                        {/* Category update */}
                        <div>
                            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Category</label>
                            <select
                                value={data.category}
                                onChange={(e) => handleUpdateField('category', e.target.value)}
                                className="w-full rounded-xl border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 focus:border-slate-800 focus:outline-hidden"
                            >
                                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Reporter details */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs ring-1 ring-slate-100/50 space-y-3.5">
                        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-50 pb-2">Reporter Details</h3>
                        <div className="flex items-center gap-3 border-b border-slate-50 pb-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 font-bold text-xs text-slate-500">
                                {incident.reporter.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <span className="block truncate text-xs font-bold text-slate-900">{incident.reporter.name}</span>
                                <span className="block truncate text-[10px] font-bold text-slate-400">{incident.reporter.email}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                                <span className="block font-black text-slate-400 uppercase">Reporter Type</span>
                                <span className="text-xs font-bold text-slate-700">{incident.reporter_role}</span>
                            </div>
                            <div>
                                <span className="block font-black text-slate-400 uppercase">Incident Source</span>
                                <span className="rounded bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 text-[9px] font-black text-slate-500 uppercase inline-block mt-0.5">
                                    {incident.source.replace('_', ' ')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIGHTBOX FOR IMAGES */}
            <AnimatePresence>
                {isLightboxOpen && incident.attachment_url && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-6 right-6 rounded-full bg-slate-850 p-2.5 text-white transition hover:bg-slate-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            src={incident.attachment_url}
                            alt="Attachment fullscreen preview"
                            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                        />
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
